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

  // Fallback to local cache for offline browsing
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_ITEMS_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

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
