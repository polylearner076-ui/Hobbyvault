import { db, ensureTablesExist } from './index.ts';
import { users, sandboxes, items, portfolioSummaries } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedSupabaseDatabase() {
  console.log('🔄 Initializing tables and seeding Supabase database...');
  await ensureTablesExist();

  // 1. Seed User 123123@gmail.com
  const userRecord = {
    uid: 'user_123123',
    email: '123123@gmail.com',
    password: '123123',
    displayName: 'Dummy Collector',
    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=123123',
    providerId: 'password',
    primaryProvider: 'password',
    linkedProviders: ['password'],
    totalPortfolioValueUSD: 33500.00,
    totalPortfolioCostUSD: 23300.00,
    totalPortfolioGainLossUSD: 10200.00,
    totalItems: 3,
  };

  const existingUser = await db.select().from(users).where(eq(users.uid, userRecord.uid)).limit(1);
  if (existingUser.length === 0) {
    await db.insert(users).values(userRecord);
    console.log('✅ Seeded user:', userRecord.email);
  } else {
    await db.update(users).set(userRecord).where(eq(users.uid, userRecord.uid));
    console.log('✅ Updated user:', userRecord.email);
  }

  // 2. Seed Sandboxes (Vaults)
  const defaultSandboxes = [
    {
      id: 'default',
      userId: 'user_123123',
      name: 'Main Collector Vault',
      type: 'default',
      description: 'Primary portfolio containing top tier grails and collectibles',
      iconName: 'Shield',
      themeColor: '#007AFF',
    },
    {
      id: 'vintage-cards',
      userId: 'user_123123',
      name: 'Vintage TCG & Grails',
      type: 'trading-cards',
      description: 'High grade Pokémon and Magic the Gathering vintage items',
      iconName: 'Sparkles',
      themeColor: '#FF9500',
    },
    {
      id: 'beyblade-models',
      userId: 'user_123123',
      name: 'Beyblades & Scale Models',
      type: 'custom',
      description: 'Custom Beyblade battle gear and Gundam Master Grades',
      iconName: 'Boxes',
      themeColor: '#5856D6',
    }
  ];

  for (const s of defaultSandboxes) {
    const existing = await db.select().from(sandboxes).where(eq(sandboxes.id, s.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(sandboxes).values(s);
    }
  }
  console.log('✅ Seeded sandboxes');

  // 3. Seed Collectible Assets
  const seedItems = [
    {
      id: 'item-charizard-1st',
      userId: 'user_123123',
      sandboxId: 'vintage-cards',
      name: '1999 Pokémon Base Set 1st Edition Charizard #4 Shadowless',
      category: 'pokemon',
      imageUrl: 'https://images.unsplash.com/photo-1613770920295-90f81544dd7c?w=600&auto=format&fit=crop&q=80',
      currentPriceUSD: 14500.00,
      previousPriceUSD_24h: 14200.00,
      previousPriceUSD_7d: 13800.00,
      previousPriceUSD_30d: 13200.00,
      purchasePriceUSD: 9800.00,
      purchaseDate: '2023-04-15',
      quantity: 1,
      condition: 'PSA 9 Mint',
      notes: 'Acquired at national convention, authenticated with clean holographic foil',
      tags: ['Grail', 'Vintage', 'PSA', 'Base Set'],
      isFavorite: true,
      marketSource: 'TCGPlayer / eBay Verified',
      lastUpdated: new Date().toISOString(),
      cardSpecs: {
        game: 'Pokemon TCG',
        setName: 'Base Set (1st Edition)',
        cardNumber: '4/102',
        rarity: 'Holo Rare',
        gradingCompany: 'PSA',
        gradeScore: '9',
        certNumber: '48291044',
      },
      priceHistory: [
        { date: '2023-04-15', price: 9800 },
        { date: '2023-08-01', price: 11200 },
        { date: '2023-12-15', price: 12500 },
        { date: '2024-04-01', price: 13800 },
        { date: '2024-08-15', price: 14500 },
      ]
    },
    {
      id: 'item-black-lotus',
      userId: 'user_123123',
      sandboxId: 'vintage-cards',
      name: 'Magic: The Gathering Unlimited Edition Black Lotus Artifact',
      category: 'mtg',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
      currentPriceUSD: 18500.00,
      previousPriceUSD_24h: 18500.00,
      previousPriceUSD_7d: 17900.00,
      previousPriceUSD_30d: 17200.00,
      purchasePriceUSD: 13500.00,
      purchaseDate: '2022-11-20',
      quantity: 1,
      condition: 'BGS 9 Mint',
      notes: 'Power Nine centerpiece. Sharp corners, clean centering 9.5',
      tags: ['Power Nine', 'Vintage', 'BGS', 'Investment'],
      isFavorite: true,
      marketSource: 'Cardmarket / MTGStocks Index',
      lastUpdated: new Date().toISOString(),
      cardSpecs: {
        game: 'Magic The Gathering',
        setName: 'Unlimited Edition',
        cardNumber: 'Artifact',
        rarity: 'Rare',
        gradingCompany: 'BGS',
        gradeScore: '9.0',
        certNumber: '0012849502',
      },
      priceHistory: [
        { date: '2022-11-20', price: 13500 },
        { date: '2023-06-10', price: 15400 },
        { date: '2023-11-15', price: 16800 },
        { date: '2024-03-20', price: 17500 },
        { date: '2024-08-15', price: 18500 },
      ]
    },
    {
      id: 'item-dragoon-ms-uv',
      userId: 'user_123123',
      sandboxId: 'beyblade-models',
      name: 'Takara Beyblade Hard Metal System Dragoon MS Ultimate Version (A-126)',
      category: 'beyblade',
      imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
      currentPriceUSD: 500.00,
      previousPriceUSD_24h: 500.00,
      previousPriceUSD_7d: 480.00,
      previousPriceUSD_30d: 450.00,
      purchasePriceUSD: 300.00,
      purchaseDate: '2023-06-12',
      quantity: 1,
      condition: 'Mint in Box (MIB)',
      notes: 'Sealed Japanese Takara box with unapplied holographic stickers and original HMS winder',
      tags: ['HMS', 'Takara', 'Sealed', 'Beyblade'],
      isFavorite: true,
      marketSource: 'Yahoo Auctions Japan / Mandarake',
      lastUpdated: new Date().toISOString(),
      beybladeSpecs: {
        generation: 'Hard Metal System (HMS)',
        system: 'Metal / Left Spin',
        bitChip: 'Dragoon Emblem Metal',
        attackRing: 'Metal Spring AR',
        weightDisk: 'Circle Heavy',
        bladeBase: 'Running Core Left Flat',
      },
      priceHistory: [
        { date: '2023-06-12', price: 300 },
        { date: '2023-12-01', price: 400 },
        { date: '2024-04-10', price: 460 },
        { date: '2024-08-15', price: 500 },
      ]
    }
  ];

  for (const it of seedItems) {
    const existing = await db.select().from(items).where(eq(items.id, it.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(items).values(it as any);
    } else {
      await db.update(items).set(it as any).where(eq(items.id, it.id));
    }
  }
  console.log('✅ Seeded collectible assets for user_123123');

  // 4. Seed Portfolio Summary
  const summary = {
    userId: 'user_123123',
    totalValueUSD: 33500.00,
    totalCostUSD: 23300.00,
    totalGainLossUSD: 10200.00,
    totalGainLossPercent: 43.77,
    itemCount: 3,
    sandboxCount: 3,
    lastUpdated: new Date(),
  };

  const existingSummary = await db.select().from(portfolioSummaries).where(eq(portfolioSummaries.userId, summary.userId)).limit(1);
  if (existingSummary.length === 0) {
    await db.insert(portfolioSummaries).values(summary);
  } else {
    await db.update(portfolioSummaries).set(summary).where(eq(portfolioSummaries.userId, summary.userId));
  }
  console.log('✅ Seeded portfolio summary for user_123123');

  return {
    success: true,
    user: userRecord,
    sandboxes: defaultSandboxes,
    items: seedItems,
    summary,
  };
}
