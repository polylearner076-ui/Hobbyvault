import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AssetItem, Sandbox, CurrencyCode, TimeRange, PriceHistoryPoint } from '../types';
import { INITIAL_SANDBOXES, INITIAL_ITEMS, CURRENCIES, generateHistory } from '../data/initialData';
import luffyMangaImg from '../assets/images/luffy_op05_manga_1786710252169.jpg';
import { syncBatchPrices } from '../services/api';
import { useAuth } from './AuthContext';
import {
  loadItemsFromDatabase,
  saveItemToDatabase,
  deleteItemFromDatabase,
  loadSandboxesFromDatabase,
  saveSandboxToDatabase,
  deleteSandboxFromDatabase,
  seedInitialDatabase,
} from '../services/dbService';

interface VaultContextType {
  sandboxes: Sandbox[];
  activeSandboxId: string; // 'all' or specific sandbox ID
  setActiveSandboxId: (id: string) => void;
  items: AssetItem[];
  filteredItems: AssetItem[];
  activeSandbox: Sandbox | null;
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCondition: string;
  setSelectedCondition: (cond: string) => void;
  sortBy: 'value_desc' | 'value_asc' | 'gain_desc' | 'gain_asc' | 'name_asc' | 'recent';
  setSortBy: (sort: 'value_desc' | 'value_asc' | 'gain_desc' | 'gain_asc' | 'name_asc' | 'recent') => void;
  selectedItem: AssetItem | null;
  setSelectedItem: (item: AssetItem | null) => void;
  isSyncing: boolean;
  lastSyncTime: string | null;

  // Actions
  addItem: (item: Omit<AssetItem, 'id' | 'lastUpdated'>) => void;
  updateItem: (id: string, updates: Partial<AssetItem>) => void;
  deleteItem: (id: string) => void;
  addSandbox: (sandbox: Omit<Sandbox, 'id' | 'createdAt'>) => void;
  deleteSandbox: (id: string) => void;
  syncPrices: () => Promise<void>;
  
  // Formatters & helpers
  formatPrice: (priceUSD: number) => string;
  convertPrice: (priceUSD: number) => number;
  currencySymbol: string;
  
  // Aggregate Metrics
  totalValueUSD: number;
  totalCostUSD: number;
  totalGainLossUSD: number;
  totalGainLossPercent: number;
  change24hUSD: number;
  change24hPercent: number;
  change30dUSD: number;
  change30dPercent: number;
  portfolioHistory: PriceHistoryPoint[];

