import { db } from './index.ts';
import { sandboxes } from './schema.ts';
import { and, eq } from 'drizzle-orm';
import type { Sandbox } from '../types.ts';

export async function getSandboxesByUserId(userId: string): Promise<Sandbox[]> {
  try {
    const rows = await db.select().from(sandboxes).where(eq(sandboxes.userId, userId));
    return rows.map((r) => ({
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
  } catch (error) {
    console.error('Failed to get sandboxes from database:', error);
    throw new Error('Database query for sandboxes failed.', { cause: error });
  }
}

export async function upsertSandbox(userId: string, box: Sandbox): Promise<Sandbox> {
  try {
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
    console.error('Failed to upsert sandbox to database:', error);
    throw new Error('Database upsert for sandbox failed.', { cause: error });
  }
}

export async function deleteSandboxById(userId: string, sandboxId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(sandboxes)
      .where(and(eq(sandboxes.id, sandboxId), eq(sandboxes.userId, userId)))
      .returning();
    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete sandbox from database:', error);
    throw new Error('Database delete for sandbox failed.', { cause: error });
  }
}
