import { db } from './index.ts';
import { portfolioSummaries } from './schema.ts';
import { eq } from 'drizzle-orm';

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
    const rows = await db.select().from(portfolioSummaries).where(eq(portfolioSummaries.userId, userId)).limit(1);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      userId: r.userId,
      totalValueUSD: r.totalValueUSD,
      totalCostUSD: r.totalCostUSD,
      totalGainLossUSD: r.totalGainLossUSD,
      totalGainLossPercent: r.totalGainLossPercent,
      itemCount: r.itemCount,
      sandboxCount: r.sandboxCount,
      lastUpdated: r.lastUpdated ? r.lastUpdated.toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to get portfolio summary from database:', error);
    throw new Error('Database query for portfolio summary failed.', { cause: error });
  }
}

export async function upsertPortfolioSummary(data: PortfolioSummaryData): Promise<PortfolioSummaryData> {
  try {
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
    console.error('Failed to upsert portfolio summary in database:', error);
    throw new Error('Database upsert for portfolio summary failed.', { cause: error });
  }
}
