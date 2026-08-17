import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AssetItem, Sandbox, CurrencyCode, TimeRange, PriceHistoryPoint, StorageUnit, StorageLocation, AgentFilter, CategoryTypeMeta, AgentBackgroundTask, AgentQueryResult } from '../types';
import { INITIAL_SANDBOXES, CURRENCIES, generateHistory, upsertPriceHistoryPoint } from '../data/initialData';
import {
  calculateItemTotalValuation,
  calculateItemTotalCost,
  ensureCopiesForAsset,
} from '../utils/conditionUtils';
import { getAllCategoryMetas, saveCustomCategoryMeta } from '../utils/categoryUtils';
import { generateStarterPortfolioForUser } from '../services/portfolioGenerator';
import luffyMangaImg from '../assets/images/luffy_op05_manga_1786710252169.jpg';
import { syncBatchPrices, queryMetaAgent } from '../services/api';
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

export const DEFAULT_STORAGE_UNITS: StorageUnit[] = [
  {
    id: 'unit-safe-pelican',
    metaStorage: 'Master Fireproof Safe (Office)',
    container: 'Pelican 1500 Slab Case',
    type: 'slab_case',
    notes: 'Heavy-duty waterproof & fire-resistant lockbox for high-grade slabs',
  },
  {
    id: 'unit-safe-vaultx',
    metaStorage: 'Master Fireproof Safe (Office)',
    container: 'VaultX 12-Pocket Premium Zip Binder',
    type: 'binder',
    notes: 'Side-loading 12-pocket archival binder for master sets',
  },
  {
    id: 'unit-display-showcase',
    metaStorage: 'Display Cabinet (Living Room)',
    container: 'Acrylic Display Showcase Tier 1',
    type: 'display',
    notes: 'UV-blocking acrylic showcase stand',
  },
  {
    id: 'unit-bank-deposit',
    metaStorage: 'Bank Safe Deposit Box #412',
    container: 'Metal Security Box',
    type: 'deposit_box',
    notes: 'Institutional high-security lockbox',
  },
  {
    id: 'unit-archive-monster',
    metaStorage: 'Archive Storage Closet',
    container: 'BCW 3200-ct Monster Box',
    type: 'box',
    notes: 'Bulk and raw playables storage box',
  },
];

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

  // Category & Tag Filter States
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  availableTags: { tag: string; count: number }[];
  availableCategories: { id: string; label: string; count: number }[];
  clearAllFilters: () => void;

  // Active Top-Level Microservice View
  activeView: 'portfolio' | 'storage';
  setActiveView: (view: 'portfolio' | 'storage') => void;
  storageFocusLocation: { meta?: string; container?: string } | null;
  setStorageFocusLocation: (loc: { meta?: string; container?: string } | null) => void;

  // Agentic AI System & Meta-Filter
  agentActiveFilter: AgentFilter | null;
  setAgentActiveFilter: (filter: AgentFilter | null) => void;
  clearAgentActiveFilter: () => void;

  // Background AI Agent Tasks & Result Windows
  agentBackgroundTasks: AgentBackgroundTask[];
  startAgentBackgroundTask: (prompt: string, model?: string) => Promise<string>;
  dismissBackgroundTask: (taskId: string) => void;
  openAgentResultWindow: (query: string, result: AgentQueryResult) => string;

  // Category Metas & Custom Category Types
  categoryMetas: CategoryTypeMeta[];
  addCustomCategoryMeta: (meta: CategoryTypeMeta) => CategoryTypeMeta[];

  // Storage Units & Locations Management
  storageUnits: StorageUnit[];
  starredStorageKeys: string[];
  toggleStarLocation: (key: string) => void;
  isLocationStarred: (key: string) => boolean;
  addStorageUnit: (unit: Omit<StorageUnit, 'id' | 'createdAt'>) => StorageUnit;
  deleteStorageUnit: (id: string) => void;
  deleteStorageLocation: (metaStorage: string, container?: string) => Promise<{ success: boolean; message: string }>;
  updateStorageUnit: (id: string, updates: Partial<StorageUnit>) => void;
  switchItemStorage: (itemId: string, newStorage: StorageLocation) => Promise<void>;
  batchSwitchItemStorage: (itemIds: string[], newStorage: StorageLocation) => Promise<void>;

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
const STORAGE_KEY_STORAGE_UNITS = 'collectorvault_storage_units_v1';
const STORAGE_KEY_STARRED_STORAGES = 'collectorvault_starred_storages_v1';
const STORAGE_KEY_ACTIVE_VIEW = 'collectorvault_active_view_v1';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
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

  // Active microservice view: 'portfolio' | 'storage'
  const [activeView, setActiveView] = useState<'portfolio' | 'storage'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_VIEW);
      return stored === 'storage' ? 'storage' : 'portfolio';
    } catch {
      return 'portfolio';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_VIEW, activeView);
    } catch {}
  }, [activeView]);

  // Storage Focus location
  const [storageFocusLocation, setStorageFocusLocation] = useState<{ meta?: string; container?: string } | null>(null);

  // Agentic AI System Filter State (travels across vault portfolios and physical storage)
  const [agentActiveFilter, setAgentActiveFilter] = useState<AgentFilter | null>(null);
  const clearAgentActiveFilter = () => setAgentActiveFilter(null);

  // Dynamic Category Types Metadata Registry
  const [categoryMetas, setCategoryMetas] = useState<CategoryTypeMeta[]>(() => getAllCategoryMetas());
  const addCustomCategoryMeta = (meta: CategoryTypeMeta) => {
    const updated = saveCustomCategoryMeta(meta);
    setCategoryMetas(getAllCategoryMetas());
    return updated;
  };

  // Starred Storage locations & containers
  const [starredStorageKeys, setStarredStorageKeys] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STARRED_STORAGES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return ['Master Fireproof Safe (Office)', 'Master Fireproof Safe (Office):::Pelican 1500 Slab Case'];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STARRED_STORAGES, JSON.stringify(starredStorageKeys));
    } catch {}
  }, [starredStorageKeys]);

  const toggleStarLocation = (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setStarredStorageKeys((prev) =>
      prev.includes(trimmed) ? prev.filter((k) => k !== trimmed) : [...prev, trimmed]
    );
  };

  const isLocationStarred = (key: string): boolean => {
    return starredStorageKeys.includes(key.trim());
  };

  // Storage Units persistent state
  const [customStorageUnits, setCustomStorageUnits] = useState<StorageUnit[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STORAGE_UNITS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_STORAGE_UNITS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STORAGE_UNITS, JSON.stringify(customStorageUnits));
    } catch {
      // Ignore
    }
  }, [customStorageUnits]);

  // Storage Units unified with dynamically inferred ones from items
  const storageUnits = useMemo(() => {
    const unitsMap = new Map<string, StorageUnit>();

    // 1. Add all configured units
    customStorageUnits.forEach((unit) => {
      const meta = unit.metaStorage.trim();
      const cont = unit.container.trim();
      if (meta && cont) {
        unitsMap.set(`${meta}:::${cont}`, unit);
      }
    });

    // 2. Add any units inferred from items
    items.forEach((item) => {
      if (item.storageLocation?.metaStorage && item.storageLocation?.container) {
        const meta = item.storageLocation.metaStorage.trim();
        const cont = item.storageLocation.container.trim();
        const key = `${meta}:::${cont}`;
        if (!unitsMap.has(key)) {
          unitsMap.set(key, {
            id: `unit-inferred-${Math.random().toString(36).substring(2, 7)}`,
            metaStorage: meta,
            container: cont,
            type: cont.toLowerCase().includes('binder')
              ? 'binder'
              : cont.toLowerCase().includes('slab') || cont.toLowerCase().includes('case')
              ? 'slab_case'
              : 'safe',
          });
        }
      }
    });

    return Array.from(unitsMap.values());
  }, [customStorageUnits, items]);

  // Background AI Agent Tasks & Result Windows
  const [agentBackgroundTasks, setAgentBackgroundTasks] = useState<AgentBackgroundTask[]>([]);

  const dismissBackgroundTask = useCallback((taskId: string) => {
    setAgentBackgroundTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const openAgentResultWindow = useCallback((query: string, result: AgentQueryResult): string => {
    const sandboxId = `sandbox-agent-${Date.now()}`;
    const cleanTitle = query.trim().length > 22 ? query.trim().slice(0, 20) + '…' : query.trim();
    const newSandbox: Sandbox = {
      id: sandboxId,
      name: `✦ ${cleanTitle || 'Agent Insight'}`,
      type: 'custom',
      description: result.directAnswerSummary || 'AI Agent Result Workspace',
      iconName: 'Sparkles',
      themeColor: '#007AFF',
      createdAt: new Date().toISOString().split('T')[0],
      isAgentResult: true,
      agentQuery: query,
      agentResult: result,
      userId: activeUserId || undefined,
    };

    setSandboxes((prev) => {
      // If there is an existing empty 'watches' or custom sandbox, keep order clean
      return [...prev.filter((s) => s.id !== sandboxId), newSandbox];
    });

    setActiveSandboxId(sandboxId);
    setActiveView('portfolio');

    if (result.matchedItemIds && result.matchedItemIds.length > 0) {
      setAgentActiveFilter({
        id: `agent-filter-${Date.now()}`,
        query,
        title: result.directAnswerSummary || query,
        matchedItemIds: result.matchedItemIds,
        matchedCount: result.matchedItemIds.length,
        totalValueUSD: result.aggregatedMetrics?.totalValueUSD || 0,
        active: true,
      });
    }

    if (activeUserId) {
      saveSandboxToDatabase(newSandbox, activeUserId).catch((err) =>
        console.warn('Failed to save agent sandbox:', err)
      );
    }

    return sandboxId;
  }, [activeUserId]);

  const startAgentBackgroundTask = useCallback(async (prompt: string, model?: string): Promise<string> => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTask: AgentBackgroundTask = {
      id: taskId,
      prompt,
      model: model || 'gemini-2.5-flash',
      status: 'running',
      startTime: Date.now(),
    };

    setAgentBackgroundTasks((prev) => [newTask, ...prev]);

    // Asynchronously dispatch RAG agent query in the background
    (async () => {
      try {
        const result = await queryMetaAgent({
          prompt,
          vaultItems: items,
          storageUnits,
          currency,
          model,
        });

        const createdSandboxId = openAgentResultWindow(prompt, result);

        setAgentBackgroundTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: 'completed', result, createdSandboxId }
              : t
          )
        );
      } catch (err: any) {
        console.error('Background Agent Task failed:', err);
        setAgentBackgroundTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: 'error', error: err?.message || 'Agent analysis failed' }
              : t
          )
        );
      }
    })();

    return taskId;
  }, [items, storageUnits, currency, openAgentResultWindow]);

  const addStorageUnit = (unitData: Omit<StorageUnit, 'id' | 'createdAt'>): StorageUnit => {
    const newUnit: StorageUnit = {
      ...unitData,
      metaStorage: unitData.metaStorage.trim(),
      container: unitData.container.trim(),
      id: `unit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
      userId: activeUserId || undefined,
    };

    setCustomStorageUnits((prev) => {
      const filtered = prev.filter(
        (u) =>
          !(
            u.metaStorage.trim().toLowerCase() === newUnit.metaStorage.toLowerCase() &&
            u.container.trim().toLowerCase() === newUnit.container.toLowerCase()
          )
      );
      return [...filtered, newUnit];
    });

    return newUnit;
  };

  const deleteStorageUnit = (id: string) => {
    setCustomStorageUnits((prev) => prev.filter((u) => u.id !== id));
  };

  const deleteStorageLocation = async (
    metaStorage: string,
    container?: string
  ): Promise<{ success: boolean; message: string }> => {
    const targetMeta = metaStorage.trim();
    const targetCont = container?.trim();

    if (targetCont) {
      // Deleting a specific container
      // 1. Remove from customStorageUnits
      setCustomStorageUnits((prev) =>
        prev.filter(
          (u) =>
            !(
              u.metaStorage.trim().toLowerCase() === targetMeta.toLowerCase() &&
              u.container.trim().toLowerCase() === targetCont.toLowerCase()
            )
        )
      );

      // 2. Remove star if present
      const containerKey = `${targetMeta}:::${targetCont}`;
      setStarredStorageKeys((prev) => prev.filter((k) => k !== containerKey));

      // 3. Check if any items are in this container, clear their location to unassigned
      const affectedItems = items.filter(
        (i) =>
          i.storageLocation?.metaStorage?.trim().toLowerCase() === targetMeta.toLowerCase() &&
          i.storageLocation?.container?.trim().toLowerCase() === targetCont.toLowerCase()
      );

      if (affectedItems.length > 0 && activeUserId) {
        const updated = items.map((item) => {
          if (
            item.storageLocation?.metaStorage?.trim().toLowerCase() === targetMeta.toLowerCase() &&
            item.storageLocation?.container?.trim().toLowerCase() === targetCont.toLowerCase()
          ) {
            return { ...item, storageLocation: undefined, lastUpdated: new Date().toISOString() };
          }
          return item;
        });
        setItems(updated);
        for (const item of affectedItems) {
          await saveItemToDatabase({ ...item, storageLocation: undefined }, activeUserId);
        }
      }

      return {
        success: true,
        message: `Storage container "${targetCont}" removed successfully.`,
      };
    } else {
      // Deleting entire MetaStorage location
      setCustomStorageUnits((prev) =>
        prev.filter((u) => u.metaStorage.trim().toLowerCase() !== targetMeta.toLowerCase())
      );

      setStarredStorageKeys((prev) =>
        prev.filter((k) => k !== targetMeta && !k.startsWith(`${targetMeta}:::`))
      );

      const affectedItems = items.filter(
        (i) => i.storageLocation?.metaStorage?.trim().toLowerCase() === targetMeta.toLowerCase()
      );

      if (affectedItems.length > 0 && activeUserId) {
        const updated = items.map((item) => {
          if (item.storageLocation?.metaStorage?.trim().toLowerCase() === targetMeta.toLowerCase()) {
            return { ...item, storageLocation: undefined, lastUpdated: new Date().toISOString() };
          }
          return item;
        });
        setItems(updated);
        for (const item of affectedItems) {
          await saveItemToDatabase({ ...item, storageLocation: undefined }, activeUserId);
        }
      }

      return {
        success: true,
        message: `Storage location "${targetMeta}" and its containers removed successfully.`,
      };
    }
  };

  const updateStorageUnit = (id: string, updates: Partial<StorageUnit>) => {
    setCustomStorageUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const switchItemStorage = async (itemId: string, newStorage: StorageLocation) => {
    await updateItem(itemId, { storageLocation: newStorage });
  };

  const batchSwitchItemStorage = async (itemIds: string[], newStorage: StorageLocation) => {
    if (!activeUserId || itemIds.length === 0) return;
    const set = new Set(itemIds);
    const updatedItems = items.map((item) => {
      if (set.has(item.id)) {
        return {
          ...item,
          storageLocation: newStorage,
          lastUpdated: new Date().toISOString(),
        };
      }
      return item;
    });
    setItems(updatedItems);
    for (const it of updatedItems.filter((i) => set.has(i.id))) {
      await saveItemToDatabase(it, activeUserId);
    }
  };

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
          const validSandboxes = fetchedSandboxes.filter(
            (s) =>
              s.id !== 'sandbox-watches' &&
              s.id !== 'watches' &&
              s.name.toLowerCase() !== 'watches' &&
              s.type !== 'watches'
          );
          setSandboxes(validSandboxes.length > 0 ? validSandboxes : INITIAL_SANDBOXES);

          // Clean up watches sandboxes from database if any existed
          const watchesToDelete = fetchedSandboxes.filter(
            (s) =>
              s.id === 'sandbox-watches' ||
              s.id === 'watches' ||
              s.name.toLowerCase() === 'watches' ||
              s.type === 'watches'
          );
          for (const ws of watchesToDelete) {
            deleteSandboxFromDatabase(ws.id, activeUserId).catch(() => {});
          }
        } else {
          setSandboxes(INITIAL_SANDBOXES);
        }
      } catch (err) {
        console.warn('Failed to load user data from database:', err);
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

  // Helper to clear all active filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedTag(null);
    setSelectedCondition('ALL');
    setAgentActiveFilter(null);
  }, []);

  // Dynamically computed list of unique assigned tags with asset counts
  const availableTags = useMemo(() => {
    const counts = new Map<string, number>();
    const scopedItems = activeSandboxId === 'all'
      ? items
      : items.filter((i) => i.sandboxId === activeSandboxId);

    scopedItems.forEach((item) => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach((tag) => {
          if (tag && typeof tag === 'string' && tag.trim()) {
            const clean = tag.trim();
            counts.set(clean, (counts.get(clean) || 0) + 1);
          }
        });
      }
    });

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [items, activeSandboxId]);

  // Dynamically computed list of unique asset categories with item counts
  const availableCategories = useMemo(() => {
    const counts = new Map<string, number>();
    const scopedItems = activeSandboxId === 'all'
      ? items
      : items.filter((i) => i.sandboxId === activeSandboxId);

    scopedItems.forEach((item) => {
      const cat = (item.category || 'other').toLowerCase();
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });

    const categoryLabels: Record<string, string> = {
      pokemon: 'Pokémon TCG',
      beyblade: 'Beyblade',
      mtg: 'Magic: The Gathering',
      onepiece: 'One Piece Card Game',
      gaming: 'Retro & Modern Games',
      yugioh: 'Yu-Gi-Oh! TCG',
      lorcana: 'Disney Lorcana',
      sports_cards: 'Sports Cards',
      tcg_general: 'Trading Cards',
      gunpla: 'Gunpla & Models',
      action_figures: 'Action Figures',
      lego: 'LEGO & Bricks',
      diecast: 'Diecast & Cars',
      consoles: 'Consoles & Hardware',
      comics_manga: 'Comics & Manga',
      anime_merch: 'Anime Collectibles',
      art_memorabilia: 'Memorabilia & Art',
    };

    return Array.from(counts.entries())
      .map(([id, count]) => ({
        id,
        label: categoryLabels[id] || id.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        count,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [items, activeSandboxId]);

  // Filtered and sorted items based on current active sandbox & controls
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by sandbox if not 'all'
    if (activeSandboxId !== 'all') {
      const currentSb = sandboxes.find((s) => s.id === activeSandboxId);
      if (currentSb?.isAgentResult && currentSb.agentResult?.matchedItemIds && currentSb.agentResult.matchedItemIds.length > 0) {
        result = result.filter((item) => currentSb.agentResult!.matchedItemIds.includes(item.id));
      } else {
        result = result.filter((item) => item.sandboxId === activeSandboxId);
      }
    }

    // Filter by Asset Type / Category (flexible includes)
    if (selectedCategory !== 'ALL') {
      const catLower = selectedCategory.toLowerCase();
      result = result.filter((item) => {
        const itemCat = (item.category || '').toLowerCase();
        const matchesCat = itemCat.includes(catLower) || catLower.includes(itemCat);
        const matchesTag = item.tags?.some((t) => t.toLowerCase().includes(catLower) || catLower.includes(t.toLowerCase()));
        const matchesGame = item.cardSpecs?.game?.toLowerCase().includes(catLower);
        const matchesName = item.name.toLowerCase().includes(catLower);
        return matchesCat || matchesTag || matchesGame || matchesName;
      });
    }

    // Filter by Assigned Tag (flexible includes)
    if (selectedTag) {
      const tagLower = selectedTag.toLowerCase().replace(/^#/, '');
      result = result.filter((item) => {
        const matchesTag = item.tags?.some((t) => t.toLowerCase().includes(tagLower) || tagLower.includes(t.toLowerCase()));
        const matchesCategory = (item.category || '').toLowerCase().includes(tagLower);
        const matchesSetName = item.cardSpecs?.setName?.toLowerCase().includes(tagLower);
        const matchesRarity = item.cardSpecs?.rarity?.toLowerCase().includes(tagLower);
        const matchesBladeType = item.beybladeSpecs?.type?.toLowerCase().includes(tagLower);
        const matchesBladeGen = item.beybladeSpecs?.generation?.toLowerCase().includes(tagLower);
        const matchesName = item.name.toLowerCase().includes(tagLower);
        return matchesTag || matchesCategory || matchesSetName || matchesRarity || matchesBladeType || matchesBladeGen || matchesName;
      });
    }

    // Filter by search query according to includes (multi-token substring match across all attributes)
    if (searchQuery.trim()) {
      const queryClean = searchQuery.toLowerCase().trim();
      const tokens = queryClean.split(/\s+/).filter(Boolean);

      result = result.filter((item) => {
        // Collect all textual descriptors of this asset into a searchable string corpus
        const searchableFields: (string | undefined | null)[] = [
          item.name,
          item.category,
          ...(item.tags || []),
          item.cardSpecs?.setName,
          item.cardSpecs?.game,
          item.cardSpecs?.cardNumber,
          item.cardSpecs?.rarity,
          item.cardSpecs?.illustrator,
          item.cardSpecs?.language,
          item.cardSpecs?.variant,
          item.beybladeSpecs?.blade,
          item.beybladeSpecs?.ratchet,
          item.beybladeSpecs?.bit,
          item.beybladeSpecs?.brand,
          item.beybladeSpecs?.generation,
          item.beybladeSpecs?.type,
          item.beybladeSpecs?.code,
          item.beybladeSpecs?.spinDirection,
          item.storageLocation?.metaStorage,
          item.storageLocation?.container,
          item.storageLocation?.slot,
          item.condition,
          item.grading?.company,
          item.grading?.grade ? `${item.grading.company || ''} ${item.grading.grade}` : '',
          item.grading?.certNumber,
          item.grading?.subgrades?.centering ? `Centering ${item.grading.subgrades.centering}` : '',
          item.notes,
          item.customAttributes ? Object.values(item.customAttributes).join(' ') : '',
        ];

        const corpus = searchableFields.filter(Boolean).join(' ').toLowerCase();

        // Check if query is directly included as a phrase OR all individual tokens are included
        if (corpus.includes(queryClean)) {
          return true;
        }

        return tokens.every((tok) => corpus.includes(tok));
      });
    }

    // Filter by agent active filter if set
    if (agentActiveFilter && Array.isArray(agentActiveFilter.matchedItemIds) && agentActiveFilter.matchedItemIds.length > 0) {
      result = result.filter((item) => agentActiveFilter.matchedItemIds.includes(item.id));
    }

    // Filter by condition
    if (selectedCondition !== 'ALL') {
      result = result.filter((item) => {
        if (item.condition === selectedCondition) return true;
        if (item.copies && item.copies.some((c) => c.condition === selectedCondition)) return true;
        return false;
      });
    }

    // Sort
    result.sort((a, b) => {
      const totalValA = calculateItemTotalValuation(a);
      const totalValB = calculateItemTotalValuation(b);
      const totalCostA = calculateItemTotalCost(a);
      const totalCostB = calculateItemTotalCost(b);
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
          return new Date(b.purchaseDate || b.lastUpdated).getTime() - new Date(a.purchaseDate || a.lastUpdated).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [items, activeSandboxId, sandboxes, selectedCategory, selectedTag, searchQuery, agentActiveFilter, selectedCondition, sortBy]);

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
    const currentSb = sandboxes.find((s) => s.id === activeSandboxId);
    const targetItems = activeSandboxId === 'all'
      ? items
      : currentSb?.isAgentResult && currentSb.agentResult?.matchedItemIds && currentSb.agentResult.matchedItemIds.length > 0
      ? items.filter((i) => currentSb.agentResult!.matchedItemIds.includes(i.id))
      : items.filter((i) => i.sandboxId === activeSandboxId);

    let val = 0;
    let cost = 0;
    let val24h = 0;
    let val30d = 0;

    targetItems.forEach((item) => {
      const itemVal = calculateItemTotalValuation(item);
      const itemCost = calculateItemTotalCost(item);
      const qtyRatio = item.copies && item.copies.length > 0 ? item.copies.length : (item.quantity || 1);
      const prev24 = (item.previousPriceUSD_24h ?? item.currentPriceUSD) * qtyRatio;
      const prev30 = (item.previousPriceUSD_30d ?? item.currentPriceUSD * 0.95) * qtyRatio;

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
    const currentSb = sandboxes.find((s) => s.id === activeSandboxId);
    const targetItems = activeSandboxId === 'all'
      ? items
      : currentSb?.isAgentResult && currentSb.agentResult?.matchedItemIds && currentSb.agentResult.matchedItemIds.length > 0
      ? items.filter((i) => currentSb.agentResult!.matchedItemIds.includes(i.id))
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
        activeView,
        setActiveView,
        storageFocusLocation,
        setStorageFocusLocation,
        agentActiveFilter,
        setAgentActiveFilter,
        clearAgentActiveFilter,
        selectedCategory,
        setSelectedCategory,
        selectedTag,
        setSelectedTag,
        availableTags,
        availableCategories,
        clearAllFilters,
        agentBackgroundTasks,
        startAgentBackgroundTask,
        dismissBackgroundTask,
        openAgentResultWindow,
        categoryMetas,
        addCustomCategoryMeta,
        storageUnits,
        starredStorageKeys,
        toggleStarLocation,
        isLocationStarred,
        addStorageUnit,
        deleteStorageUnit,
        deleteStorageLocation,
        updateStorageUnit,
        switchItemStorage,
        batchSwitchItemStorage,
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
