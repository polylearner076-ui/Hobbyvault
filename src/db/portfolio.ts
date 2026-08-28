import { db } from './index';
import { portfolioSummaries } from './schema';
import { eq } from 'drizzle-orm';
import { ensureUserExists } from './users';
import { memoryStore } from './inMemoryStore';

export interface PortfolioSummaryData {
  userId: string;
  totalValueUSD: number;
  totalCostUSD: number;
  totalGainLossUSD: number;
  totalGainLossPercent: number;
  itemCount: number;
  sandboxCount: number;
  lastUpdated?: string;
}

export async function getPortfolioSummaryByUserId(userId: string): Promise<PortfolioSummaryData | null> {
  try {
    await ensureUserExists(userId).catch(() => {});
    const rows = await db.select().from(portfolioSummaries).where(eq(portfolioSummaries.userId, userId)).limit(1);
    if (rows.length > 0) {
      const r = rows[0];
      const summary: PortfolioSummaryData = {
        userId: r.userId,
        totalValueUSD: r.totalValueUSD,
        totalCostUSD: r.totalCostUSD,
        totalGainLossUSD: r.totalGainLossUSD,
        totalGainLossPercent: r.totalGainLossPercent,
        itemCount: r.itemCount,
        sandboxCount: r.sandboxCount,
        lastUpdated: r.lastUpdated ? r.lastUpdated.toISOString() : new Date().toISOString(),
      };
      memoryStore.savePortfolio(userId, summary);
      return summary;
    }
  } catch (error) {
    console.warn('Database portfolio summary query fallback (non-fatal):', error);
  }
  return memoryStore.getPortfolio(userId);
}

export async function upsertPortfolioSummary(data: PortfolioSummaryData): Promise<PortfolioSummaryData> {
  memoryStore.savePortfolio(data.userId, data);

  try {
    await ensureUserExists(data.userId).catch(() => {});
    const existing = await db
      .select()
      .from(portfolioSummaries)
      .where(eq(portfolioSummaries.userId, data.userId))
      .limit(1);

    const values = {
      userId: data.userId,
      totalValueUSD: Number(data.totalValueUSD) || 0,
      totalCostUSD: Number(data.totalCostUSD) || 0,
      totalGainLossUSD: Number(data.totalGainLossUSD) || 0,
      totalGainLossPercent: Number(data.totalGainLossPercent) || 0,
      itemCount: Number(data.itemCount) || 0,
      sandboxCount: Number(data.sandboxCount) || 0,
      lastUpdated: new Date(),
    };

    if (existing.length > 0) {
      await db.update(portfolioSummaries).set(values).where(eq(portfolioSummaries.userId, data.userId));
    } else {
      await db.insert(portfolioSummaries).values(values);
    }

    return data;
  } catch (error) {
    console.warn('Database portfolio summary upsert fallback (non-fatal):', error);
    return data;
  }
}
