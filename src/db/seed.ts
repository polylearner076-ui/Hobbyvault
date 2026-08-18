import { db, ensureTablesExist } from './index.ts';
import { users, sandboxes, items, portfolioSummaries } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedSupabaseDatabase() {
  console.log('🔄 Initializing tables in Supabase database...');
  await ensureTablesExist();

  // Clean up any legacy dummy accounts if present
  try {
    const dummyUid = 'user_123123';
    await db.delete(items).where(eq(items.userId, dummyUid));
    await db.delete(sandboxes).where(eq(sandboxes.userId, dummyUid));
    await db.delete(portfolioSummaries).where(eq(portfolioSummaries.userId, dummyUid));
    await db.delete(users).where(eq(users.uid, dummyUid));
    console.log('✅ Cleaned up legacy dummy data');
  } catch (err) {
    console.warn('Note on table cleanup:', err);
  }
}
