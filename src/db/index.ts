import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { Pool as PgPool, PoolConfig } from 'pg';
const { Pool } = pg;
import * as schema from './schema';

declare global {
  var _postgresPool: PgPool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const rawConnectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

    let config: PoolConfig;
    if (rawConnectionString && !rawConnectionString.includes('/app/cloudsql')) {
      const isSsl = rawConnectionString.includes('supabase') || rawConnectionString.includes('sslmode=require') || process.env.SQL_SSL === 'true';
      config = {
        connectionString: rawConnectionString,
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
      };
    } else {
      // Connect via Supabase connection pooler or direct host
      const host = process.env.SUPABASE_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com';
      const user = process.env.SUPABASE_USER || 'postgres.fhrebbaflrqydgzvzqbc';
      const password = process.env.SUPABASE_PASSWORD || 'HobbyWault!';
      const database = process.env.SUPABASE_DB_NAME || 'postgres';
      const port = Number(process.env.SUPABASE_PORT) || 6543;

      config = {
        host,
        port,
        user,
        password,
        database,
        ssl: { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
      };
    }

    global._postgresPool = new Pool(config);

    global._postgresPool.on('connect', (client) => {
      client.query('SET search_path TO public;').catch(() => {});
    });

    global._postgresPool.on('error', (err) => {
      console.warn('SQL pool connection warning:', err?.message || err);
    });
  }
  return global._postgresPool;
};

export const ensureTablesExist = async () => {
  try {
    const currentPool = createPool();
    await currentPool.query(`
      SET search_path TO public;

      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        password TEXT,
        display_name TEXT,
        photo_url TEXT,
        provider_id TEXT DEFAULT 'password',
        primary_provider TEXT DEFAULT 'password',
        linked_providers JSONB DEFAULT '[]'::jsonb,
        total_portfolio_value_usd DOUBLE PRECISION DEFAULT 0,
        total_portfolio_cost_usd DOUBLE PRECISION DEFAULT 0,
        total_portfolio_gain_loss_usd DOUBLE PRECISION DEFAULT 0,
        total_items INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;

      CREATE TABLE IF NOT EXISTS sandboxes (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT DEFAULT '',
        icon_name TEXT DEFAULT 'Folder',
        theme_color TEXT DEFAULT '#007AFF',
        custom_fields JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS items (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        sandbox_id TEXT DEFAULT 'default',
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT DEFAULT '',
        current_price_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
        prev_price_24h DOUBLE PRECISION,
        prev_price_7d DOUBLE PRECISION,
        prev_price_30d DOUBLE PRECISION,
        purchase_price_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
        purchase_date TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        condition TEXT NOT NULL DEFAULT 'RAW_NM',
        notes TEXT,
        tags JSONB DEFAULT '[]'::jsonb,
        price_history JSONB DEFAULT '[]'::jsonb,
        card_specs JSONB,
        beyblade_specs JSONB,
        transactions JSONB DEFAULT '[]'::jsonb,
        storage_location JSONB,
        is_favorite BOOLEAN DEFAULT FALSE,
        market_source TEXT,
        last_updated TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS portfolio_summaries (
        user_id TEXT PRIMARY KEY,
        total_value_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_cost_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_gain_loss_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_gain_loss_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
        item_count INTEGER NOT NULL DEFAULT 0,
        sandbox_count INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err: any) {
    // Non-fatal if database credentials are not yet populated
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Database initialization note:', err.message);
    }
  }
};

const pool = createPool();
ensureTablesExist().catch(() => {});

export const db = drizzle(pool, { schema });
