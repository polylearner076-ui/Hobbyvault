import { AssetItem, Sandbox } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  SUBSCRIBE = 'subscribe',
}

export interface DatabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  userId?: string | null;
}

export function handleDatabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: DatabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.warn('Database Operation Notice:', JSON.stringify(errInfo));
}

export interface PortfolioSummary {
  userId: string;
  totalValueUSD: number;
  totalCostUSD: number;
  totalGainLossUSD: number;
  totalGainLossPercent: number;
  itemCount: number;
  sandboxCount: number;
  lastUpdated: string;
}

// Local cache keys for instant load & offline resilience
const LOCAL_STORAGE_ITEMS_PREFIX = 'collectorvault_sql_items_';
const LOCAL_STORAGE_SANDBOXES_PREFIX = 'collectorvault_sql_sandboxes_';
const LOCAL_STORAGE_SUMMARY_PREFIX = 'collectorvault_sql_summary_';

// Starter demo items for fallback when backend API is offline or deployed as static SPA
const STARTER_DEMO_ITEMS: AssetItem[] = [
  {
    id: 'item-charizard-1st',
    userId: 'user_123123',
    sandboxId: 'vintage-cards',
    name: '1999 Pokémon Base Set 1st Edition Charizard #4 Shadowless',
    category: 'pokemon',
    imageUrl: 'https://images.unsplash.com/photo-1613770920295-90f81544dd7c?w=600&auto=format&fit=crop&q=80',
    currentPriceUSD: 14500.0,
    previousPriceUSD_24h: 14200.0,
    previousPriceUSD_7d: 13800.0,
    previousPriceUSD_30d: 13200.0,
    purchasePriceUSD: 9800.0,
    purchaseDate: '2023-04-15',
    quantity: 1,
    condition: 'PSA_9_MINT',
    notes: 'Acquired at national convention, authenticated with clean holographic foil',
    tags: ['Grail', 'Vintage', 'PSA', 'Base Set'],
    isFavorite: true,
    marketSource: 'TCGPlayer / eBay Verified',
    transactions: [
      {
        id: 'tx-1',
        type: 'BUY',
        date: '2023-04-15',
        quantity: 1,
        pricePerUnitUSD: 9800.0,
        notes: 'National Convention Acquisition',
      },
    ],
    lastUpdated: new Date().toISOString(),
    cardSpecs: {
      game: 'Pokemon',
      setName: 'Base Set (1st Edition)',
      cardNumber: '4/102',
      rarity: 'Holo Rare',
      gradingCompany: 'PSA',
      gradeValue: '9',
      certNumber: '48291044',
    },
    priceHistory: [
      { date: '2023-04-15', priceUSD: 9800 },
      { date: '2023-08-01', priceUSD: 11200 },
      { date: '2023-12-15', priceUSD: 12500 },
      { date: '2024-04-01', priceUSD: 13800 },
      { date: '2024-08-15', priceUSD: 14500 },
    ],
  },
  {
    id: 'item-black-lotus',
    userId: 'user_123123',
    sandboxId: 'vintage-cards',
    name: 'Magic: The Gathering Unlimited Edition Black Lotus Artifact',
    category: 'mtg',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    currentPriceUSD: 18500.0,
    previousPriceUSD_24h: 18500.0,
    previousPriceUSD_7d: 17900.0,
    previousPriceUSD_30d: 17200.0,
    purchasePriceUSD: 13500.0,
    purchaseDate: '2022-11-20',
    quantity: 1,
    condition: 'BGS_9.5',
    notes: 'Power Nine centerpiece. Sharp corners, clean centering 9.5',
    tags: ['Power Nine', 'Vintage', 'BGS', 'Investment'],
    isFavorite: true,
    marketSource: 'Cardmarket / MTGStocks Index',
    transactions: [
      {
        id: 'tx-2',
        type: 'BUY',
        date: '2022-11-20',
        quantity: 1,
        pricePerUnitUSD: 13500.0,
        notes: 'Power Nine Acquisition',
      },
    ],
    lastUpdated: new Date().toISOString(),
    cardSpecs: {
      game: 'Magic: The Gathering',
      setName: 'Unlimited Edition',
      cardNumber: 'Artifact',
      rarity: 'Rare',
      gradingCompany: 'BGS',
      gradeValue: '9.0',
      certNumber: '0012849502',
    },
    priceHistory: [
      { date: '2022-11-20', priceUSD: 13500 },
      { date: '2023-06-10', priceUSD: 15400 },
      { date: '2023-11-15', priceUSD: 16800 },
      { date: '2024-03-20', priceUSD: 17500 },
      { date: '2024-08-15', priceUSD: 18500 },
    ],
  },
  {
    id: 'item-dragoon-ms-uv',
    userId: 'user_123123',
    sandboxId: 'beyblade-models',
    name: 'Takara Beyblade Hard Metal System Dragoon MS Ultimate Version (A-126)',
    category: 'beyblade',
    imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    currentPriceUSD: 500.0,
    previousPriceUSD_24h: 500.0,
    previousPriceUSD_7d: 480.0,
    previousPriceUSD_30d: 450.0,
    purchasePriceUSD: 300.0,
    purchaseDate: '2023-06-12',
    quantity: 1,
    condition: 'MINT_IN_BOX',
    notes: 'Sealed Japanese Takara box with unapplied holographic stickers and original HMS winder',
    tags: ['HMS', 'Takara', 'Sealed', 'Beyblade'],
    isFavorite: true,
    marketSource: 'Yahoo Auctions Japan / Mandarake',
    transactions: [
      {
        id: 'tx-3',
        type: 'BUY',
        date: '2023-06-12',
        quantity: 1,
        pricePerUnitUSD: 300.0,
        notes: 'Takara Sealed Box',
      },
    ],
    lastUpdated: new Date().toISOString(),
    beybladeSpecs: {
      generation: 'Original / Plastics',
      type: 'Attack',
      spinDirection: 'Left',
      blade: 'Dragoon Emblem Metal',
      brand: 'Takara Tomy',
    },
    priceHistory: [
      { date: '2023-06-12', priceUSD: 300 },
      { date: '2023-12-01', priceUSD: 400 },
      { date: '2024-04-10', priceUSD: 460 },
      { date: '2024-08-15', priceUSD: 500 },
    ],
  },
];

