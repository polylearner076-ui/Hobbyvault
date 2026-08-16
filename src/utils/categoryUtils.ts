import { CategoryTypeMeta, HobbyType } from '../types';

export interface CategoryGroupDef {
  id: string;
  name: string;
  badge: string;
}

export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  { id: 'tcg', name: 'Trading Card Games (TCG)', badge: 'TCG' },
  { id: 'toys_models', name: 'Action Toys, Models & Spinning Tops', badge: 'Toys & Models' },
  { id: 'gaming', name: 'Video Games & Hardware', badge: 'Gaming' },
  { id: 'comics_entertainment', name: 'Comics, Manga & Pop Culture', badge: 'Comics' },
  { id: 'luxury_fashion', name: 'Luxury, Timepieces & Streetwear', badge: 'Luxury' },
  { id: 'art_memorabilia', name: 'Art, Coins & Sports Memorabilia', badge: 'Memorabilia' },
  { id: 'custom_user', name: 'Custom Hobby Categories', badge: 'Custom' },
];

export const STANDARD_CATEGORY_METAS: CategoryTypeMeta[] = [
  // --- TRADING CARD GAMES (TCG) ---
  {
    id: 'pokemon',
    label: 'Pokémon TCG',
    group: 'Trading Card Games (TCG)',
    description: 'Booster boxes, vintage singles, graded slabs (PSA/BGS/CGC), and promos',
    defaultColor: '#FF9500',
    iconName: 'Sparkles',
    isTCG: true,
  },
  {
    id: 'mtg',
    label: 'Magic: The Gathering',
    group: 'Trading Card Games (TCG)',
    description: 'Reserved list staples, serialized cards, Commander decks, and foils',
    defaultColor: '#AF52DE',
    iconName: 'Flame',
    isTCG: true,
  },
  {
    id: 'onepiece',
    label: 'One Piece Card Game',
    group: 'Trading Card Games (TCG)',
    description: 'Manga rares, flagship winner cards, and OP booster boxes',
    defaultColor: '#FF3B30',
    iconName: 'Anchor',
    isTCG: true,
  },
  {
    id: 'yugioh',
    label: 'Yu-Gi-Oh! TCG',
    group: 'Trading Card Games (TCG)',
    description: 'Starlight rares, 1st Edition vintage, Quarter Century Secret rares',
    defaultColor: '#E5A00D',
    iconName: 'Sparkles',
    isTCG: true,
  },
  {
    id: 'lorcana',
    label: 'Disney Lorcana',
    group: 'Trading Card Games (TCG)',
    description: 'Enchanted rares, D23 promos, and Trove collector sets',
    defaultColor: '#007AFF',
    iconName: 'Sparkles',
    isTCG: true,
  },
  {
    id: 'sports_cards',
    label: 'Sports Cards (NBA/NFL/Soccer)',
    group: 'Trading Card Games (TCG)',
    description: 'Rookie patch autos (RPA), Prizm silvers, and graded sports cards',
    defaultColor: '#34C759',
    iconName: 'Layers',
    isTCG: true,
  },
  {
    id: 'tcg_general',
    label: 'General CCG & Trading Cards',
    group: 'Trading Card Games (TCG)',
    description: 'Digimon, Weiss Schwarz, Union Arena, Star Wars Unlimited, Cardfight',
    defaultColor: '#5856D6',
    iconName: 'Layers',
    isTCG: true,
  },

  // --- ACTION TOYS, MODELS & SPINNING TOPS ---
  {
    id: 'beyblade',
    label: 'Beyblade & Spinning Tops',
    group: 'Action Toys, Models & Spinning Tops',
    description: 'Takara Tomy X-Series (BX/UX), Burst, Metal Fight, CoroCoro rares',
    defaultColor: '#007AFF',
    iconName: 'RotateCw',
    isToy: true,
  },
  {
    id: 'gunpla',
    label: 'Gundam / Gunpla & Scale Kits',
    group: 'Action Toys, Models & Spinning Tops',
    description: 'Master Grade (MG), Perfect Grade (PG), P-Bandai limited kits',
    defaultColor: '#FF2D55',
    iconName: 'Box',
    isToy: true,
  },
  {
    id: 'action_figures',
    label: 'Action Figures & Statues',
    group: 'Action Toys, Models & Spinning Tops',
    description: 'S.H.Figuarts, Hot Toys, Figma, MAFEX, Prime 1 Studio statues',
    defaultColor: '#FF9500',
    iconName: 'Box',
    isToy: true,
  },
  {
    id: 'lego',
    label: 'LEGO & Brick Sets',
    group: 'Action Toys, Models & Spinning Tops',
    description: 'Retired UCS sets, Modular Buildings, minifigures, and sealed boxes',
    defaultColor: '#FFCC00',
    iconName: 'Box',
    isToy: true,
  },
  {
    id: 'diecast',
    label: 'Diecast & Model Cars',
    group: 'Action Toys, Models & Spinning Tops',
    description: 'Hot Wheels RLC, Super Treasure Hunts, Tomica Limited Vintage, 1:18 models',
    defaultColor: '#30B0C7',
    iconName: 'RotateCw',
    isToy: true,
  },
  {
    id: 'warhammer',
    label: 'Warhammer & Tabletop Miniatures',
    group: 'Action Toys, Models & Spinning Tops',
    description: 'Warhammer 40K armies, Age of Sigmar, painted display armies',
    defaultColor: '#64748B',
    iconName: 'Shield',
    isToy: true,
  },

  // --- VIDEO GAMES & HARDWARE ---
  {
    id: 'gaming',
    label: 'Retro & Modern Video Games',
    group: 'Video Games & Hardware',
    description: 'CIB retro cartridges, Limited Run Games, sealed special editions',
    defaultColor: '#34C759',
    iconName: 'Gamepad2',
  },
  {
    id: 'consoles',
    label: 'Gaming Consoles & Hardware',
    group: 'Video Games & Hardware',
    description: 'Limited edition consoles, handhelds, modded devices, CRT displays',
    defaultColor: '#30B0C7',
    iconName: 'Gamepad2',
  },

  // --- COMICS, MANGA & POP CULTURE ---
  {
    id: 'comics_manga',
    label: 'Comics, Manga & Art Books',
    group: 'Comics, Manga & Pop Culture',
    description: 'CGC graded key issues, First Appearances, Japanese first prints',
    defaultColor: '#AF52DE',
    iconName: 'Layers',
  },
  {
    id: 'anime_merch',
    label: 'Anime Goods & Collectibles',
    group: 'Comics, Manga & Pop Culture',
    description: 'Ichiban Kuji prize figures, shikishi boards, acrylic stands, plushies',
    defaultColor: '#FF2D55',
    iconName: 'Sparkles',
  },

  // --- LUXURY, TIMEPIECES & STREETWEAR ---
  {
    id: 'watches',
    label: 'Watches & Timepieces',
    group: 'Luxury, Timepieces & Streetwear',
    description: 'Luxury mechanical, vintage chronographs, G-Shock limited collabs',
    defaultColor: '#007AFF',
    iconName: 'Clock',
  },
  {
    id: 'sneakers',
    label: 'Sneakers & Streetwear',
    group: 'Luxury, Timepieces & Streetwear',
    description: 'Deadstock Nike SB, Jordan 1s, Supreme accessories, designer wear',
    defaultColor: '#FF3B30',
    iconName: 'Box',
  },
  {
    id: 'coins_bullion',
    label: 'Coins, Bullion & Currency',
    group: 'Art, Coins & Sports Memorabilia',
    description: 'NGC/PCGS certified silver eagles, historical coinage, gold bullion',
    defaultColor: '#FF9500',
    iconName: 'Sparkles',
  },

  // --- ART, MUSIC & MEMORABILIA ---
  {
    id: 'fine_art',
    label: 'Fine Art, Prints & Decks',
    group: 'Art, Coins & Sports Memorabilia',
    description: 'Signed screenprints, gallery originals, artist skateboard decks',
    defaultColor: '#AF52DE',
    iconName: 'Sparkles',
  },
  {
    id: 'vinyl_music',
    label: 'Vinyl Records & Music',
    group: 'Art, Coins & Sports Memorabilia',
    description: 'First pressings, audiophile box sets, color variants, test presses',
    defaultColor: '#5856D6',
    iconName: 'RotateCw',
  },

  // --- CUSTOM SANDBOX ---
  {
    id: 'custom',
    label: 'Custom Collectibles Sandbox',
    group: 'Custom Hobby Categories',
    description: 'Flexible sandbox for any custom collectibles and unique hobby collections',
    defaultColor: '#007AFF',
    iconName: 'Box',
    isCustom: true,
  },
];

