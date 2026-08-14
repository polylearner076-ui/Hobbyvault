import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AssetItem, Sandbox } from '../types';

/**
 * Helper to determine collection path based on user authentication state.
 * If authenticated, stores under users/{userId}/items to isolate user collections.
 * Otherwise falls back to global items collection.
 */
function getItemsCollectionPath(userId?: string | null): string {
  if (userId) {
    return `users/${userId}/items`;
  }
  return 'items';
}

function getSandboxesCollectionPath(userId?: string | null): string {
  if (userId) {
    return `users/${userId}/sandboxes`;
  }
  return 'sandboxes';
}

/**
 * Load all items for the specific user from Firestore
 */
export async function loadItemsFromDatabase(userId?: string | null): Promise<AssetItem[]> {
  try {
    const colPath = getItemsCollectionPath(userId);
    const q = query(collection(db, colPath));
    const querySnapshot = await getDocs(q);
    const items: AssetItem[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return items;
  } catch (error) {
    console.warn(`Firestore loadItems (${userId || 'global'}) error:`, error);
    return [];
  }
}

/**
 * Save / Update an item for the specific user in Firestore
 */
export async function saveItemToDatabase(item: AssetItem, userId?: string | null): Promise<void> {
  try {
    const colPath = getItemsCollectionPath(userId);
    const itemRef = doc(db, colPath, item.id);
    await setDoc(itemRef, { ...item, userId: userId || 'guest' }, { merge: true });
  } catch (error) {
    console.warn(`Firestore saveItem (${userId || 'global'}) error:`, error);
  }
}

/**
 * Delete an item for the specific user from Firestore
 */
export async function deleteItemFromDatabase(itemId: string, userId?: string | null): Promise<void> {
  try {
    const colPath = getItemsCollectionPath(userId);
    const itemRef = doc(db, colPath, itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    console.warn(`Firestore deleteItem (${userId || 'global'}) error:`, error);
  }
}

/**
 * Load all custom sandboxes for the specific user from Firestore
 */
export async function loadSandboxesFromDatabase(userId?: string | null): Promise<Sandbox[]> {
  try {
    const colPath = getSandboxesCollectionPath(userId);
    const q = query(collection(db, colPath));
    const querySnapshot = await getDocs(q);
    const sandboxes: Sandbox[] = [];
    querySnapshot.forEach((docSnap) => {
      sandboxes.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return sandboxes;
  } catch (error) {
    console.warn(`Firestore loadSandboxes (${userId || 'global'}) error:`, error);
    return [];
  }
}

/**
 * Save / Update a sandbox for the specific user in Firestore
 */
export async function saveSandboxToDatabase(sandbox: Sandbox, userId?: string | null): Promise<void> {
  try {
    const colPath = getSandboxesCollectionPath(userId);
    const sbRef = doc(db, colPath, sandbox.id);
    await setDoc(sbRef, { ...sandbox, userId: userId || 'guest' }, { merge: true });
  } catch (error) {
    console.warn(`Firestore saveSandbox (${userId || 'global'}) error:`, error);
  }
}

/**
 * Delete a sandbox for the specific user from Firestore
 */
export async function deleteSandboxFromDatabase(sandboxId: string, userId?: string | null): Promise<void> {
  try {
    const colPath = getSandboxesCollectionPath(userId);
    const sbRef = doc(db, colPath, sandboxId);
    await deleteDoc(sbRef);
  } catch (error) {
    console.warn(`Firestore deleteSandbox (${userId || 'global'}) error:`, error);
  }
}

/**
 * Sync entire initial dataset to a user's database if empty
 */
export async function seedInitialDatabase(
  items: AssetItem[],
  sandboxes: Sandbox[],
  userId?: string | null
): Promise<void> {
  try {
    const existing = await loadItemsFromDatabase(userId);
    if (existing.length === 0 && items.length > 0) {
      for (const item of items) {
        await saveItemToDatabase(item, userId);
      }
      for (const sb of sandboxes) {
        await saveSandboxToDatabase(sb, userId);
      }
    }
  } catch (e) {
    console.warn('Seed database catch:', e);
  }
}