/**
 * Load all items for the specific user from PostgreSQL Cloud SQL
 */
export async function loadItemsFromDatabase(userId?: string | null): Promise<AssetItem[]> {
  if (!userId) return [];
  try {
    const res = await fetch(`/api/items?userId=${encodeURIComponent(userId)}`, {
      headers: { 'x-user-id': userId },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items)) {
        try {
          localStorage.setItem(`${LOCAL_STORAGE_ITEMS_PREFIX}${userId}`, JSON.stringify(data.items));
        } catch {}
        return data.items;
      }
    }
  } catch (error) {
    handleDatabaseError(error, OperationType.LIST, `items/${userId}`);
  }

  // Fallback to local cache
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_ITEMS_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  // Fallback to starter collectibles for default user
  if (userId === 'user_123123' || userId.includes('123123')) {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_ITEMS_PREFIX}${userId}`, JSON.stringify(STARTER_DEMO_ITEMS));
    } catch {}
    return STARTER_DEMO_ITEMS;
  }

  return [];
}

/**
 * Save / Update an item in PostgreSQL Cloud SQL
 */
export async function saveItemToDatabase(item: AssetItem, userId?: string | null): Promise<void> {
  if (!userId) return;
  try {
    // Update local cache
    const current = await loadItemsFromDatabase(userId);
    const updated = [item, ...current.filter((i) => i.id !== item.id)];
    try {
      localStorage.setItem(`${LOCAL_STORAGE_ITEMS_PREFIX}${userId}`, JSON.stringify(updated));
    } catch {}

    // Persist to PostgreSQL backend
    await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ userId, item }),
    });
  } catch (error) {
    handleDatabaseError(error, OperationType.WRITE, `items/${userId}/${item.id}`);
  }
}

/**
 * Delete an item from PostgreSQL Cloud SQL
 */
export async function deleteItemFromDatabase(itemId: string, userId?: string | null): Promise<void> {
  if (!userId) return;
  try {
    const current = await loadItemsFromDatabase(userId);
    const updated = current.filter((i) => i.id !== itemId);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_ITEMS_PREFIX}${userId}`, JSON.stringify(updated));
    } catch {}

    await fetch(`/api/items/${encodeURIComponent(itemId)}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId },
    });
  } catch (error) {
    handleDatabaseError(error, OperationType.DELETE, `items/${userId}/${itemId}`);
  }
}

/**
 * Load all custom sandboxes for the user from PostgreSQL Cloud SQL
 */
export async function loadSandboxesFromDatabase(userId?: string | null): Promise<Sandbox[]> {
  if (!userId) return [];
  try {
    const res = await fetch(`/api/sandboxes?userId=${encodeURIComponent(userId)}`, {
      headers: { 'x-user-id': userId },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.sandboxes)) {
        try {
          localStorage.setItem(`${LOCAL_STORAGE_SANDBOXES_PREFIX}${userId}`, JSON.stringify(data.sandboxes));
        } catch {}
        return data.sandboxes;
      }
    }
  } catch (error) {
    handleDatabaseError(error, OperationType.LIST, `sandboxes/${userId}`);
  }

  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_SANDBOXES_PREFIX}${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/**
 * Save / Update a sandbox in PostgreSQL Cloud SQL
 */
export async function saveSandboxToDatabase(sandbox: Sandbox, userId?: string | null): Promise<void> {
  if (!userId) return;
  try {
    const current = await loadSandboxesFromDatabase(userId);
    const updated = [sandbox, ...current.filter((s) => s.id !== sandbox.id)];
    try {
      localStorage.setItem(`${LOCAL_STORAGE_SANDBOXES_PREFIX}${userId}`, JSON.stringify(updated));
    } catch {}

    await fetch('/api/sandboxes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ userId, sandbox }),
    });
  } catch (error) {
    handleDatabaseError(error, OperationType.WRITE, `sandboxes/${userId}/${sandbox.id}`);
  }
}

/**
 * Delete a sandbox from PostgreSQL Cloud SQL
 */
export async function deleteSandboxFromDatabase(sandboxId: string, userId?: string | null): Promise<void> {
  if (!userId) return;
  try {
    const current = await loadSandboxesFromDatabase(userId);
    const updated = current.filter((s) => s.id !== sandboxId);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_SANDBOXES_PREFIX}${userId}`, JSON.stringify(updated));
    } catch {}

    await fetch(`/api/sandboxes/${encodeURIComponent(sandboxId)}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId },
    });
  } catch (error) {
    handleDatabaseError(error, OperationType.DELETE, `sandboxes/${userId}/${sandboxId}`);
  }
}

/**
 * Save user's overall portfolio summary to PostgreSQL Cloud SQL
 */
export async function savePortfolioSummaryToDatabase(
  userId: string,
  summary: PortfolioSummary
): Promise<void> {
  if (!userId) return;
  try {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_SUMMARY_PREFIX}${userId}`, JSON.stringify(summary));
    } catch {}

    await fetch('/api/portfolio/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify(summary),
    });
  } catch (error) {
    handleDatabaseError(error, OperationType.WRITE, `portfolio/${userId}`);
  }
}

/**
 * Seed initial dataset to a user's PostgreSQL database if empty
 */
export async function seedInitialDatabase(
  items: AssetItem[],
  sandboxes: Sandbox[],
  userId?: string | null
): Promise<void> {
  if (!userId) return;
  try {
    const existing = await loadItemsFromDatabase(userId);
    if (existing.length === 0 && items.length > 0) {
      await fetch('/api/items/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ userId, items }),
      });

      for (const sb of sandboxes) {
        await saveSandboxToDatabase(sb, userId);
      }
    }
  } catch (e) {
    console.warn('Seed database note:', e);
  }
}

/**
 * Clear all items in user's database
 */
export async function clearUserVaultInDatabase(userId?: string | null): Promise<void> {
  if (!userId) return;
  try {
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_ITEMS_PREFIX}${userId}`);
    } catch {}
    const items = await loadItemsFromDatabase(userId);
    for (const item of items) {
      await deleteItemFromDatabase(item.id, userId);
    }
  } catch (e) {
    console.warn('Clear user vault note:', e);
  }
}
