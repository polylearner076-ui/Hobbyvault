import { UserProfile } from '../types';

export interface RegisteredAccountRecord {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  initialProvider: 'password' | 'google.com';
  linkedProviders: ('password' | 'google.com')[];
  passwordHash?: string;
  createdAt: string;
  lastLoginAt: string;
}

const LOCAL_STORAGE_ACCOUNTS_KEY = 'collectorvault_accounts_registry_v1';
const LOCAL_STORAGE_ACTIVE_USER_KEY = 'collectorvault_auth_user_v1';

/**
 * Normalizes email for lookups
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Sanitizes email into a safe document/cache ID
 */
export function emailToDocId(email: string): string {
  return normalizeEmail(email).replace(/[^a-z0-9]/g, '_').slice(0, 48);
}

/**
 * Deterministic user ID from email for password / custom registrations
 */
export function getDeterministicUid(email: string): string {
  const sanitized = emailToDocId(email);
  return `usr_${sanitized}`;
}

/**
 * Securely hashes a password using Web Crypto SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_collectorvault_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(16);
  }
}

/**
 * Reads local accounts cache
 */
function getLocalAccounts(): Record<string, RegisteredAccountRecord> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Writes to local accounts cache
 */
function saveLocalAccount(account: RegisteredAccountRecord) {
  try {
    const accounts = getLocalAccounts();
    accounts[normalizeEmail(account.email)] = account;
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Failed to cache account locally:', e);
  }
}

/**
 * Look up existing account by email across PostgreSQL database and local cache
 */
export async function findAccountByEmail(email: string): Promise<RegisteredAccountRecord | null> {
  const cleanEmail = normalizeEmail(email);

  // 1. Direct Cloud SQL database query (authoritative source)
  try {
    const res = await fetch(`/api/users/by-email?email=${encodeURIComponent(cleanEmail)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        const record: RegisteredAccountRecord = {
          uid: data.user.uid,
          email: normalizeEmail(data.user.email),
          displayName: data.user.displayName || 'Collector',
          photoURL: data.user.photoURL,
          initialProvider: (data.user.providerId as any) || 'password',
          linkedProviders: (data.user.linkedProviders as any) || [(data.user.providerId as any) || 'password'],
          createdAt: data.user.createdAt || new Date().toISOString(),
          lastLoginAt: data.user.lastLoginAt || new Date().toISOString(),
        };
        saveLocalAccount(record);
        return record;
      }
    }
  } catch (e) {
    console.warn('Database findAccountByEmail query note:', e);
  }

  // If not found in Cloud SQL, clean up any stale local cache entry for this email
  try {
    const accounts = getLocalAccounts();
    if (accounts[cleanEmail]) {
      delete accounts[cleanEmail];
      localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    }
  } catch {}

  return null;
}

/**
 * Save new registered account to PostgreSQL database and local registry
 */
export async function registerAccountRecord(record: RegisteredAccountRecord): Promise<void> {
  saveLocalAccount(record);

  try {
    await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: record.uid,
        email: record.email,
        displayName: record.displayName,
        photoURL: record.photoURL || null,
        providerId: record.initialProvider,
        primaryProvider: record.initialProvider,
        linkedProviders: record.linkedProviders,
      }),
    });
  } catch (e) {
    console.warn('PostgreSQL database registerAccountRecord note:', e);
  }
}

/**
 * Link an existing Email/Password account with Google
 */
export async function linkExistingAccountWithGoogle(
  existingAccount: RegisteredAccountRecord,
  googleProfile: { displayName?: string | null; photoURL?: string | null }
): Promise<RegisteredAccountRecord> {
  const updatedLinkedProviders = Array.from(
    new Set([...existingAccount.linkedProviders, 'google.com'])
  ) as ('password' | 'google.com')[];

  const updatedAccount: RegisteredAccountRecord = {
    ...existingAccount,
    linkedProviders: updatedLinkedProviders,
    photoURL: googleProfile.photoURL || existingAccount.photoURL,
    displayName: existingAccount.displayName || googleProfile.displayName || existingAccount.email.split('@')[0],
    lastLoginAt: new Date().toISOString(),
  };

  saveLocalAccount(updatedAccount);

  try {
    await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: updatedAccount.uid,
        email: updatedAccount.email,
        displayName: updatedAccount.displayName,
        photoURL: updatedAccount.photoURL || null,
        providerId: 'google.com',
        primaryProvider: updatedAccount.initialProvider,
        linkedProviders: updatedAccount.linkedProviders,
      }),
    });
  } catch (e) {
    console.warn('PostgreSQL database linkExistingAccountWithGoogle note:', e);
  }

  return updatedAccount;
}
