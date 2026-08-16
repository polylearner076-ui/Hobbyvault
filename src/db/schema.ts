import { relations } from 'drizzle-orm';
import { boolean, doublePrecision, integer, jsonb, pgTable, primaryKey, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (Stores auth details, profile info, and portfolio rollup)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoURL: text('photo_url'),
  providerId: text('provider_id').default('password'),
  primaryProvider: text('primary_provider').default('password'),
  linkedProviders: jsonb('linked_providers').$type<string[]>().default([]),
  totalPortfolioValueUSD: doublePrecision('total_portfolio_value_usd').default(0),
  totalPortfolioCostUSD: doublePrecision('total_portfolio_cost_usd').default(0),
  totalPortfolioGainLossUSD: doublePrecision('total_portfolio_gain_loss_usd').default(0),
  totalItems: integer('total_items').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at').defaultNow(),
});

// Sandboxes / Custom Vaults table (Primary key scoped to (id, userId) for full multi-tenant isolation)
export const sandboxes = pgTable(
  'sandboxes',
  {
    id: text('id').notNull(),
    userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    description: text('description').default(''),
    iconName: text('icon_name').default('Folder'),
    themeColor: text('theme_color').default('#007AFF'),
    customFields: jsonb('custom_fields').default([]),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.userId] }),
  ]
);

// Items / Collectible Assets table (Primary key scoped to (id, userId))
export const items = pgTable(
  'items',
  {
    id: text('id').notNull(),
    userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
    sandboxId: text('sandbox_id').default('default'),
    name: text('name').notNull(),
    category: text('category').notNull(),
    imageUrl: text('image_url').default(''),
    currentPriceUSD: doublePrecision('current_price_usd').notNull().default(0),
    previousPriceUSD_24h: doublePrecision('prev_price_24h'),
    previousPriceUSD_7d: doublePrecision('prev_price_7d'),
    previousPriceUSD_30d: doublePrecision('prev_price_30d'),
    purchasePriceUSD: doublePrecision('purchase_price_usd').notNull().default(0),
    purchaseDate: text('purchase_date').notNull(),
    quantity: integer('quantity').notNull().default(1),
    condition: text('condition').notNull().default('RAW_NM'),
    notes: text('notes'),
    tags: jsonb('tags').$type<string[]>().default([]),
    priceHistory: jsonb('price_history').$type<any[]>().default([]),
    cardSpecs: jsonb('card_specs').$type<any>(),
    beybladeSpecs: jsonb('beyblade_specs').$type<any>(),
    transactions: jsonb('transactions').$type<any[]>().default([]),
    storageLocation: jsonb('storage_location').$type<any>(),
    isFavorite: boolean('is_favorite').default(false),
    marketSource: text('market_source'),
    lastUpdated: text('last_updated'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.userId] }),
  ]
);

// Portfolio summary cache / rollup table
export const portfolioSummaries = pgTable('portfolio_summaries', {
  userId: text('user_id').primaryKey().references(() => users.uid, { onDelete: 'cascade' }),
  totalValueUSD: doublePrecision('total_value_usd').notNull().default(0),
  totalCostUSD: doublePrecision('total_cost_usd').notNull().default(0),
  totalGainLossUSD: doublePrecision('total_gain_loss_usd').notNull().default(0),
  totalGainLossPercent: doublePrecision('total_gain_loss_percent').notNull().default(0),
  itemCount: integer('item_count').notNull().default(0),
  sandboxCount: integer('sandbox_count').notNull().default(0),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  items: many(items),
  sandboxes: many(sandboxes),
  summary: one(portfolioSummaries, {
    fields: [users.uid],
    references: [portfolioSummaries.userId],
  }),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  user: one(users, {
    fields: [items.userId],
    references: [users.uid],
  }),
}));

export const sandboxesRelations = relations(sandboxes, ({ one }) => ({
  user: one(users, {
    fields: [sandboxes.userId],
    references: [users.uid],
  }),
}));
