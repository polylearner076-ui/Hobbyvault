import { db } from './index.ts';
import { sandboxes } from './schema.ts';
import { and, eq } from 'drizzle-orm';
import type { Sandbox } from '../types.ts';
import { ensureUserExists } from './users.ts';
import { memoryStore } from './inMemoryStore.ts';

export async function getSandboxesByUserId(userId: string): Promise<Sandbox[]> {
  try {
    await ensureUserExists(userId).catch(() => {});
    const rows = await db.select().from(sandboxes).where(eq(sandboxes.userId, userId));
    if (rows && rows.length > 0) {
      const formatted = rows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type as any,
        description: r.description || '',
        iconName: r.iconName || 'Folder',
        themeColor: r.themeColor || '#007AFF',
        customFields: (r.customFields as any) || [],
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
        userId: r.userId,
      }));
      memoryStore.setSandboxes(userId, formatted);
      return formatted;
    }
  } catch (error) {
    console.warn('Database sandboxes query fallback (non-fatal):', error);
  }
  return memoryStore.getSandboxes(userId);
}

export async function upsertSandbox(userId: string, box: Sandbox): Promise<Sandbox> {
  memoryStore.saveSandbox(userId, box);

  try {
    await ensureUserExists(userId).catch(() => {});
    const values = {
      id: box.id,
      userId: userId,
      name: box.name,
      type: box.type,
      description: box.description || '',
      iconName: box.iconName || 'Folder',
      themeColor: box.themeColor || '#007AFF',
      customFields: box.customFields || [],
      updatedAt: new Date(),
    };

    await db
      .insert(sandboxes)
      .values({
        ...values,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [sandboxes.id, sandboxes.userId],
        set: values,
      });

    return box;
  } catch (error) {
    console.warn('Database sandbox upsert fallback (non-fatal):', error);
    return box;
  }
}

export async function deleteSandboxById(userId: string, sandboxId: string): Promise<boolean> {
  memoryStore.deleteSandbox(userId, sandboxId);

  try {
    const result = await db
      .delete(sandboxes)
      .where(and(eq(sandboxes.id, sandboxId), eq(sandboxes.userId, userId)))
      .returning();
    return result.length > 0;
  } catch (error) {
    console.warn('Database sandbox delete fallback (non-fatal):', error);
    return true;
  }
}