const LOCAL_CUSTOM_CATEGORIES_KEY = 'collectorvault_custom_categories_v2';

export function getStoredCustomCategories(): CategoryTypeMeta[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomCategoryMeta(meta: CategoryTypeMeta): CategoryTypeMeta[] {
  try {
    const current = getStoredCustomCategories();
    const filtered = current.filter((c) => c.id !== meta.id);
    const updated = [...filtered, { ...meta, isCustom: true }];
    localStorage.setItem(LOCAL_CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getAllCategoryMetas(): CategoryTypeMeta[] {
  const custom = getStoredCustomCategories();
  const map = new Map<string, CategoryTypeMeta>();

  STANDARD_CATEGORY_METAS.forEach((c) => map.set(c.id, c));
  custom.forEach((c) => map.set(c.id, c));

  return Array.from(map.values());
}

export function getCategoryMeta(type: HobbyType | string): CategoryTypeMeta {
  if (!type) {
    return STANDARD_CATEGORY_METAS.find((c) => c.id === 'custom')!;
  }
  const all = getAllCategoryMetas();
  const match = all.find((c) => c.id.toLowerCase() === String(type).toLowerCase());
  if (match) return match;

  // Fallback for custom category strings
  const formattedLabel = String(type)
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    id: type,
    label: formattedLabel,
    group: 'Custom Hobby Categories',
    defaultColor: '#007AFF',
    iconName: 'Box',
    isCustom: true,
  };
}

export function isTcgCategory(type: HobbyType | string): boolean {
  const tcgKeys = ['pokemon', 'mtg', 'onepiece', 'yugioh', 'lorcana', 'sports_cards', 'tcg_general', 'card', 'tcg'];
  const lower = String(type).toLowerCase();
  return tcgKeys.some((k) => lower.includes(k));
}

export function isToyCategory(type: HobbyType | string): boolean {
  const toyKeys = ['beyblade', 'gunpla', 'action_figures', 'lego', 'diecast', 'warhammer', 'toy', 'figure', 'model'];
  const lower = String(type).toLowerCase();
  return toyKeys.some((k) => lower.includes(k));
}
