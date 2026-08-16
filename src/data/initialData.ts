import { Sandbox, AssetItem, CurrencyConfig } from '../types';

import cobaltDrakeImg from '../assets/images/cobalt_drake_bey_1786709634306.jpg';
import wizardRodImg from '../assets/images/wizard_rod_bey_1786709653445.jpg';
import phoenixWingImg from '../assets/images/phoenix_wing_bey_1786709673185.jpg';
import stormPegasisImg from '../assets/images/storm_pegasis_bey_1786709695276.jpg';
import pokemonEmeraldImg from '../assets/images/pokemon_emerald_gba_1786709713827.jpg';
import dranSwordImg from '../assets/images/dran_sword_bey_1786709747351.jpg';
import dranBusterImg from '../assets/images/dran_buster_bey_1786709763018.jpg';
import luffyMangaImg from '../assets/images/luffy_op05_manga_1786710252169.jpg';

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', rateToUSD: 1.0, label: 'USD ($)' },
  EUR: { code: 'EUR', symbol: '€', rateToUSD: 0.92, label: 'EUR (€)' },
  GBP: { code: 'GBP', symbol: '£', rateToUSD: 0.79, label: 'GBP (£)' },
  JPY: { code: 'JPY', symbol: '¥', rateToUSD: 154.5, label: 'JPY (¥)' },
  CAD: { code: 'CAD', symbol: 'CA$', rateToUSD: 1.38, label: 'CAD ($)' },
  AUD: { code: 'AUD', symbol: 'A$', rateToUSD: 1.55, label: 'AUD ($)' },
};

export const INITIAL_SANDBOXES: Sandbox[] = [
  {
    id: 'sandbox-pokemon',
    name: 'Pokémon TCG',
    type: 'pokemon',
    description: 'Cards, booster boxes, slabs (PSA/BGS/CGC), and vintage promos',
    iconName: 'Sparkles',
    themeColor: '#FF9500', // Apple Amber / Gold
    createdAt: '2025-01-01',
  },
  {
    id: 'sandbox-beyblade',
    name: 'Beyblade Vault',
    type: 'beyblade',
    description: 'Takara Tomy & Hasbro X-Series, Burst, Metal Fight, and rare beys',
    iconName: 'RotateCw',
    themeColor: '#007AFF', // Apple Blue
    createdAt: '2025-01-01',
  },
  {
    id: 'sandbox-mtg',
    name: 'Magic: The Gathering',
    type: 'mtg',
    description: 'Reserved list staples, serialized cards, and modern horizons',
    iconName: 'Flame',
    themeColor: '#AF52DE', // Apple Purple
    createdAt: '2025-02-01',
  },
  {
    id: 'sandbox-onepiece',
    name: 'One Piece Card Game',
    type: 'onepiece',
    description: 'Manga rares, flagship winner cards, and OP booster cases',
    iconName: 'Anchor',
    themeColor: '#FF3B30', // Apple Crimson Red
    createdAt: '2025-01-15',
  },
  {
    id: 'sandbox-gaming',
    name: 'Retro & Modern Games',
    type: 'gaming',
    description: 'CIB retro cartridges, limited run editions, and rare consoles',
    iconName: 'Gamepad2',
    themeColor: '#34C759', // Apple Mint Green
    createdAt: '2025-02-10',
  },
];

