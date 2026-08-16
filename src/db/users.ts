import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface UserInput {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  providerId?: string;
  primaryProvider?: string;
  linkedProviders?: string[];
  totalPortfolioValueUSD?: number;
  totalPortfolioCostUSD?: number;
  totalPortfolioGainLossUSD?: number;
  totalItems?: number;
}

export async function syncUserToDatabase(input: UserInput) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, input.uid)).limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(users)
        .set({
          email: input.email,
          displayName: input.displayName ?? existing[0].displayName,
          photoURL: input.photoURL ?? existing[0].photoURL,
          providerId: input.providerId ?? existing[0].providerId,
          primaryProvider: input.primaryProvider ?? existing[0].primaryProvider,
          linkedProviders: input.linkedProviders ?? existing[0].linkedProviders,
          totalPortfolioValueUSD: input.totalPortfolioValueUSD ?? existing[0].totalPortfolioValueUSD,
          totalPortfolioCostUSD: input.totalPortfolioCostUSD ?? existing[0].totalPortfolioCostUSD,
          totalPortfolioGainLossUSD: input.totalPortfolioGainLossUSD ?? existing[0].totalPortfolioGainLossUSD,
          totalItems: input.totalItems ?? existing[0].totalItems,
          lastLoginAt: new Date(),
        })
        .where(eq(users.uid, input.uid))
        .returning();
      return updated[0];
    } else {
      const inserted = await db
        .insert(users)
        .values({
          uid: input.uid,
          email: input.email,
          displayName: input.displayName || null,
          photoURL: input.photoURL || null,
          providerId: input.providerId || 'google.com',
          primaryProvider: input.primaryProvider || 'google.com',
          linkedProviders: input.linkedProviders || [input.providerId || 'google.com'],
          totalPortfolioValueUSD: input.totalPortfolioValueUSD || 0,
          totalPortfolioCostUSD: input.totalPortfolioCostUSD || 0,
          totalPortfolioGainLossUSD: input.totalPortfolioGainLossUSD || 0,
          totalItems: input.totalItems || 0,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        })
        .returning();
      return inserted[0];
    }
  } catch (error) {
    console.error('Failed to sync user to PostgreSQL database:', error);
    throw new Error('Database user sync failed.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch user by UID:', error);
    throw new Error('Database query for user failed.', { cause: error });
  }
}

export async function getUserByEmail(email: string) {
  try {
    const normalized = email.trim().toLowerCase();
    const result = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch user by email:', error);
    throw new Error('Database query for user by email failed.', { cause: error });
  }
}

export async function updateUserPortfolioMetrics(
  uid: string,
  metrics: {
    totalPortfolioValueUSD: number;
    totalPortfolioCostUSD: number;
    totalPortfolioGainLossUSD: number;
    totalItems: number;
  }
) {
  try {
    await db
      .update(users)
      .set({
        totalPortfolioValueUSD: metrics.totalPortfolioValueUSD,
        totalPortfolioCostUSD: metrics.totalPortfolioCostUSD,
        totalPortfolioGainLossUSD: metrics.totalPortfolioGainLossUSD,
        totalItems: metrics.totalItems,
      })
      .where(eq(users.uid, uid));
  } catch (error) {
    console.error('Failed to update user portfolio metrics in database:', error);
    throw new Error('Database update for user metrics failed.', { cause: error });
  }
}
