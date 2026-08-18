import { Sandbox, AssetItem, CurrencyConfig } from '../types';

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
  startRatio = 0.8,
  days = 365
): { date: string; priceUSD: number }[] {
  const points: { date: string; priceUSD: number }[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const startPrice = Math.max(1, currentPrice * startRatio);
  const stepDays = days > 90 ? 7 : 1;

  for (let i = days; i >= 0; i -= stepDays) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    const progress = (days - i) / days; // 0 to 1
    // Base linear interpolated path from startPrice to currentPrice
    const base = startPrice + (currentPrice - startPrice) * progress;

    // Dampening envelope: 0 at progress=0, 0 at progress=1 (ensures smooth connection at both ends)
    const envelope = Math.sin(progress * Math.PI);

    let perturbation = 0;
    if (trend === 'bullish') {
      perturbation = envelope * Math.sin(progress * Math.PI * 3) * (currentPrice * 0.05);
    } else if (trend === 'volatile') {
      perturbation = envelope * Math.sin(progress * Math.PI * 6) * (currentPrice * 0.08);
    } else if (trend === 'dip_rebound') {
      perturbation = -envelope * Math.sin(progress * Math.PI * 1.5) * (currentPrice * 0.10);
    } else {
      perturbation = envelope * Math.sin(progress * Math.PI * 2) * (currentPrice * 0.02);
    }

    const price = Math.max(1, base + perturbation);

    points.push({
      date: dateStr,
      priceUSD: i === 0 ? Number(currentPrice.toFixed(2)) : Number(price.toFixed(2)),
    });
  }

  // Ensure deduplicated and sorted
  const map = new Map<string, number>();
  points.forEach((p) => map.set(p.date, p.priceUSD));
  map.set(todayStr, Number(currentPrice.toFixed(2)));

  return Array.from(map.entries())
    .map(([date, priceUSD]) => ({ date, priceUSD }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// No hardcoded initial items - all items are real user items from PostgreSQL / Firestore database
export const INITIAL_ITEMS: AssetItem[] = [];
