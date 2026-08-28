import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';
import { memoryStore, type StoredUser } from './inMemoryStore.ts';

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
  const normalized = email.trim().toLowerCase();
  const existing = await getUserByEmail(normalized);

  if (existing) {
    if (password && existing.password && existing.password !== password) {
      throw new Error('An account with this email already exists with a different password. Please enter the correct password to sign in.');
    }
    const updatedUser: StoredUser = {
      ...existing,
      displayName: displayName || existing.displayName || normalized.split('@')[0],
      password: password || existing.password,
      lastLoginAt: new Date(),
    };
    memoryStore.saveUser(updatedUser);

    try {
      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          displayName: updatedUser.displayName,
          password: updatedUser.password,
        })
        .where(eq(users.uid, existing.uid));
    } catch (dbErr) {
      console.warn('Non-fatal DB update on user registration:', dbErr);
    }
    return updatedUser;
  }

  const uid = 'user_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const newUser: StoredUser = {
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
  };

  memoryStore.saveUser(newUser);

  try {
    const inserted = await db
      .insert(users)
      .values({
        uid,
        email: normalized,
        password: password || null,
        displayName: newUser.displayName,
        photoURL: newUser.photoURL,
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

    if (inserted && inserted[0]) {
      memoryStore.saveUser(inserted[0] as StoredUser);
      return inserted[0];
    }
  } catch (error) {
    console.warn('Database write bypassed, returning in-memory user registration:', error);
  }

  return newUser;
}

export async function authenticateUser(email: string, password?: string) {
  const normalized = email.trim().toLowerCase();
  let user = await getUserByEmail(normalized);

  if (!user) {
    // If user provided a password, seamlessly auto-create the account for zero-friction sign-in
    if (password) {
      user = await registerUser(normalized, password);
      return user;
    }
    throw new Error('No account found with this email. Please click Register to create a new account.');
  }

  // If password provided and user has password set, verify match
  if (password && user.password && user.password !== password) {
    throw new Error('Invalid password. Please verify and try again.');
  }

  user.lastLoginAt = new Date();
  memoryStore.saveUser(user);

  try {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.uid, user.uid));
  } catch (dbErr) {
    console.warn('Non-fatal DB update on user login:', dbErr);
  }

  return user;
}

export async function syncUserToDatabase(input: UserInput) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const memoryCandidate: StoredUser = {
    uid: input.uid,
    email: normalizedEmail,
    password: input.password || null,
    displayName: input.displayName || normalizedEmail.split('@')[0],
    photoURL: input.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
    providerId: input.providerId || 'password',
    primaryProvider: input.primaryProvider || 'password',
    linkedProviders: input.linkedProviders || [input.providerId || 'password'],
    totalPortfolioValueUSD: input.totalPortfolioValueUSD || 0,
    totalPortfolioCostUSD: input.totalPortfolioCostUSD || 0,
    totalPortfolioGainLossUSD: input.totalPortfolioGainLossUSD || 0,
    totalItems: input.totalItems || 0,
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  memoryStore.saveUser(memoryCandidate);

  try {
    const existing = await db.select().from(users).where(eq(users.uid, input.uid)).limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(users)
        .set({
          email: normalizedEmail,
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
      if (updated && updated[0]) {
        memoryStore.saveUser(updated[0] as StoredUser);
        return updated[0];
      }
    } else {
      const inserted = await db
        .insert(users)
        .values({
          uid: input.uid,
          email: normalizedEmail,
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
      if (inserted && inserted[0]) {
        memoryStore.saveUser(inserted[0] as StoredUser);
        return inserted[0];
      }
    }
  } catch (error) {
    console.warn('Database user sync non-fatal warning:', error);
  }

  return memoryCandidate;
}

export async function getUserByUid(uid: string) {
  const inMemory = memoryStore.getUserByUid(uid);
  if (inMemory) return inMemory;

  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (result && result[0]) {
      memoryStore.saveUser(result[0] as StoredUser);
      return result[0];
    }
  } catch (error) {
    console.warn('Database lookup by UID note:', error);
  }

  return inMemory || null;
}

export async function getUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const inMemory = memoryStore.getUserByEmail(normalized);
  if (inMemory) return inMemory;

  try {
    const result = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
    if (result && result[0]) {
      memoryStore.saveUser(result[0] as StoredUser);
      return result[0];
    }
  } catch (error) {
    console.warn('Database lookup by email note:', error);
  }

  return inMemory || null;
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
  const user = memoryStore.getUserByUid(uid);
  if (user) {
    user.totalPortfolioValueUSD = metrics.totalPortfolioValueUSD;
    user.totalPortfolioCostUSD = metrics.totalPortfolioCostUSD;
    user.totalPortfolioGainLossUSD = metrics.totalPortfolioGainLossUSD;
    user.totalItems = metrics.totalItems;
    memoryStore.saveUser(user);
  }

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
    console.warn('Database update for user metrics non-fatal warning:', error);
  }
}

export async function ensureUserExists(userId: string, email?: string) {
  const safeEmail = (email || `${userId}@collectorvault.app`).toLowerCase();
  const inMemory = memoryStore.getUserByUid(userId);
  if (inMemory) return inMemory;

  try {
    const existing = await db.select().from(users).where(eq(users.uid, userId)).limit(1);
    if (existing.length > 0) {
      memoryStore.saveUser(existing[0] as StoredUser);
      return existing[0];
    }

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

    if (inserted && inserted[0]) {
      memoryStore.saveUser(inserted[0] as StoredUser);
      return inserted[0];
    }
  } catch (error) {
    console.warn(`ensureUserExists note for ${userId}:`, error);
  }

  const fallbackUser: StoredUser = {
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
  };
  return memoryStore.saveUser(fallbackUser);
}
