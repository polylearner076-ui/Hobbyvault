import { db } from './index.ts';
import { items } from './schema.ts';
import { and, eq } from 'drizzle-orm';
import type { AssetItem } from '../types.ts';

export async function getItemsByUserId(userId: string): Promise<AssetItem[]> {
  try {
    const rows = await db.select().from(items).where(eq(items.userId, userId));
    return rows.map((r) => ({
      id: r.id,
      sandboxId: r.sandboxId || 'default',
      name: r.name,
      category: r.category as any,
      imageUrl: r.imageUrl || '',
      currentPriceUSD: r.currentPriceUSD,
      previousPriceUSD_24h: r.previousPriceUSD_24h || undefined,
      previousPriceUSD_7d: r.previousPriceUSD_7d || undefined,
      previousPriceUSD_30d: r.previousPriceUSD_30d || undefined,
      purchasePriceUSD: r.purchasePriceUSD,
      purchaseDate: r.purchaseDate,
      quantity: r.quantity,
      condition: r.condition as any,
      notes: r.notes || undefined,
      tags: (r.tags as string[]) || [],
      priceHistory: (r.priceHistory as any[]) || [],
      cardSpecs: (r.cardSpecs as any) || undefined,
      beybladeSpecs: (r.beybladeSpecs as any) || undefined,
      transactions: (r.transactions as any[]) || [],
      storageLocation: (r.storageLocation as any) || undefined,
      isFavorite: r.isFavorite || false,
      marketSource: r.marketSource || undefined,
      lastUpdated: r.lastUpdated || new Date().toISOString(),
      userId: r.userId,
    }));
  } catch (error) {
    console.error('Failed to get items from database:', error);
    throw new Error('Database query for items failed.', { cause: error });
  }
}

export async function upsertItem(userId: string, item: AssetItem): Promise<AssetItem> {
  try {
    const values = {
      id: item.id,
      userId: userId,
      sandboxId: item.sandboxId || 'default',
      name: item.name,
      category: item.category,
      imageUrl: item.imageUrl || '',
      currentPriceUSD: Number(item.currentPriceUSD) || 0,
      previousPriceUSD_24h: item.previousPriceUSD_24h ?? null,
      previousPriceUSD_7d: item.previousPriceUSD_7d ?? null,
      previousPriceUSD_30d: item.previousPriceUSD_30d ?? null,
      purchasePriceUSD: Number(item.purchasePriceUSD) || 0,
      purchaseDate: item.purchaseDate || new Date().toISOString().split('T')[0],
      quantity: Number(item.quantity) || 1,
      condition: item.condition || 'RAW_NM',
      notes: item.notes || null,
      tags: item.tags || [],
      priceHistory: item.priceHistory || [],
      cardSpecs: item.cardSpecs || null,
      beybladeSpecs: item.beybladeSpecs || null,
      transactions: item.transactions || [],
      storageLocation: item.storageLocation || null,
      isFavorite: !!item.isFavorite,
      marketSource: item.marketSource || null,
      lastUpdated: item.lastUpdated || new Date().toISOString(),
    };

    await db
      .insert(items)
      .values({
        ...values,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [items.id, items.userId],
        set: values,
      });

    return item;
  } catch (error) {
    console.error('Failed to upsert item to database:', error);
    throw new Error('Database upsert for item failed.', { cause: error });
  }
}

export async function deleteItemById(userId: string, itemId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(items)
      .where(and(eq(items.id, itemId), eq(items.userId, userId)))
      .returning();
    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete item from database:', error);
    throw new Error('Database delete for item failed.', { cause: error });
  }
}

export async function batchUpsertItems(userId: string, itemsList: AssetItem[]): Promise<number> {
  try {
    for (const item of itemsList) {
      await upsertItem(userId, item);
    }
    return itemsList.length;
  } catch (error) {
    console.error('Failed to batch upsert items:', error);
    throw new Error('Database batch upsert failed.', { cause: error });
  }
}
