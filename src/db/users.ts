import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface UserInput {
  uid: string;
  email: string;
  password?: string | null;
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

export async function registerUser(email: string, password?: string, displayName?: string) {
  try {
    const normalized = email.trim().toLowerCase();
    const existing = await getUserByEmail(normalized);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const uid = 'user_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const inserted = await db
      .insert(users)
      .values({
        uid,
        email: normalized,
        password: password || null,
        displayName: displayName || normalized.split('@')[0],
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalized)}`,
        providerId: 'password',
        primaryProvider: 'password',
        linkedProviders: ['password'],
        totalPortfolioValueUSD: 0,
        totalPortfolioCostUSD: 0,
        totalPortfolioGainLossUSD: 0,
        totalItems: 0,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Failed to register user in Supabase:', error);
    throw error;
  }
}

export async function authenticateUser(email: string, password?: string) {
  try {
    const normalized = email.trim().toLowerCase();
    const user = await getUserByEmail(normalized);
    if (!user) {
      throw new Error('No account found with this email. Please check your email or click Register to create a new account.');
    }

    // If password provided and user has password set, verify match
    if (password && user.password && user.password !== password) {
      throw new Error('Invalid password. Please verify and try again.');
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.uid, user.uid));

    return user;
  } catch (error) {
    console.error('Failed to authenticate user against Supabase:', error);
    throw error;
  }
}

export async function syncUserToDatabase(input: UserInput) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, input.uid)).limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(users)
        .set({
          email: input.email.trim().toLowerCase(),
          password: input.password ?? existing[0].password,
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
          email: input.email.trim().toLowerCase(),
          password: input.password || null,
          displayName: input.displayName || null,
          photoURL: input.photoURL || null,
          providerId: input.providerId || 'password',
          primaryProvider: input.primaryProvider || 'password',
          linkedProviders: input.linkedProviders || [input.providerId || 'password'],
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

export async function ensureUserExists(userId: string, email?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, userId)).limit(1);
    if (existing.length > 0) return existing[0];

    const safeEmail = (email || `${userId}@collectorvault.app`).toLowerCase();
    const inserted = await db
      .insert(users)
      .values({
        uid: userId,
        email: safeEmail,
        displayName: userId === 'user_123123' ? 'Dummy Collector' : (email?.split('@')[0] || 'Collector'),
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userId)}`,
        providerId: 'password',
        primaryProvider: 'password',
        linkedProviders: ['password'],
        totalPortfolioValueUSD: 0,
        totalPortfolioCostUSD: 0,
        totalPortfolioGainLossUSD: 0,
        totalItems: 0,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();

    return inserted[0] || (await getUserByUid(userId));
  } catch (error) {
    console.warn(`ensureUserExists note for ${userId}:`, error);
  }
}