  // Data management
  resetToDefaults: () => void;
  exportJSON: () => void;
  importJSON: (jsonStr: string) => boolean;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const STORAGE_KEY_ITEMS = 'collectorvault_items_v3';
const STORAGE_KEY_SANDBOXES = 'collectorvault_sandboxes_v3';
const STORAGE_KEY_CURRENCY = 'collectorvault_currency_v2';

// Canonical image mapping for known collectibles to replace any old Unsplash placeholders
const CANONICAL_IMAGE_MAP: Record<string, string> = {
  'op-01': luffyMangaImg,
  'poke-01': 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
  'poke-02': 'https://images.pokemontcg.io/swsh7/215_hires.png',
  'poke-03': 'https://images.pokemontcg.io/svp/85_hires.png',
  'poke-04': 'https://images.pokemontcg.io/swsh8/271_hires.png',
  'mtg-01': 'https://cards.scryfall.io/normal/front/a/9/a9738cda-adb1-47fb-9f4c-ecd930228c4d.jpg',
  'mtg-02': 'https://cards.scryfall.io/normal/front/d/5/d5806e68-1054-458e-866d-1f2470f682b2.jpg',
  'mtg-03': 'https://cards.scryfall.io/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
};

// Populate map from INITIAL_ITEMS
INITIAL_ITEMS.forEach((item) => {
  if (item.imageUrl && !item.imageUrl.includes('unsplash.com')) {
    CANONICAL_IMAGE_MAP[item.id] = item.imageUrl;
    CANONICAL_IMAGE_MAP[item.name.toLowerCase()] = item.imageUrl;
  }
});

function sanitizeItemImages(rawItems: AssetItem[]): AssetItem[] {
  return rawItems.map((item) => {
    // Check if image is missing, contains unsplash placeholder, or has a direct canonical match
    const canonical =
      CANONICAL_IMAGE_MAP[item.id] ||
      CANONICAL_IMAGE_MAP[item.name.toLowerCase()] ||
      (item.name.toLowerCase().includes('luffy') ? luffyMangaImg : null);

    if (canonical && (!item.imageUrl || item.imageUrl.includes('unsplash.com') || item.id === 'op-01' || item.name.toLowerCase().includes('luffy') || item.id.startsWith('bey-') || item.id === 'game-01')) {
      return { ...item, imageUrl: canonical };
    }
    return item;
  });
}

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeUserId } = useAuth();

  const getStorageKeyItems = (uid: string | null) => `collectorvault_items_${uid || 'guest'}_v4`;
  const getStorageKeySandboxes = (uid: string | null) => `collectorvault_sandboxes_${uid || 'guest'}_v4`;

  const [sandboxes, setSandboxes] = useState<Sandbox[]>(() => {
    try {
      const saved = localStorage.getItem(getStorageKeySandboxes(activeUserId)) || localStorage.getItem(STORAGE_KEY_SANDBOXES);
      return saved ? JSON.parse(saved) : INITIAL_SANDBOXES;
    } catch {
      return INITIAL_SANDBOXES;
    }
  });

  const [activeSandboxId, setActiveSandboxId] = useState<string>('all');

  const [items, setItems] = useState<AssetItem[]>(() => {
    try {
      const saved = localStorage.getItem(getStorageKeyItems(activeUserId)) || localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeItemImages(parsed);
      }
      return INITIAL_ITEMS;
    } catch {
      return INITIAL_ITEMS;
    }
  });

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY_CURRENCY) as CurrencyCode) || 'USD';
    } catch {
      return 'USD';
    }
  });

  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'value_desc' | 'value_asc' | 'gain_desc' | 'gain_asc' | 'name_asc' | 'recent'>('value_desc');
  const [selectedItem, setSelectedItem] = useState<AssetItem | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Account-scoped Database Load & Seed
  useEffect(() => {
    let isMounted = true;

    async function initAccountDatabase() {
      try {
        const dbItems = await loadItemsFromDatabase(activeUserId);
        const dbSandboxes = await loadSandboxesFromDatabase(activeUserId);

        if (!isMounted) return;

        if (dbItems.length > 0) {
          const sanitized = sanitizeItemImages(dbItems);
          setItems(sanitized);
        } else {
          // Check local cache for this account, or seed defaults
          const saved = localStorage.getItem(getStorageKeyItems(activeUserId));
          if (saved) {
            const parsed = JSON.parse(saved);
            const sanitized = sanitizeItemImages(parsed);
            setItems(sanitized);
            await seedInitialDatabase(sanitized, INITIAL_SANDBOXES, activeUserId);
          } else {
            setItems(INITIAL_ITEMS);
            await seedInitialDatabase(INITIAL_ITEMS, INITIAL_SANDBOXES, activeUserId);
          }
        }

        if (dbSandboxes.length > 0) {
          setSandboxes(dbSandboxes);
        } else {
          setSandboxes(INITIAL_SANDBOXES);
        }
      } catch (err) {
        console.warn('Database initialization catch:', err);
      }
    }

    initAccountDatabase();

    return () => {
      isMounted = false;
    };
  }, [activeUserId]);

  // Save to account-scoped localStorage
  useEffect(() => {
    localStorage.setItem(getStorageKeyItems(activeUserId), JSON.stringify(items));
  }, [items, activeUserId]);

  useEffect(() => {
    localStorage.setItem(getStorageKeySandboxes(activeUserId), JSON.stringify(sandboxes));
  }, [sandboxes, activeUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENCY, currency);
  }, [currency]);

  // Active Sandbox object
  const activeSandbox = useMemo(() => {
    if (activeSandboxId === 'all') return null;
    return sandboxes.find((s) => s.id === activeSandboxId) || null;
  }, [sandboxes, activeSandboxId]);

  // Currency helpers
  const currencyConfig = CURRENCIES[currency] || CURRENCIES.USD;
  const currencySymbol = currencyConfig.symbol;

  const convertPrice = (priceUSD: number) => {
    return priceUSD * currencyConfig.rateToUSD;
  };

  const formatPrice = (priceUSD: number) => {
    const converted = convertPrice(priceUSD);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyConfig.code,
      minimumFractionDigits: converted > 1000 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  // Filtered and sorted items based on current active sandbox & controls
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by sandbox if not 'all'
    if (activeSandboxId !== 'all') {
      result = result.filter((item) => item.sandboxId === activeSandboxId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q)) ||
          item.cardSpecs?.setName?.toLowerCase().includes(q) ||
          item.beybladeSpecs?.blade?.toLowerCase().includes(q) ||
          item.beybladeSpecs?.generation?.toLowerCase().includes(q)
      );
    }

    // Filter by condition
    if (selectedCondition !== 'ALL') {
      result = result.filter((item) => item.condition === selectedCondition);
    }

    // Sort
    result.sort((a, b) => {
      const totalValA = a.currentPriceUSD * a.quantity;
      const totalValB = b.currentPriceUSD * b.quantity;
      const totalCostA = a.purchasePriceUSD * a.quantity;
      const totalCostB = b.purchasePriceUSD * b.quantity;
      const gainA = totalCostA > 0 ? (totalValA - totalCostA) / totalCostA : 0;
      const gainB = totalCostB > 0 ? (totalValB - totalCostB) / totalCostB : 0;

      switch (sortBy) {
        case 'value_desc':
          return totalValB - totalValA;
        case 'value_asc':
          return totalValA - totalValB;
        case 'gain_desc':
          return gainB - gainA;
        case 'gain_asc':
          return gainA - gainB;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [items, activeSandboxId, searchQuery, selectedCondition, sortBy]);

  // Aggregate Metrics for current Sandbox or All
  const {
    totalValueUSD,
    totalCostUSD,
    totalGainLossUSD,
    totalGainLossPercent,
    change24hUSD,
    change24hPercent,
    change30dUSD,
    change30dPercent,
  } = useMemo(() => {
    const targetItems = activeSandboxId === 'all'
      ? items
      : items.filter((i) => i.sandboxId === activeSandboxId);

    let val = 0;
    let cost = 0;
    let val24h = 0;
    let val30d = 0;

    targetItems.forEach((item) => {
      const itemVal = item.currentPriceUSD * item.quantity;
      const itemCost = item.purchasePriceUSD * item.quantity;
      const prev24 = (item.previousPriceUSD_24h ?? item.currentPriceUSD) * item.quantity;
      const prev30 = (item.previousPriceUSD_30d ?? item.currentPriceUSD * 0.95) * item.quantity;

      val += itemVal;
      cost += itemCost;
      val24h += prev24;
      val30d += prev30;
    });

    const gainLossUSD = val - cost;
    const gainLossPercent = cost > 0 ? (gainLossUSD / cost) * 100 : 0;
    const d24USD = val - val24h;
    const d24Percent = val24h > 0 ? (d24USD / val24h) * 100 : 0;
    const d30USD = val - val30d;
    const d30Percent = val30d > 0 ? (d30USD / val30d) * 100 : 0;

    return {
      totalValueUSD: val,
      totalCostUSD: cost,
      totalGainLossUSD: gainLossUSD,
      totalGainLossPercent: gainLossPercent,
      change24hUSD: d24USD,
      change24hPercent: d24Percent,
      change30dUSD: d30USD,
      change30dPercent: d30Percent,
    };
  }, [items, activeSandboxId]);

  // Aggregate Historical Curve across all items in active scope
  const portfolioHistory = useMemo(() => {
    const targetItems = activeSandboxId === 'all'
      ? items
      : items.filter((i) => i.sandboxId === activeSandboxId);

    if (targetItems.length === 0) return [];

    // Combine dates across items
    const dateMap: Record<string, number> = {};

    targetItems.forEach((item) => {
      const history = item.priceHistory && item.priceHistory.length > 0
        ? item.priceHistory
        : generateHistory(item.currentPriceUSD, 'steady', 0.8, 365);

      history.forEach((point) => {
        dateMap[point.date] = (dateMap[point.date] || 0) + point.priceUSD * item.quantity;
      });
    });

    const sortedDates = Object.keys(dateMap).sort();
    const fullPoints: PriceHistoryPoint[] = sortedDates.map((date) => ({
      date,
      priceUSD: Number(dateMap[date].toFixed(2)),
    }));

    // Filter points based on selected TimeRange
    const now = new Date();
    let daysToKeep = 30;
    if (timeRange === '7D') daysToKeep = 7;
    if (timeRange === '1M') daysToKeep = 30;
    if (timeRange === '3M') daysToKeep = 90;
    if (timeRange === '6M') daysToKeep = 180;
    if (timeRange === '1Y') daysToKeep = 365;
    if (timeRange === 'ALL') daysToKeep = 9999;

    const cutoffDate = new Date(now.getTime() - daysToKeep * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const filtered = fullPoints.filter((p) => p.date >= cutoffDate);
    return filtered.length > 0 ? filtered : fullPoints;
  }, [items, activeSandboxId, timeRange]);

  // Actions
  const addItem = (itemData: Omit<AssetItem, 'id' | 'lastUpdated'>) => {
    const newItem: AssetItem = {
      ...itemData,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      lastUpdated: new Date().toISOString(),
      priceHistory: itemData.priceHistory && itemData.priceHistory.length > 0
        ? itemData.priceHistory
        : generateHistory(itemData.currentPriceUSD, 'bullish', 0.75, 365),
    };
    setItems((prev) => [newItem, ...prev]);
    saveItemToDatabase(newItem, activeUserId);
  };

  const updateItem = (id: string, updates: Partial<AssetItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates, lastUpdated: new Date().toISOString() };
          // If price changed, append to history
          if (updates.currentPriceUSD && updates.currentPriceUSD !== item.currentPriceUSD) {
            const todayStr = new Date().toISOString().split('T')[0];
            const history = [...(updated.priceHistory || [])];
            history.push({ date: todayStr, priceUSD: updates.currentPriceUSD });
            updated.priceHistory = history;
          }
          if (selectedItem?.id === id) {
            setSelectedItem(updated);
          }
          saveItemToDatabase(updated, activeUserId);
          return updated;
        }
        return item;
      })
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    deleteItemFromDatabase(id, activeUserId);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const addSandbox = (sandboxData: Omit<Sandbox, 'id' | 'createdAt'>) => {
    const newSandbox: Sandbox = {
      ...sandboxData,
      id: `sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSandboxes((prev) => [...prev, newSandbox]);
    setActiveSandboxId(newSandbox.id);
    saveSandboxToDatabase(newSandbox, activeUserId);
  };

  const deleteSandbox = (id: string) => {
    setSandboxes((prev) => prev.filter((s) => s.id !== id));
    deleteSandboxFromDatabase(id, activeUserId);
    // Reassign items or remove them
    setItems((prev) => prev.filter((i) => i.sandboxId !== id));
    if (activeSandboxId === id) {
      setActiveSandboxId('all');
    }
  };

  const syncPrices = async () => {
    try {
      setIsSyncing(true);
      const syncResult = await syncBatchPrices(
        items.map((i) => ({ id: i.id, currentPriceUSD: i.currentPriceUSD }))
      );

      if (syncResult && syncResult.updated) {
        const updateMap = new Map<string, { currentPriceUSD: number; previousPriceUSD_24h?: number; marketSource?: string }>();
        syncResult.updated.forEach((u: any) => updateMap.set(u.id, u));

        setItems((prev) =>
          prev.map((item) => {
            const match = updateMap.get(item.id);
            if (match) {
              const todayStr = new Date().toISOString().split('T')[0];
              const history = [...(item.priceHistory || [])];
              history.push({ date: todayStr, priceUSD: match.currentPriceUSD });

              const updatedItem: AssetItem = {
                ...item,
                currentPriceUSD: match.currentPriceUSD,
                previousPriceUSD_24h: match.previousPriceUSD_24h ?? item.currentPriceUSD,
                marketSource: match.marketSource || item.marketSource,
                priceHistory: history,
                lastUpdated: new Date().toISOString(),
              };
              saveItemToDatabase(updatedItem, activeUserId);
              return updatedItem;
            }
            return item;
          })
        );
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const resetToDefaults = () => {
    setSandboxes(INITIAL_SANDBOXES);
    setItems(INITIAL_ITEMS);
    setActiveSandboxId('all');
    seedInitialDatabase(INITIAL_ITEMS, INITIAL_SANDBOXES, activeUserId);
  };

  const exportJSON = () => {
    const data = {
      version: 3,
      exportDate: new Date().toISOString(),
      userId: activeUserId,
      sandboxes,
      items,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CollectorVault-Backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.items) && Array.isArray(parsed.sandboxes)) {
        const sanitized = sanitizeItemImages(parsed.items);
        setItems(sanitized);
        setSandboxes(parsed.sandboxes);
        sanitized.forEach((it) => saveItemToDatabase(it, activeUserId));
        parsed.sandboxes.forEach((sb: Sandbox) => saveSandboxToDatabase(sb, activeUserId));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <VaultContext.Provider
      value={{
        sandboxes,
        activeSandboxId,
        setActiveSandboxId,
        items,
        filteredItems,
        activeSandbox,
        currency,
        setCurrency,
        timeRange,
        setTimeRange,
        searchQuery,
        setSearchQuery,
        selectedCondition,
        setSelectedCondition,
        sortBy,
        setSortBy,
        selectedItem,
        setSelectedItem,
        isSyncing,
        lastSyncTime,
        addItem,
        updateItem,
        deleteItem,
        addSandbox,
        deleteSandbox,
        syncPrices,
        formatPrice,
        convertPrice,
        currencySymbol,
        totalValueUSD,
        totalCostUSD,
        totalGainLossUSD,
        totalGainLossPercent,
        change24hUSD,
        change24hPercent,
        change30dUSD,
        change30dPercent,
        portfolioHistory,
        resetToDefaults,
        exportJSON,
        importJSON,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};

