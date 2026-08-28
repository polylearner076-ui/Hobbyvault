import type { AssetItem, Sandbox } from '../types.ts';
import type { PortfolioSummaryData } from './portfolio.ts';

export interface StoredUser {
  id?: number;
  uid: string;
  email: string;
  password?: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
  primaryProvider: string;
  linkedProviders: string[];
  totalPortfolioValueUSD: number;
  totalPortfolioCostUSD: number;
  totalPortfolioGainLossUSD: number;
  totalItems: number;
  createdAt: Date;
  lastLoginAt: Date;
}

// Global server memory store that persists across requests in the container
const memoryUsers = new Map<string, StoredUser>(); // keyed by uid and email
const memoryItems = new Map<string, AssetItem[]>(); // keyed by userId
const memorySandboxes = new Map<string, Sandbox[]>(); // keyed by userId
const memoryPortfolios = new Map<string, PortfolioSummaryData>(); // keyed by userId

export const memoryStore = {
  // Users
  getUserByUid(uid: string): StoredUser | null {
    return memoryUsers.get(`uid:${uid}`) || null;
  },

  getUserByEmail(email: string): StoredUser | null {
    return memoryUsers.get(`email:${email.trim().toLowerCase()}`) || null;
  },

  saveUser(user: StoredUser): StoredUser {
    const normEmail = user.email.trim().toLowerCase();
    memoryUsers.set(`uid:${user.uid}`, user);
    memoryUsers.set(`email:${normEmail}`, user);
    return user;
  },

  // Items
  getItems(userId: string): AssetItem[] {
    return memoryItems.get(userId) || [];
  },

  saveItem(userId: string, item: AssetItem): AssetItem {
    const list = memoryItems.get(userId) || [];
    const filtered = list.filter((i) => i.id !== item.id);
    const updated = [item, ...filtered];
    memoryItems.set(userId, updated);
    return item;
  },

  deleteItem(userId: string, itemId: string): boolean {
    const list = memoryItems.get(userId) || [];
    const filtered = list.filter((i) => i.id !== itemId);
    memoryItems.set(userId, filtered);
    return list.length !== filtered.length;
  },

  setItems(userId: string, items: AssetItem[]): void {
    memoryItems.set(userId, items);
  },

  // Sandboxes
  getSandboxes(userId: string): Sandbox[] {
    return memorySandboxes.get(userId) || [];
  },

  saveSandbox(userId: string, sandbox: Sandbox): Sandbox {
    const list = memorySandboxes.get(userId) || [];
    const filtered = list.filter((s) => s.id !== sandbox.id);
    const updated = [...filtered, sandbox];
    memorySandboxes.set(userId, updated);
    return sandbox;
  },

  deleteSandbox(userId: string, sandboxId: string): boolean {
    const list = memorySandboxes.get(userId) || [];
    const filtered = list.filter((s) => s.id !== sandboxId);
    memorySandboxes.set(userId, filtered);
    return list.length !== filtered.length;
  },

  setSandboxes(userId: string, sandboxes: Sandbox[]): void {
    memorySandboxes.set(userId, sandboxes);
  },

  // Portfolio
  getPortfolio(userId: string): PortfolioSummaryData | null {
    return memoryPortfolios.get(userId) || null;
  },

  savePortfolio(userId: string, data: PortfolioSummaryData): PortfolioSummaryData {
    memoryPortfolios.set(userId, data);
    return data;
  },
};