// Helper to upsert a price history point deduplicating by date
export function upsertPriceHistoryPoint(
  history: { date: string; priceUSD: number }[] | undefined,
  dateStr: string,
  priceUSD: number
): { date: string; priceUSD: number }[] {
  const current = history ? [...history] : [];
  const map = new Map<string, number>();
  current.forEach((p) => {
    if (p && p.date && typeof p.priceUSD === 'number') {
      map.set(p.date, p.priceUSD);
    }
  });
  map.set(dateStr, Number(priceUSD.toFixed(2)));

  return Array.from(map.entries())
    .map(([date, price]) => ({ date, priceUSD: price }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Helper to generate realistic historical price curve leading to currentPrice
export function generateHistory(
  currentPrice: number,
  trend: 'bullish' | 'steady' | 'volatile' | 'dip_rebound' = 'bullish',
  startRatio = 0.65,
  days = 365
): { date: string; priceUSD: number }[] {
  const points: { date: string; priceUSD: number }[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const currentVal = currentPrice * startRatio;
  const step = (currentPrice - currentVal) / days;
  const stepDays = days > 90 ? 7 : 1;

  for (let i = days; i > 0; i -= stepDays) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    const progress = (days - i) / days;
    let price = currentVal + step * (days - i);

    if (trend === 'bullish') {
      price = price * (1 + (Math.sin(progress * Math.PI * 4) * 0.05) + Math.pow(progress, 2) * 0.15);
    } else if (trend === 'volatile') {
      price = price * (1 + Math.sin(progress * Math.PI * 8) * 0.12);
    } else if (trend === 'dip_rebound') {
      price = price * (1 - Math.sin(progress * Math.PI) * 0.2 + progress * 0.25);
    } else {
      price = price * (1 + (Math.sin(progress * 10) * 0.03));
    }

    points.push({
      date: dateStr,
      priceUSD: Number(Math.max(1, price).toFixed(2)),
    });
  }

  // Always ensure exact today's point (i = 0) is present and equals currentPrice
  points.push({
    date: todayStr,
    priceUSD: Number(currentPrice.toFixed(2)),
  });

  return points;
}

export const INITIAL_ITEMS: AssetItem[] = [
  // POKEMON TCG ITEMS (Official TCGPlayer & PokemonTCG Live Data)
  {
    id: 'poke-01',
    sandboxId: 'sandbox-pokemon',
    name: 'Charizard ex #199/165 (Special Illustration Rare)',
    category: 'pokemon',
    imageUrl: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
    currentPriceUSD: 368.80,
    previousPriceUSD_24h: 362.00,
    previousPriceUSD_7d: 345.00,
    previousPriceUSD_30d: 310.00,
    purchasePriceUSD: 280.00,
    purchaseDate: '2024-11-12',
    quantity: 1,
    condition: 'PSA_10',
    tags: ['Scarlet & Violet 151', 'Charizard', 'Slab', 'SIR', 'Graded'],
    priceHistory: generateHistory(368.80, 'bullish', 0.72),
    cardSpecs: {
      game: 'Pokemon',
      setName: 'Scarlet & Violet: 151',
      setNumber: '199/165',
      rarity: 'Special Illustration Rare',
      illustrator: 'miki kudo',
      releaseYear: 2023,
      isFoil: true,
      gradingCompany: 'PSA',
      gradeValue: '10',
      certNumber: '83920194',
    },
    transactions: [
      {
        id: 'tx-p1',
        type: 'BUY',
        date: '2024-11-12',
        quantity: 1,
        pricePerUnitUSD: 280.00,
        notes: 'Purchased at card convention PSA 10',
      },
    ],
    storageLocation: {
      metaStorage: 'Master Fireproof Safe (Office)',
      container: 'Pelican 1500 Slab Case',
      slot: 'Row 1, Slab #01',
      notes: 'PSA 10 Gem Mint in fitted sleeve',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: true,
    marketSource: 'TCGPlayer Market Index (Live Official)',
  },
  {
    id: 'poke-02',
    sandboxId: 'sandbox-pokemon',
    name: 'Umbreon VMAX #215/203 (Secret Alt Art - Moonbreon)',
    category: 'pokemon',
    imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    currentPriceUSD: 2244.50,
    previousPriceUSD_24h: 2210.00,
    previousPriceUSD_7d: 2150.00,
    previousPriceUSD_30d: 1980.00,
    purchasePriceUSD: 1450.00,
    purchaseDate: '2024-03-10',
    quantity: 1,
    condition: 'PSA_10',
    tags: ['Evolving Skies', 'Umbreon', 'Grail', 'Alt Art', 'Slab'],
    priceHistory: generateHistory(2244.50, 'bullish', 0.60),
    cardSpecs: {
      game: 'Pokemon',
      setName: 'Sword & Shield: Evolving Skies',
      setNumber: '215/203',
      rarity: 'Secret Rare Alt Art',
      illustrator: 'KEIICHIRO ITO',
      releaseYear: 2021,
      isFoil: true,
      gradingCompany: 'PSA',
      gradeValue: '10',
      certNumber: '71039482',
    },
    transactions: [
      {
        id: 'tx-p2',
        type: 'BUY',
        date: '2024-03-10',
        quantity: 1,
        pricePerUnitUSD: 1450.00,
        notes: 'Moonbreon PSA 10 grail investment',
      },
    ],
    storageLocation: {
      metaStorage: 'Master Fireproof Safe (Office)',
      container: 'Pelican 1500 Slab Case',
      slot: 'Row 1, Slab #02 (Grail Lock)',
      notes: 'UV-shielded PSA 10 sleeve',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: true,
    marketSource: 'TCGPlayer Market Index (Live Official)',
  },
  {
    id: 'poke-03',
    sandboxId: 'sandbox-pokemon',
    name: 'Pikachu with Grey Felt Hat #085 (Van Gogh Promo)',
    category: 'pokemon',
    imageUrl: 'https://images.pokemontcg.io/svp/85_hires.png',
    currentPriceUSD: 1098.70,
    previousPriceUSD_24h: 1080.00,
    previousPriceUSD_7d: 1020.00,
    previousPriceUSD_30d: 950.00,
    purchasePriceUSD: 450.00,
    purchaseDate: '2023-10-05',
    quantity: 2,
    condition: 'RAW_NM',
    copies: [
      {
        id: 'copy-p3-1',
        condition: 'RAW_NM',
        customConditionLabel: 'Near Mint (Sealed Cellophane)',
        purchasePriceUSD: 95.00,
        purchaseDate: '2023-10-05',
        currentValueUSD: 1098.70,
        storageLocation: {
          metaStorage: 'Master Fireproof Safe (Office)',
          container: 'Pelican 1500 Slab Case',
          slot: 'Row 2, Top Slot (Museum Polybag Sealed)',
          notes: 'Unopened sealed museum promo',
        },
        notes: 'Museum release with original brochure',
      },
      {
        id: 'copy-p3-2',
        condition: 'RAW_LP',
        customConditionLabel: 'Well Condition (Light Play)',
        purchasePriceUSD: 85.00,
        purchaseDate: '2023-10-08',
        currentValueUSD: 824.00,
        storageLocation: {
          metaStorage: 'Display Cabinet (Living Room)',
          container: 'VaultX 9-Pocket Zip Binder (Teal)',
          slot: 'Page 1, Slot 2',
          notes: 'Minor corner soft touch from binder handling',
        },
        notes: 'Well preserved in double sleeve',
      },
    ],
    tags: ['Promo', 'Van Gogh Museum', 'Pikachu', 'Sealed'],
    priceHistory: generateHistory(1098.70, 'dip_rebound', 0.50),
    cardSpecs: {
      game: 'Pokemon',
      setName: 'SV Black Star Promos (Van Gogh)',
      setNumber: '085',
      rarity: 'Promo',
      illustrator: 'Naoyo Kimura',
      releaseYear: 2023,
      isFoil: true,
      gradingCompany: 'None',
    },
    transactions: [
      {
        id: 'tx-p3',
        type: 'BUY',
        date: '2023-10-05',
        quantity: 2,
        pricePerUnitUSD: 95.00,
        notes: 'Acquired 2 sealed copies from Amsterdam museum release',
      },
    ],
    storageLocation: {
      metaStorage: 'Display Cabinet (Living Room)',
      container: 'VaultX 9-Pocket Zip Binder (Teal)',
      slot: 'Page 1, Slot 1-2 (Sealed Cellophane)',
      notes: 'Original Amsterdam Museum receipt attached',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: false,
    marketSource: 'CardMarket & PriceCharting API',
  },
  {
    id: 'poke-04',
    sandboxId: 'sandbox-pokemon',
    name: 'Gengar VMAX #271/264 (Fusion Strike Alt Art)',
    category: 'pokemon',
    imageUrl: 'https://images.pokemontcg.io/swsh8/271_hires.png',
    currentPriceUSD: 340.00,
    previousPriceUSD_24h: 338.00,
    previousPriceUSD_7d: 325.00,
    previousPriceUSD_30d: 295.00,
    purchasePriceUSD: 240.00,
    purchaseDate: '2024-06-18',
    quantity: 1,
    condition: 'CGC_10',
    tags: ['Fusion Strike', 'Gengar', 'Alt Art', 'Pristine 10'],
    priceHistory: generateHistory(340.00, 'bullish', 0.70),
    cardSpecs: {
      game: 'Pokemon',
      setName: 'Sword & Shield: Fusion Strike',
      setNumber: '271/264',
      rarity: 'Secret Rare Alt Art',
      illustrator: 'sowsow',
      releaseYear: 2021,
      isFoil: true,
      gradingCompany: 'CGC',
      gradeValue: '10',
      certNumber: '4390192830',
    },
    transactions: [
      {
        id: 'tx-p4',
        type: 'BUY',
        date: '2024-06-18',
        quantity: 1,
        pricePerUnitUSD: 240.00,
        notes: 'CGC Pristine 10 Gengar Alt Art',
      },
    ],
    storageLocation: {
      metaStorage: 'Master Fireproof Safe (Office)',
      container: 'Pelican 1500 Slab Case',
      slot: 'Row 2, Slab #04',
      notes: 'CGC Pristine 10',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: false,
    marketSource: 'PriceCharting Live API',
  },

  // MAGIC: THE GATHERING ITEMS (Live Scryfall Official API Data & Official CDN Images)
  {
    id: 'mtg-01',
    sandboxId: 'sandbox-mtg',
    name: 'Ragavan, Nimble Pilferer',
    category: 'mtg',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/9/a9738cda-adb1-47fb-9f4c-ecd930228c4d.jpg',
    currentPriceUSD: 42.44,
    previousPriceUSD_24h: 41.50,
    previousPriceUSD_7d: 39.80,
    previousPriceUSD_30d: 38.00,
    purchasePriceUSD: 36.00,
    purchaseDate: '2024-05-14',
    quantity: 4,
    condition: 'RAW_NM',
    tags: ['Modern Horizons 2', 'Monkey', 'Modern Staple', 'Mythic'],
    priceHistory: generateHistory(42.44, 'bullish', 0.75),
    cardSpecs: {
      game: 'Magic: The Gathering',
      setName: 'Modern Horizons 2',
      setNumber: '138',
      rarity: 'Mythic',
      illustrator: 'Simon Dominic',
      releaseYear: 2021,
      isFoil: false,
      gradingCompany: 'None',
    },
    transactions: [
      {
        id: 'tx-m1',
        type: 'BUY',
        date: '2024-05-14',
        quantity: 4,
        pricePerUnitUSD: 36.00,
        notes: 'Playset of 4 for Modern Izzet Murktide deck',
      },
    ],
    storageLocation: {
      metaStorage: 'Home Office Desk',
      container: 'Ultimate Guard Bolder 100+ Deck Box',
      slot: 'Main Deck #1-4',
      notes: 'Double sleeved in KMC Perfect Fits & Dragon Shield Matte Red',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: true,
    marketSource: 'Scryfall TCG Live API (Official)',
  },
  {
    id: 'mtg-02',
    sandboxId: 'sandbox-mtg',
    name: 'The One Ring #246',
    category: 'mtg',
    imageUrl: 'https://cards.scryfall.io/normal/front/d/5/d5806e68-1054-458e-866d-1f2470f682b2.jpg',
    currentPriceUSD: 106.24,
    previousPriceUSD_24h: 104.50,
    previousPriceUSD_7d: 98.00,
    previousPriceUSD_30d: 88.00,
    purchasePriceUSD: 65.00,
    purchaseDate: '2023-09-12',
    quantity: 2,
    condition: 'PSA_10',
    tags: ['Lord of the Rings', 'Tolkien', 'LTR', 'Mythic', 'Slab'],
    priceHistory: generateHistory(106.24, 'bullish', 0.60),
    cardSpecs: {
      game: 'Magic: The Gathering',
      setName: 'The Lord of the Rings: Tales of Middle-earth',
      setNumber: '246',
      rarity: 'Mythic',
      illustrator: 'Tanya Sanchez-Gomez',
      releaseYear: 2023,
      isFoil: true,
      gradingCompany: 'PSA',
      gradeValue: '10',
      certNumber: '89102394',
    },
    transactions: [
      {
        id: 'tx-m2',
        type: 'BUY',
        date: '2023-09-12',
        quantity: 2,
        pricePerUnitUSD: 65.00,
        notes: 'Pre-surge purchase PSA 10 copies',
      },
    ],
    storageLocation: {
      metaStorage: 'Master Fireproof Safe (Office)',
      container: 'Pelican 1500 Slab Case',
      slot: 'Row 2, Slab #07',
      notes: 'PSA 10 Lord of the Rings serialized candidate',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: true,
    marketSource: 'Scryfall TCG Live API (Official)',
  },
  {
    id: 'mtg-03',
    sandboxId: 'sandbox-mtg',
    name: 'Black Lotus (Unlimited Edition)',
    category: 'mtg',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
    currentPriceUSD: 14500.00,
    previousPriceUSD_24h: 14500.00,
    previousPriceUSD_7d: 14200.00,
    previousPriceUSD_30d: 13800.00,
    purchasePriceUSD: 9500.00,
    purchaseDate: '2021-08-20',
    quantity: 1,
    condition: 'BGS_9.5',
    tags: ['Power Nine', 'Reserved List', 'Vintage', 'Grail'],
    priceHistory: generateHistory(14500.00, 'bullish', 0.65),
    cardSpecs: {
      game: 'Magic: The Gathering',
      setName: 'Unlimited Edition',
      setNumber: '232',
      rarity: 'Rare',
      illustrator: 'Christopher Rush',
      releaseYear: 1993,
      isFoil: false,
      gradingCompany: 'BGS',
      gradeValue: '9',
      certNumber: '0012948201',
    },
    transactions: [
      {
        id: 'tx-m3',
        type: 'BUY',
        date: '2021-08-20',
        quantity: 1,
        pricePerUnitUSD: 9500.00,
        notes: 'Grail Power 9 Reserved List addition',
      },
    ],
    storageLocation: {
      metaStorage: 'Bank Safe Deposit Box #412',
      container: 'Heavy Duty Metal Slab Case',
      slot: 'Vault Compartment A (Subgrades: 9.5/9.5/9.5/9.0)',
      notes: 'BGS Gem Mint 9.5 Unlimited Power 9',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: true,
    marketSource: 'Scryfall TCG Live API (Official)',
  },

  // BEYBLADE ITEMS (Takara Tomy Official Specs & Verified Market Data)
  {
    id: 'bey-01',
    sandboxId: 'sandbox-beyblade',
    name: 'Cobalt Drake 4-60F (CoroCoro Rare Bey Get Battle Limited BX-00)',
    category: 'beyblade',
    imageUrl: cobaltDrakeImg,
    currentPriceUSD: 285.00,
    previousPriceUSD_24h: 280.00,
    previousPriceUSD_7d: 270.00,
    previousPriceUSD_30d: 240.00,
    purchasePriceUSD: 190.00,
    purchaseDate: '2024-02-14',
    quantity: 1,
    condition: 'NIB',
    tags: ['Beyblade X', 'Rare Bey Get', 'Cobalt Drake', 'Limited Edition', 'Competitive'],
    priceHistory: generateHistory(285.00, 'bullish', 0.65),
    beybladeSpecs: {
      generation: 'Beyblade X',
      system: 'BX (Basic Line)',
      type: 'Attack',
      spinDirection: 'Right',
      blade: 'Cobalt Drake (Heavy Metal Coated)',
      ratchet: '4-60',
      bit: 'Flat (F)',
      weightGrams: 51.8,
      code: 'BX-00 Rare',
      brand: 'Takara Tomy',
    },
    transactions: [
      {
        id: 'tx-b1',
        type: 'BUY',
        date: '2024-02-14',
        quantity: 1,
        pricePerUnitUSD: 190.00,
        notes: 'Won via Japanese Beyblade X App Rare Bey Get & imported',
      },
    ],
    storageLocation: {
      metaStorage: 'Display Cabinet (Living Room)',
      container: 'Acrylic Display Showcase Tier 1',
      slot: 'Pedestal 1 (Center Display)',
      notes: 'Rare Bey Get Battle Limited Edition BX-00 in mint packaging',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: true,
    marketSource: 'Takara Tomy & Tokyo Secondary Index',
  },
  {
    id: 'bey-02',
    sandboxId: 'sandbox-beyblade',
    name: 'Wizard Rod 5-70DB (UX-03 Booster Stamina)',
    category: 'beyblade',
    imageUrl: wizardRodImg,
    currentPriceUSD: 34.00,
    previousPriceUSD_24h: 34.00,
    previousPriceUSD_7d: 32.50,
    previousPriceUSD_30d: 28.00,
    purchasePriceUSD: 22.00,
    purchaseDate: '2024-04-20',
    quantity: 2,
    condition: 'RAW_NM',
    tags: ['Beyblade X', 'Unique Line', 'Stamina King', 'Tournament Tier S'],
    priceHistory: generateHistory(34.00, 'bullish', 0.65),
    beybladeSpecs: {
      generation: 'Beyblade X',
      system: 'UX (Unique Line)',
      type: 'Stamina',
      spinDirection: 'Right',
      blade: 'Wizard Rod (Outer Metal Distribution)',
      ratchet: '5-70',
      bit: 'Disc Ball (DB)',
      weightGrams: 47.4,
      code: 'UX-03',
      brand: 'Takara Tomy',
    },
    transactions: [
      {
        id: 'tx-b2',
        type: 'BUY',
        date: '2024-04-20',
        quantity: 2,
        pricePerUnitUSD: 22.00,
        notes: 'Pre-ordered launch batch from AmiAmi',
      },
    ],
    storageLocation: {
      metaStorage: 'Home Office Desk',
      container: 'Meiho Beyblade Hard Case (3-Slot)',
      slot: 'Bay 1 (Tournament Ready)',
      notes: '5-70DB tuned balance for WBBA tournament play',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: true,
    marketSource: 'Takara Tomy Official & Amazon JP Live API',
  },
  {
    id: 'bey-03',
    sandboxId: 'sandbox-beyblade',
    name: 'Phoenix Wing 9-60GF (BX-23 Starter w/ String Launcher)',
    category: 'beyblade',
    imageUrl: phoenixWingImg,
    currentPriceUSD: 42.00,
    previousPriceUSD_24h: 42.00,
    previousPriceUSD_7d: 40.00,
    previousPriceUSD_30d: 38.00,
    purchasePriceUSD: 30.00,
    purchaseDate: '2024-01-05',
    quantity: 1,
    condition: 'NIB',
    tags: ['Beyblade X', 'Starter', 'Red Metal Coat', 'Phoenix Wing'],
    priceHistory: generateHistory(42.00, 'steady', 0.70),
    beybladeSpecs: {
      generation: 'Beyblade X',
      system: 'BX (Basic Line)',
      type: 'Attack',
      spinDirection: 'Right',
      blade: 'Phoenix Wing (Painted Heavy Blade)',
      ratchet: '9-60',
      bit: 'Gear Flat (GF)',
      weightGrams: 52.3,
      code: 'BX-23',
      brand: 'Takara Tomy',
    },
    transactions: [
      {
        id: 'tx-b3',
        type: 'BUY',
        date: '2024-01-05',
        quantity: 1,
        pricePerUnitUSD: 30.00,
        notes: 'Includes Red Ripcord String Launcher',
      },
    ],
    storageLocation: {
      metaStorage: 'Display Cabinet (Living Room)',
      container: 'Acrylic Display Showcase Tier 1',
      slot: 'Pedestal 2 (Right Tier)',
      notes: 'NIB Starter with String Launcher',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: false,
    marketSource: 'Takara Tomy Official Specs Index',
  },
  {
    id: 'bey-04',
    sandboxId: 'sandbox-beyblade',
    name: 'Storm Pegasis 105RF (Metal Fight BB-28 First Edition)',
    category: 'beyblade',
    imageUrl: stormPegasisImg,
    currentPriceUSD: 145.00,
    previousPriceUSD_24h: 145.00,
    previousPriceUSD_7d: 140.00,
    previousPriceUSD_30d: 130.00,
    purchasePriceUSD: 85.00,
    purchaseDate: '2023-08-19',
    quantity: 1,
    condition: 'MINT_IN_BOX',
    tags: ['Metal Fight', 'MFB', 'Pegasus', 'Gingka', 'Vintage 2009'],
    priceHistory: generateHistory(145.00, 'bullish', 0.58),
    beybladeSpecs: {
      generation: 'Metal Fight',
      system: 'Hybrid Wheel System (HWS)',
      type: 'Attack',
      spinDirection: 'Right',
      blade: 'Storm Wheel & Pegasis Clear Wheel',
      ratchet: '105 Track',
      bit: 'Rubber Flat (RF) Bottom',
      weightGrams: 37.8,
      code: 'BB-28',
      brand: 'Takara Tomy',
    },
    transactions: [
      {
        id: 'tx-b4',
        type: 'BUY',
        date: '2023-08-19',
        quantity: 1,
        pricePerUnitUSD: 85.00,
        notes: 'Sealed Japanese Takara Tomy BB-28 box authenticated',
      },
    ],
    storageLocation: {
      metaStorage: 'Archive Storage Closet',
      container: 'BCW Vintage Storage Bin',
      slot: 'Compartment 3',
      notes: 'Original 2009 BB-28 Japanese First Print Box',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: true,
    marketSource: 'Takara Tomy & Buyee Japan Verified Comps',
  },

  // ONE PIECE CARD GAME ITEMS
  {
    id: 'op-01',
    sandboxId: 'sandbox-onepiece',
    name: 'Monkey.D.Luffy #OP05-119 (Manga Super Parallel)',
    category: 'onepiece',
    imageUrl: luffyMangaImg,
    currentPriceUSD: 1850.00,
    previousPriceUSD_24h: 1820.00,
    previousPriceUSD_7d: 1750.00,
    previousPriceUSD_30d: 1600.00,
    purchasePriceUSD: 1200.00,
    purchaseDate: '2024-01-20',
    quantity: 1,
    condition: 'BGS_10',
    tags: ['Awakening of the New Era', 'Manga Rare', 'Gear 5', 'BGS Black Label Candidate'],
    priceHistory: generateHistory(1850.00, 'bullish', 0.65),
    cardSpecs: {
      game: 'One Piece',
      setName: 'OP-05 Awakening of the New Era',
      setNumber: 'OP05-119',
      rarity: 'Secret Rare (Manga Parallel)',
      illustrator: 'Eiichiro Oda Manga Art',
      releaseYear: 2023,
      isFoil: true,
      gradingCompany: 'BGS',
      gradeValue: '10',
      certNumber: '0015948392',
    },
    transactions: [
      {
        id: 'tx-op1',
        type: 'BUY',
        date: '2024-01-20',
        quantity: 1,
        pricePerUnitUSD: 1200.00,
        notes: 'OP-05 Manga Luffy BGS 10 pristine gold label',
      },
    ],
    storageLocation: {
      metaStorage: 'Master Fireproof Safe (Office)',
      container: 'Pelican 1500 Slab Case',
      slot: 'Row 1, Slab #03',
      notes: 'BGS 10 Gold Label Manga Luffy',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: true,
    marketSource: 'TCGPlayer / SNKRDUNK Live API',
  },

  // RETRO GAMING ITEMS
  {
    id: 'game-01',
    sandboxId: 'sandbox-gaming',
    name: 'Pokémon Emerald Version (Game Boy Advance - CIB Complete)',
    category: 'gaming',
    imageUrl: pokemonEmeraldImg,
    currentPriceUSD: 360.00,
    previousPriceUSD_24h: 360.00,
    previousPriceUSD_7d: 350.00,
    previousPriceUSD_30d: 320.00,
    purchasePriceUSD: 210.00,
    purchaseDate: '2023-11-04',
    quantity: 1,
    condition: 'RAW_NM',
    tags: ['GBA', 'Nintendo', 'Rayquaza', 'Complete In Box', 'Authentic Battery Clean'],
    priceHistory: generateHistory(360.00, 'bullish', 0.58),
    transactions: [
      {
        id: 'tx-g1',
        type: 'BUY',
        date: '2023-11-04',
        quantity: 1,
        pricePerUnitUSD: 210.00,
        notes: 'Original box, inserts, wireless adapter, dry battery replaced',
      },
    ],
    storageLocation: {
      metaStorage: 'Display Cabinet (Living Room)',
      container: 'Boxed Game Acrylic Stand',
      slot: 'Shelf 3 Center',
      notes: 'CIB authentic with replacement clock battery',
    },
    lastUpdated: new Date().toISOString(),
    isFavorite: false,
    marketSource: 'PriceCharting Game Database API',
  },
];

// Curated Master Catalog for Search / Add Suggestions with Live Verified Scryfall & TCGdex Sources
export const POPULAR_CATALOG_ITEMS = [
  // MTG (Official Scryfall CDN Images & Live Specs)
  {
    name: 'Ragavan, Nimble Pilferer',
    category: 'mtg',
    sandboxId: 'sandbox-mtg',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/9/a9738cda-adb1-47fb-9f4c-ecd930228c4d.jpg',
    currentPriceUSD: 42.44,
    cardSpecs: { game: 'Magic: The Gathering', setName: 'Modern Horizons 2', setNumber: '138', rarity: 'Mythic', releaseYear: 2021 },
    tags: ['Modern Horizons 2', 'Scryfall Live', 'Ragavan', 'Mythic'],
  },
  {
    name: 'The One Ring #246',
    category: 'mtg',
    sandboxId: 'sandbox-mtg',
    imageUrl: 'https://cards.scryfall.io/normal/front/d/5/d5806e68-1054-458e-866d-1f2470f682b2.jpg',
    currentPriceUSD: 106.24,
    cardSpecs: { game: 'Magic: The Gathering', setName: 'The Lord of the Rings: Tales of Middle-earth', setNumber: '246', rarity: 'Mythic', releaseYear: 2023 },
    tags: ['Lord of the Rings', 'Scryfall Live', 'The One Ring', 'Mythic'],
  },
  {
    name: 'Black Lotus (Unlimited Edition)',
    category: 'mtg',
    sandboxId: 'sandbox-mtg',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
    currentPriceUSD: 14500.00,
    cardSpecs: { game: 'Magic: The Gathering', setName: 'Unlimited', setNumber: '232', rarity: 'Rare', releaseYear: 1993 },
    tags: ['Power Nine', 'Reserved List', 'Vintage Grail', 'Scryfall Live'],
  },
  {
    name: 'Force of Will (Dominaria Remastered)',
    category: 'mtg',
    sandboxId: 'sandbox-mtg',
    imageUrl: 'https://cards.scryfall.io/normal/front/8/9/897e5953-700a-4ded-a1a6-64c06775d103.jpg',
    currentPriceUSD: 68.50,
    cardSpecs: { game: 'Magic: The Gathering', setName: 'Dominaria Remastered', setNumber: '44', rarity: 'Mythic', releaseYear: 2023 },
    tags: ['Legacy', 'Vintage', 'Force of Will', 'Scryfall Live'],
  },

  // POKEMON (TCGdex Official High-Res Assets)
  {
    name: 'Charizard Base Set Unlimited #4/102',
    category: 'pokemon',
    sandboxId: 'sandbox-pokemon',
    imageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    currentPriceUSD: 350.00,
    cardSpecs: { game: 'Pokemon', setName: 'Base Set', setNumber: '4/102', rarity: 'Holo Rare', releaseYear: 1999 },
    tags: ['Base Set', 'Vintage', 'Charizard', 'Holo'],
  },
  {
    name: 'Giratina V #186/196 (Lost Origin Alt Art)',
    category: 'pokemon',
    sandboxId: 'sandbox-pokemon',
    imageUrl: 'https://images.pokemontcg.io/swsh11/186_hires.png',
    currentPriceUSD: 385.00,
    cardSpecs: { game: 'Pokemon', setName: 'Lost Origin', setNumber: '186/196', rarity: 'Alternate Art', releaseYear: 2022 },
    tags: ['Lost Origin', 'Giratina', 'Alt Art', 'Grail'],
  },
  {
    name: 'Rayquaza VMAX #218/203 (Evolving Skies Alt Art)',
    category: 'pokemon',
    sandboxId: 'sandbox-pokemon',
    imageUrl: 'https://images.pokemontcg.io/swsh7/218_hires.png',
    currentPriceUSD: 460.00,
    cardSpecs: { game: 'Pokemon', setName: 'Evolving Skies', setNumber: '218/203', rarity: 'Secret Rare Alt Art', releaseYear: 2021 },
    tags: ['Evolving Skies', 'Rayquaza', 'Alt Art'],
  },
  {
    name: 'Mew ex #205/165 (Bubble Mew - Paldean Fates / 151)',
    category: 'pokemon',
    sandboxId: 'sandbox-pokemon',
    imageUrl: 'https://images.pokemontcg.io/sv4pt5/232_hires.png',
    currentPriceUSD: 115.00,
    cardSpecs: { game: 'Pokemon', setName: 'Paldean Fates', setNumber: '232/091', rarity: 'Special Illustration Rare', releaseYear: 2024 },
    tags: ['Paldean Fates', 'Bubble Mew', 'SIR'],
  },
  {
    name: 'Lugia V #186/195 (Silver Tempest Alt Art)',
    category: 'pokemon',
    sandboxId: 'sandbox-pokemon',
    imageUrl: 'https://images.pokemontcg.io/swsh12/186_hires.png',
    currentPriceUSD: 195.00,
    cardSpecs: { game: 'Pokemon', setName: 'Silver Tempest', setNumber: '186/195', rarity: 'Alternate Art', releaseYear: 2022 },
    tags: ['Silver Tempest', 'Lugia', 'Alt Art'],
  },
  {
    name: 'Mario Pikachu Promo #294/XY-P',
    category: 'pokemon',
    sandboxId: 'sandbox-pokemon',
    imageUrl: 'https://images.pokemontcg.io/xyp/XYP_294_hires.png',
    currentPriceUSD: 3400.00,
    cardSpecs: { game: 'Pokemon', setName: 'XY Black Star Promos (JP)', setNumber: '294/XY-P', rarity: 'Japanese Exclusive Promo', releaseYear: 2016 },
    tags: ['Nintendo', 'Mario Pikachu', 'Grail', 'Japanese Promo'],
  },

  // BEYBLADE X & VINTAGE
  {
    name: 'Dran Sword 3-60F (BX-01 Starter)',
    category: 'beyblade',
    sandboxId: 'sandbox-beyblade',
    imageUrl: dranSwordImg,
    currentPriceUSD: 24.00,
    beybladeSpecs: { generation: 'Beyblade X', type: 'Attack', spinDirection: 'Right', blade: 'Dran Sword', ratchet: '3-60', bit: 'Flat', brand: 'Takara Tomy', code: 'BX-01' },
    tags: ['Beyblade X', 'BX-01', 'Attack', 'X-Dash'],
  },
  {
    name: 'Hells Scythe 4-60T (BX-02 Starter)',
    category: 'beyblade',
    sandboxId: 'sandbox-beyblade',
    imageUrl: phoenixWingImg,
    currentPriceUSD: 22.50,
    beybladeSpecs: { generation: 'Beyblade X', type: 'Balance', spinDirection: 'Right', blade: 'Hells Scythe', ratchet: '4-60', bit: 'Taper', brand: 'Takara Tomy', code: 'BX-02' },
    tags: ['Beyblade X', 'BX-02', 'Balance'],
  },
  {
    name: 'Knight Shield 3-80N (BX-04 Starter)',
    category: 'beyblade',
    sandboxId: 'sandbox-beyblade',
    imageUrl: wizardRodImg,
    currentPriceUSD: 21.00,
    beybladeSpecs: { generation: 'Beyblade X', type: 'Defense', spinDirection: 'Right', blade: 'Knight Shield', ratchet: '3-80', bit: 'Needle', brand: 'Takara Tomy', code: 'BX-04' },
    tags: ['Beyblade X', 'BX-04', 'Defense'],
  },
  {
    name: 'Dran Buster 1-60A (UX-01 Starter Accel)',
    category: 'beyblade',
    sandboxId: 'sandbox-beyblade',
    imageUrl: dranBusterImg,
    currentPriceUSD: 36.00,
    beybladeSpecs: { generation: 'Beyblade X', type: 'Attack', spinDirection: 'Right', blade: 'Dran Buster', ratchet: '1-60', bit: 'Accel', brand: 'Takara Tomy', code: 'UX-01' },
    tags: ['Beyblade X', 'UX-01', 'Heavy Metal', 'Unique Line'],
  },
  {
    name: 'Dragoon V2 (Original Plastics A-69 Takara Tomy)',
    category: 'beyblade',
    sandboxId: 'sandbox-beyblade',
    imageUrl: cobaltDrakeImg,
    currentPriceUSD: 210.00,
    beybladeSpecs: { generation: 'Original / Plastics', type: 'Attack', spinDirection: 'Left', blade: 'Dragoon V2 (Magnet Core)', brand: 'Takara Tomy', code: 'A-69' },
    tags: ['Plastics', 'Tyson Granger', 'Dragoon', 'Vintage 2002'],
  },
  {
    name: 'Diablo Nemesis X:D (Metal Fight 4D BB-122 Ultimate)',
    category: 'beyblade',
    sandboxId: 'sandbox-beyblade',
    imageUrl: stormPegasisImg,
    currentPriceUSD: 165.00,
    beybladeSpecs: { generation: 'Metal Fight', type: 'Balance', spinDirection: 'Right', blade: 'Diablo Metal Frame', ratchet: 'Nemesis Core', bit: 'X:Drive (X:D)', brand: 'Takara Tomy', code: 'BB-122' },
    tags: ['Metal Fight', '4D System', 'Diablo Nemesis', 'Heavyweight'],
  },
];
