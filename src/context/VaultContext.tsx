import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AssetItem, Sandbox, CurrencyCode, TimeRange, PriceHistoryPoint } from '../types';
import { INITIAL_SANDBOXES, CURRENCIES, generateHistory, upsertPriceHistoryPoint } from '../data/initialData';
import { generateStarterPortfolioForUser } from '../services/portfolioGenerator';
import luffyMangaImg from '../assets/images/luffy_op05_manga_1786710252169.jpg';
import { syncBatchPrices } from '../services/api';
import { useAuth } from './AuthContext';
import {
  loadItemsFromDatabase,
  loadSandboxesFromDatabase,
  saveItemToDatabase,
  deleteItemFromDatabase,
  saveSandboxToDatabase,
  deleteSandboxFromDatabase,
  savePortfolioSummaryToDatabase,
  clearUserVaultInDatabase,
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
  lastSyncTimestamp: number | null;
  isAutoSyncEnabled: boolean;
  setIsAutoSyncEnabled: (enabled: boolean) => void;
  autoSyncIntervalSeconds: number;
  setAutoSyncIntervalSeconds: (secs: number) => void;
  nextSyncCountdown: number;

  // Actions
  addItem: (item: Omit<AssetItem, 'id' | 'lastUpdated'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<AssetItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addSandbox: (sandbox: Omit<Sandbox, 'id' | 'createdAt'>) => Promise<void>;
  deleteSandbox: (id: string) => Promise<void>;
  syncPrices: (forceRefresh?: boolean) => Promise<void>;

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
  periodPerformance: {
    changeUSD: number;
    changePercent: number;
    isPositive: boolean;
    startPriceUSD: number;
    endPriceUSD: number;
  };

  // Data management
  resetToDefaults: () => Promise<void>;
  exportJSON: () => void;
  importJSON: (jsonStr: string) => boolean;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const STORAGE_KEY_CURRENCY = 'collectorvault_currency_v2';
const STORAGE_KEY_AUTOSYNC_ENABLED = 'collectorvault_autosync_enabled_v1';
const STORAGE_KEY_AUTOSYNC_INTERVAL = 'collectorvault_autosync_interval_v1';

// Canonical image mapping for known collectibles to ensure high fidelity rendering
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

function sanitizeItemData(rawItems: AssetItem[]): AssetItem[] {
  return rawItems.map((item) => {
    const canonical =
      CANONICAL_IMAGE_MAP[item.id] ||
      CANONICAL_IMAGE_MAP[item.name.toLowerCase()] ||
      (item.name.toLowerCase().includes('luffy') ? luffyMangaImg : null);

    let sanitizedHistory: PriceHistoryPoint[] = [];
    if (item.priceHistory && item.priceHistory.length > 0) {
      const map = new Map<string, number>();
      item.priceHistory.forEach((p) => {
        if (p && p.date && typeof p.priceUSD === 'number') {
          map.set(p.date, p.priceUSD);
        }
      });
      sanitizedHistory = Array.from(map.entries())
        .map(([date, priceUSD]) => ({ date, priceUSD }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    return {
      ...item,
      imageUrl:
        canonical &&
        (!item.imageUrl ||
          item.imageUrl.includes('unsplash.com') ||
          item.id === 'op-01' ||
          item.name.toLowerCase().includes('luffy') ||
          item.id.startsWith('bey-') ||
          item.id === 'game-01')
          ? canonical
          : item.imageUrl,
      priceHistory: sanitizedHistory.length > 0 ? sanitizedHistory : item.priceHistory,
    };
  });
}

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeUserId } = useAuth();

  const [sandboxes, setSandboxes] = useState<Sandbox[]>(INITIAL_SANDBOXES);
  const [activeSandboxId, setActiveSandboxId] = useState<string>('all');
  const [items, setItems] = useState<AssetItem[]>([]);
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
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(Date.now());
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTOSYNC_ENABLED);
      return stored !== null ? stored === 'true' : true; // Default ON
    } catch {
      return true;
    }
  });
  const [autoSyncIntervalSeconds, setAutoSyncIntervalSeconds] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTOSYNC_INTERVAL);
      return stored ? parseInt(stored, 10) : 60; // Default 60 seconds (1 minute live polling)
    } catch {
      return 60;
    }
  });
  const [nextSyncCountdown, setNextSyncCountdown] = useState<number>(autoSyncIntervalSeconds);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUTOSYNC_ENABLED, String(isAutoSyncEnabled));
    } catch {
      // Ignore
    }
  }, [isAutoSyncEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUTOSYNC_INTERVAL, String(autoSyncIntervalSeconds));
    } catch {
      // Ignore
    }
    setNextSyncCountdown(autoSyncIntervalSeconds);
  }, [autoSyncIntervalSeconds]);

  // Load from PostgreSQL Database on mount or user change
  useEffect(() => {
    setSelectedItem(null);
    setActiveSandboxId('all');

    if (!activeUserId) {
      setItems([]);
      setSandboxes(INITIAL_SANDBOXES);
      return;
    }

    let isMounted = true;

    async function loadUserData() {
      try {
        const [fetchedItems, fetchedSandboxes] = await Promise.all([
          loadItemsFromDatabase(activeUserId),
          loadSandboxesFromDatabase(activeUserId),
        ]);

        if (!isMounted) return;

        if (fetchedItems.length > 0) {
          setItems(sanitizeItemData(fetchedItems));
        } else {
          // Initialize starter portfolio for brand new users
          const starterItems = generateStarterPortfolioForUser(activeUserId!);
          setItems(sanitizeItemData(starterItems));
          for (const it of starterItems) {
            await saveItemToDatabase(it, activeUserId);
          }
          for (const sb of INITIAL_SANDBOXES) {
            await saveSandboxToDatabase(sb, activeUserId);
          }
        }

        if (fetchedSandboxes.length > 0) {
          setSandboxes(fetchedSandboxes);
        } else {
          setSandboxes(INITIAL_SANDBOXES);
        }
      } catch (err) {
        console.warn('Failed to load user data from PostgreSQL database:', err);
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [activeUserId]);

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

  // Synchronize Overall Portfolio Summary to Firestore
  useEffect(() => {
    if (activeUserId && items.length > 0) {
      savePortfolioSummaryToDatabase(activeUserId, {
        userId: activeUserId,
        totalValueUSD,
        totalCostUSD,
        totalGainLossUSD,
        totalGainLossPercent,
        itemCount: items.length,
        sandboxCount: sandboxes.length,
        lastUpdated: new Date().toISOString(),
      });
    }
  }, [activeUserId, items.length, sandboxes.length, totalValueUSD, totalCostUSD, totalGainLossUSD, totalGainLossPercent]);

  // Aggregate Historical Curve across all items in active scope
  const portfolioHistory = useMemo(() => {
    const targetItems = activeSandboxId === 'all'
      ? items
      : items.filter((i) => i.sandboxId === activeSandboxId);

    if (targetItems.length === 0) return [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let daysCount = 30;
    let stepDays = 1;
    if (timeRange === '7D') { daysCount = 7; stepDays = 1; }
    else if (timeRange === '1M') { daysCount = 30; stepDays = 1; }
    else if (timeRange === '3M') { daysCount = 90; stepDays = 2; }
    else if (timeRange === '6M') { daysCount = 180; stepDays = 3; }
    else if (timeRange === '1Y') { daysCount = 365; stepDays = 7; }
    else if (timeRange === 'ALL') { daysCount = 365; stepDays = 7; }

    // Generate timeline date buckets
    const timelineDates: string[] = [];
    for (let i = daysCount; i > 0; i -= stepDays) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      timelineDates.push(d.toISOString().split('T')[0]);
    }
    // Always include exact today
    if (!timelineDates.includes(todayStr)) {
      timelineDates.push(todayStr);
    }

    // Pre-process items' sorted history
    const itemHistories = targetItems.map((item) => {
      const raw = item.priceHistory && item.priceHistory.length > 0
        ? [...item.priceHistory]
        : generateHistory(item.currentPriceUSD, 'steady', 0.8, 365);
      
      // Ensure deduplicated and sorted
      const map = new Map<string, number>();
      raw.forEach((p) => {
        if (p && p.date) map.set(p.date, p.priceUSD);
      });
      map.set(todayStr, item.currentPriceUSD);

      const sorted = Array.from(map.entries())
        .map(([date, priceUSD]) => ({ date, priceUSD }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        item,
        sortedHistory: sorted,
      };
    });

    const result: PriceHistoryPoint[] = timelineDates.map((targetDate) => {
      if (targetDate === todayStr) {
        // Guarantee exact match with active totalValueUSD
        const total = targetItems.reduce((acc, item) => acc + item.currentPriceUSD * item.quantity, 0);
        return { date: targetDate, priceUSD: Number(total.toFixed(2)) };
      }

      let dateTotal = 0;
      itemHistories.forEach(({ item, sortedHistory }) => {
        if (sortedHistory.length === 0) {
          dateTotal += item.currentPriceUSD * item.quantity;
          return;
        }

        // Exact match
        const exact = sortedHistory.find((p) => p.date === targetDate);
        if (exact) {
          dateTotal += exact.priceUSD * item.quantity;
          return;
        }

        // Target date is before earliest history point
        if (targetDate < sortedHistory[0].date) {
          const basePrice = item.purchasePriceUSD || sortedHistory[0].priceUSD;
          dateTotal += basePrice * item.quantity;
          return;
        }

        // Target date is after latest history point
        if (targetDate >= sortedHistory[sortedHistory.length - 1].date) {
          dateTotal += item.currentPriceUSD * item.quantity;
          return;
        }

        // Find surrounding points for linear interpolation
        let prev = sortedHistory[0];
        let next = sortedHistory[sortedHistory.length - 1];
        for (let idx = 0; idx < sortedHistory.length - 1; idx++) {
          if (sortedHistory[idx].date <= targetDate && sortedHistory[idx + 1].date >= targetDate) {
            prev = sortedHistory[idx];
            next = sortedHistory[idx + 1];
            break;
          }
        }

        const tPrev = new Date(prev.date).getTime();
        const tNext = new Date(next.date).getTime();
        const tTarget = new Date(targetDate).getTime();

        let interpolatedPrice = prev.priceUSD;
        if (tNext > tPrev) {
          const ratio = (tTarget - tPrev) / (tNext - tPrev);
          interpolatedPrice = prev.priceUSD + (next.priceUSD - prev.priceUSD) * ratio;
        }

        dateTotal += interpolatedPrice * item.quantity;
      });

      return {
        date: targetDate,
        priceUSD: Number(dateTotal.toFixed(2)),
      };
    });

    return result;
  }, [items, activeSandboxId, timeRange]);

  // Dynamic Period Performance Metrics (tied to active timeRange & portfolioHistory)
  const periodPerformance = useMemo(() => {
    if (portfolioHistory.length < 2) {
      return {
        changeUSD: totalGainLossUSD,
        changePercent: totalGainLossPercent,
        isPositive: totalGainLossUSD >= 0,
        startPriceUSD: totalCostUSD,
        endPriceUSD: totalValueUSD,
      };
    }

    const startPriceUSD = portfolioHistory[0].priceUSD;
    const endPriceUSD = portfolioHistory[portfolioHistory.length - 1].priceUSD;
    const changeUSD = endPriceUSD - startPriceUSD;
    const changePercent = startPriceUSD > 0 ? (changeUSD / startPriceUSD) * 100 : 0;

    return {
      changeUSD: Number(changeUSD.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      isPositive: changeUSD >= 0,
      startPriceUSD,
      endPriceUSD,
    };
  }, [portfolioHistory, totalGainLossUSD, totalGainLossPercent, totalCostUSD, totalValueUSD]);

  // Actions
  const addItem = async (itemData: Omit<AssetItem, 'id' | 'lastUpdated'>) => {
    if (!activeUserId) return;
    const newItem: AssetItem = {
      ...itemData,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: activeUserId,
      lastUpdated: new Date().toISOString(),
      priceHistory: itemData.priceHistory && itemData.priceHistory.length > 0
        ? itemData.priceHistory
        : generateHistory(itemData.currentPriceUSD, 'bullish', 0.75, 365),
    };
    // Update local state immediately for instant feedback
    setItems((prev) => [newItem, ...prev]);
    // Persist to Firestore
    await saveItemToDatabase(newItem, activeUserId);
  };

  const updateItem = async (id: string, updates: Partial<AssetItem>) => {
    if (!activeUserId) return;
    const itemToUpdate = items.find((i) => i.id === id);
    if (!itemToUpdate) return;

    const updated: AssetItem = { ...itemToUpdate, ...updates, lastUpdated: new Date().toISOString() };
    if (updates.currentPriceUSD && updates.currentPriceUSD !== itemToUpdate.currentPriceUSD) {
      const todayStr = new Date().toISOString().split('T')[0];
      updated.priceHistory = upsertPriceHistoryPoint(updated.priceHistory, todayStr, updates.currentPriceUSD);
    }

    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    if (selectedItem?.id === id) {
      setSelectedItem(updated);
    }
    await saveItemToDatabase(updated, activeUserId);
  };

  const deleteItem = async (id: string) => {
    if (!activeUserId) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    await deleteItemFromDatabase(id, activeUserId);
  };

  const addSandbox = async (sandboxData: Omit<Sandbox, 'id' | 'createdAt'>) => {
    if (!activeUserId) return;
    const newSandbox: Sandbox = {
      ...sandboxData,
      id: `sandbox-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
      userId: activeUserId,
    };
    setSandboxes((prev) => [...prev, newSandbox]);
    setActiveSandboxId(newSandbox.id);
    await saveSandboxToDatabase(newSandbox, activeUserId);
  };

  const deleteSandbox = async (id: string) => {
    if (!activeUserId) return;
    setSandboxes((prev) => prev.filter((s) => s.id !== id));
    const itemsToDelete = items.filter((i) => i.sandboxId === id);
    setItems((prev) => prev.filter((i) => i.sandboxId !== id));
    if (activeSandboxId === id) {
      setActiveSandboxId('all');
    }
    await deleteSandboxFromDatabase(id, activeUserId);
    for (const it of itemsToDelete) {
      await deleteItemFromDatabase(it.id, activeUserId);
    }
  };

  const syncPrices = async (forceRefresh = false) => {
    if (!activeUserId || items.length === 0) return;
    try {
      setIsSyncing(true);
      const syncResult = await syncBatchPrices(
        items.map((i) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          currentPriceUSD: i.currentPriceUSD,
          condition: i.condition,
        })),
        forceRefresh
      );

      if (syncResult && syncResult.updated) {
        const updateMap = new Map<string, { currentPriceUSD: number; previousPriceUSD_24h?: number; marketSource?: string }>();
        syncResult.updated.forEach((u: any) => updateMap.set(u.id, u));

        const updatedItemsList: AssetItem[] = [];

        setItems((prev) =>
          prev.map((item) => {
            const match = updateMap.get(item.id);
            if (match) {
              const todayStr = new Date().toISOString().split('T')[0];
              const history = upsertPriceHistoryPoint(item.priceHistory, todayStr, match.currentPriceUSD);

              const updatedItem: AssetItem = {
                ...item,
                currentPriceUSD: match.currentPriceUSD,
                previousPriceUSD_24h: match.previousPriceUSD_24h ?? item.currentPriceUSD,
                marketSource: match.marketSource || item.marketSource,
                priceHistory: history,
                lastUpdated: new Date().toISOString(),
              };
              updatedItemsList.push(updatedItem);
              return updatedItem;
            }
            return item;
          })
        );

        for (const item of updatedItemsList) {
          await saveItemToDatabase(item, activeUserId);
        }
      }
      const now = Date.now();
      setLastSyncTimestamp(now);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setNextSyncCountdown(autoSyncIntervalSeconds);
    } catch (err) {
      console.error('Failed to sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Automated Real-Time Background Price Sync Timer & Countdown
  useEffect(() => {
    if (!isAutoSyncEnabled || !activeUserId || items.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setNextSyncCountdown((prev) => {
        if (prev <= 1) {
          // Trigger automatic real-time background price refresh
          syncPrices(false);
          return autoSyncIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoSyncEnabled, activeUserId, items.length, autoSyncIntervalSeconds]);

  // Real-Time Re-sync on Window Tab Focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAutoSyncEnabled && activeUserId && items.length > 0) {
        const elapsedSeconds = lastSyncTimestamp ? (Date.now() - lastSyncTimestamp) / 1000 : 999;
        if (elapsedSeconds > 45) {
          syncPrices(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAutoSyncEnabled, activeUserId, items.length, lastSyncTimestamp]);

  const resetToDefaults = async () => {
    if (!activeUserId) return;
    await clearUserVaultInDatabase(activeUserId);
    const starterItems = generateStarterPortfolioForUser(activeUserId);
    setItems(starterItems);
    setSandboxes(INITIAL_SANDBOXES);
    setActiveSandboxId('all');
    for (const it of starterItems) {
      await saveItemToDatabase(it, activeUserId);
    }
    for (const sb of INITIAL_SANDBOXES) {
      await saveSandboxToDatabase(sb, activeUserId);
    }
  };

  const exportJSON = () => {
    const data = {
      version: 4,
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
    if (!activeUserId) return false;
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.items) && Array.isArray(parsed.sandboxes)) {
        const sanitized = sanitizeItemData(parsed.items).map((it) => ({
          ...it,
          userId: activeUserId,
        }));
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
        lastSyncTimestamp,
        isAutoSyncEnabled,
        setIsAutoSyncEnabled,
        autoSyncIntervalSeconds,
        setAutoSyncIntervalSeconds,
        nextSyncCountdown,
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
        periodPerformance,
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
