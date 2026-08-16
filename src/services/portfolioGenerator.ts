import { AssetItem, Sandbox } from '../types';
import { generateHistory, INITIAL_SANDBOXES } from '../data/initialData';

import cobaltDrakeImg from '../assets/images/cobalt_drake_bey_1786709634306.jpg';
import wizardRodImg from '../assets/images/wizard_rod_bey_1786709653445.jpg';
import phoenixWingImg from '../assets/images/phoenix_wing_bey_1786709673185.jpg';
import stormPegasisImg from '../assets/images/storm_pegasis_bey_1786709695276.jpg';
import pokemonEmeraldImg from '../assets/images/pokemon_emerald_gba_1786709713827.jpg';
import dranSwordImg from '../assets/images/dran_sword_bey_1786709747351.jpg';
import dranBusterImg from '../assets/images/dran_buster_bey_1786709763018.jpg';
import luffyMangaImg from '../assets/images/luffy_op05_manga_1786710252169.jpg';

interface CatalogTemplate {
  name: string;
  category: 'pokemon' | 'beyblade' | 'mtg' | 'onepiece' | 'gaming';
  sandboxId: string;
  imageUrl: string;
  basePriceUSD: number;
  tags: string[];
  marketSource: string;
  cardSpecs?: any;
  beybladeSpecs?: any;
  notes: string;
}

const MASTER_CATALOG_TEMPLATES: CatalogTemplate[] = [
  // POKEMON CARDS
  {
    name: 'Charizard ex #199/165 (Special Illustration Rare)',
    category: 'pokemon',
    sandboxId: 'sandbox-pokemon',
    imageUrl: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
    basePriceUSD: 368.80,
    tags: ['Scarlet & Violet 151', 'Charizard', 'SIR', 'Special Art'],
    marketSource: 'TCGPlayer Market Index (Live Official)',
    cardSpecs: {
      game: 'Pokemon',
      setName: 'Scarlet & Violet: 151',
      setNumber: '199/165',
      rarity: 'Special Illustration Rare',
      illustrator: 'miki kudo',
      releaseYear: 2023,
      isFoil: true,
    },
    notes: 'Scarlet & Violet 151 chase card in pristine condition',
  },
  {
    name: 'Umbreon VMAX #215/203 (Secret Alt Art - Moonbreon)',
    category: 'pokemon',
    sandboxId: 'sandbox-pokemon',
    imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    basePriceUSD: 2244.50,
    tags: ['Evolving Skies', 'Umbreon', 'Grail', 'Alt Art'],
    marketSource: 'TCGPlayer Market Index (Live Official)',
    cardSpecs: {
      game: 'Pokemon',
      setName: 'Sword & Shield: Evolving Skies',
      setNumber: '215/203',
      rarity: 'Secret Rare Alt Art',
      illustrator: 'KEIICHIRO ITO',
      releaseYear: 2021,
      isFoil: true,
    },
    notes: 'Modern Pokemon holy grail secret rare',
  },
  {
    name: 'Pikachu with Grey Felt Hat #085 (Van Gogh Museum Promo)',
    category: 'pokemon',
    sandboxId: 'sandbox-pokemon',
    imageUrl: 'https://images.pokemontcg.io/svp/85_hires.png',
    basePriceUSD: 1098.70,
    tags: ['Promo', 'Van Gogh Museum', 'Pikachu', 'Amsterdam'],
    marketSource: 'TCGPlayer Market Index (Live Official)',
    cardSpecs: {
      game: 'Pokemon',
      setName: 'SV Black Star Promos',
      setNumber: '085',
      rarity: 'Museum Exclusive Promo',
      illustrator: 'Naoyo Kimura',
      releaseYear: 2023,
      isFoil: true,
    },
    notes: 'Amsterdam Van Gogh museum collaboration promo',
  },
  {
    name: 'Gengar VMAX #271/264 (Fusion Strike Alt Art)',
    category: 'pokemon',
    sandboxId: 'sandbox-pokemon',
    imageUrl: 'https://images.pokemontcg.io/swsh8/271_hires.png',
    basePriceUSD: 420.00,
    tags: ['Fusion Strike', 'Gengar', 'Alt Art', 'Secret Rare'],
    marketSource: 'TCGPlayer Live Market Data',
    cardSpecs: {
      game: 'Pokemon',
      setName: 'Sword & Shield: Fusion Strike',
      setNumber: '271/264',
      rarity: 'Secret Rare Alt Art',
      illustrator: 'sowsow',
      releaseYear: 2021,
      isFoil: true,
    },
    notes: 'Gengar eating buildings alternate illustration',
  },
  {
    name: 'Giratina V #186/196 (Lost Origin Alternate Art)',
    category: 'pokemon',
    sandboxId: 'sandbox-pokemon',
    imageUrl: 'https://images.pokemontcg.io/swsh11/186_hires.png',
    basePriceUSD: 824.39,
    tags: ['Lost Origin', 'Giratina', 'Alt Art', 'Abyss'],
    marketSource: 'TCGdex Official API',
    cardSpecs: {
      game: 'Pokemon',
      setName: 'Sword & Shield: Lost Origin',
      setNumber: '186/196',
      rarity: 'Alternate Art Ultra Rare',
      illustrator: 'Shinji Kanda',
      releaseYear: 2022,
      isFoil: true,
    },
    notes: 'Shinji Kanda masterpiece artwork',
  },
  {
    name: 'Charizard Base Set Unlimited #4/102 (Holo)',
    category: 'pokemon',
    sandboxId: 'sandbox-pokemon',
    imageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    basePriceUSD: 350.00,
    tags: ['Base Set', 'Vintage 1999', 'Charizard', 'Holo Rare'],
    marketSource: 'TCGPlayer Vintage Market Index',
    cardSpecs: {
      game: 'Pokemon',
      setName: 'Base Set',
      setNumber: '4/102',
      rarity: 'Holo Rare',
      illustrator: 'Mitsuhiro Arita',
      releaseYear: 1999,
      isFoil: true,
    },
    notes: 'Vintage classic holo Charizard',
  },

  // BEYBLADES
  {
    name: 'Cobalt Drake 4-60F (CoroCoro Rare Bey Get Limited BX-00)',
    category: 'beyblade',
    sandboxId: 'sandbox-beyblade',
    imageUrl: cobaltDrakeImg,
    basePriceUSD: 285.00,
    tags: ['Beyblade X', 'Rare Bey Get', 'Cobalt Drake', 'Limited'],
    marketSource: 'Takara Tomy Official & Tokyo Index',
    beybladeSpecs: {
      generation: 'Beyblade X',
      system: 'BX (Basic Line)',
      type: 'Attack',
      spinDirection: 'Right',
      blade: 'Cobalt Drake',
      ratchet: '4-60',
      bit: 'Flat (F)',
      weightGrams: 51.8,
      code: 'BX-00',
      brand: 'Takara Tomy',
    },
    notes: 'App battle reward prize beyblade',
  },
  {
    name: 'Wizard Rod 5-70DB (UX-03 Booster Stamina)',
    category: 'beyblade',
    sandboxId: 'sandbox-beyblade',
    imageUrl: wizardRodImg,
    basePriceUSD: 34.00,
    tags: ['Beyblade X', 'Unique Line', 'Stamina King', 'Tournament Tier S'],
    marketSource: 'Takara Tomy Official & Amazon JP Live',
    beybladeSpecs: {
      generation: 'Beyblade X',
      system: 'UX (Unique Line)',
      type: 'Stamina',
      spinDirection: 'Right',
      blade: 'Wizard Rod',
      ratchet: '5-70',
      bit: 'Disc Ball (DB)',
      weightGrams: 47.4,
      code: 'UX-03',
      brand: 'Takara Tomy',
    },
    notes: 'Dominant competitive stamina combo',
  },
  {
    name: 'Phoenix Wing 9-60GF (BX-23 Starter w/ Launcher)',
    category: 'beyblade',
    sandboxId: 'sandbox-beyblade',
    imageUrl: phoenixWingImg,
    basePriceUSD: 42.00,
    tags: ['Beyblade X', 'Starter', 'Red Metal Coat', 'Phoenix Wing'],
    marketSource: 'Takara Tomy Official Specs',
    beybladeSpecs: {
      generation: 'Beyblade X',
      system: 'BX (Basic Line)',
      type: 'Attack',
      spinDirection: 'Right',
      blade: 'Phoenix Wing (Painted Heavy Metal)',
      ratchet: '9-60',
      bit: 'Gear Flat (GF)',
      weightGrams: 52.3,
      code: 'BX-23',
      brand: 'Takara Tomy',
    },
    notes: 'Heavyweight painted metal attack blade',
  },
  {
    name: 'Storm Pegasis 105RF (Metal Fight First Edition BB-28)',
    category: 'beyblade',
    sandboxId: 'sandbox-beyblade',
    imageUrl: stormPegasisImg,
    basePriceUSD: 145.00,
    tags: ['Metal Fight', 'MFB', 'Pegasus', 'Vintage 2009'],
    marketSource: 'Takara Tomy & Buyee Japan Index',
    beybladeSpecs: {
      generation: 'Metal Fight',
      system: 'Hybrid Wheel System (HWS)',
      type: 'Attack',
      spinDirection: 'Right',
      blade: 'Storm Wheel & Pegasis Clear Wheel',
      ratchet: '105 Track',
      bit: 'Rubber Flat (RF)',
      weightGrams: 37.8,
      code: 'BB-28',
      brand: 'Takara Tomy',
    },
    notes: 'First generation Metal Fight classic',
  },
  {
    name: 'Dran Sword 3-60F (BX-01 Starter Blade)',
    category: 'beyblade',
    sandboxId: 'sandbox-beyblade',
    imageUrl: dranSwordImg,
    basePriceUSD: 24.00,
    tags: ['Beyblade X', 'BX-01', 'Attack', 'X-Dash'],
    marketSource: 'Takara Tomy Live Data',
    beybladeSpecs: {
      generation: 'Beyblade X',
      system: 'BX (Basic Line)',
      type: 'Attack',
      spinDirection: 'Right',
      blade: 'Dran Sword',
      ratchet: '3-60',
      bit: 'Flat (F)',
      weightGrams: 44.5,
      code: 'BX-01',
      brand: 'Takara Tomy',
    },
    notes: 'Flagship Beyblade X starter',
  },
  {
    name: 'Dran Buster 1-60A (UX-01 Unique Line Accel)',
    category: 'beyblade',
    sandboxId: 'sandbox-beyblade',
    imageUrl: dranBusterImg,
    basePriceUSD: 36.00,
    tags: ['Beyblade X', 'UX-01', 'Unique Line', 'Heavy Metal'],
    marketSource: 'Takara Tomy Specs',
    beybladeSpecs: {
      generation: 'Beyblade X',
      system: 'UX (Unique Line)',
      type: 'Attack',
      spinDirection: 'Right',
      blade: 'Dran Buster',
      ratchet: '1-60',
      bit: 'Accel (A)',
      weightGrams: 48.2,
      code: 'UX-01',
      brand: 'Takara Tomy',
    },
    notes: 'Unbalanced one-hit smash attack design',
  },

  // ONE PIECE CARD GAME
  {
    name: 'Monkey.D.Luffy #OP05-119 (Manga Super Parallel)',
    category: 'onepiece',
    sandboxId: 'sandbox-onepiece',
    imageUrl: luffyMangaImg,
    basePriceUSD: 1850.00,
    tags: ['Awakening of the New Era', 'Manga Rare', 'Gear 5', 'OP-05'],
    marketSource: 'TCGPlayer / SNKRDUNK Live',
    cardSpecs: {
      game: 'One Piece',
      setName: 'OP-05 Awakening of the New Era',
      setNumber: 'OP05-119',
      rarity: 'Secret Rare (Manga Parallel)',
      illustrator: 'Eiichiro Oda Manga Panel',
      releaseYear: 2023,
      isFoil: true,
    },
    notes: 'Gear 5 manga illustration background grail',
  },

  // MAGIC: THE GATHERING
  {
    name: 'Ragavan, Nimble Pilferer',
    category: 'mtg',
    sandboxId: 'sandbox-mtg',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/9/a9738cda-adb1-47fb-9f4c-ecd930228c4d.jpg',
    basePriceUSD: 42.44,
    tags: ['Modern Horizons 2', 'Monkey', 'Modern Staple', 'Mythic'],
    marketSource: 'Scryfall TCG Live API (Official)',
    cardSpecs: {
      game: 'Magic: The Gathering',
      setName: 'Modern Horizons 2',
      setNumber: '138',
      rarity: 'Mythic',
      illustrator: 'Simon Dominic',
      releaseYear: 2021,
      isFoil: false,
    },
    notes: 'Modern format powerhouse staple',
  },
  {
    name: 'The One Ring #246 (Foil)',
    category: 'mtg',
    sandboxId: 'sandbox-mtg',
    imageUrl: 'https://cards.scryfall.io/normal/front/d/5/d5806e68-1054-458e-866d-1f2470f682b2.jpg',
    basePriceUSD: 106.24,
    tags: ['Lord of the Rings', 'LTR', 'Mythic', 'Artifact'],
    marketSource: 'Scryfall TCG Live API (Official)',
    cardSpecs: {
      game: 'Magic: The Gathering',
      setName: 'The Lord of the Rings: Tales of Middle-earth',
      setNumber: '246',
      rarity: 'Mythic',
      illustrator: 'Tanya Sanchez-Gomez',
      releaseYear: 2023,
      isFoil: true,
    },
    notes: 'Tales of Middle-earth centerpiece',
  },
  {
    name: 'Black Lotus (Unlimited Edition)',
    category: 'mtg',
    sandboxId: 'sandbox-mtg',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
    basePriceUSD: 14500.00,
    tags: ['Power Nine', 'Reserved List', 'Vintage Grail'],
    marketSource: 'Scryfall TCG Live & Vintage Comps',
    cardSpecs: {
      game: 'Magic: The Gathering',
      setName: 'Unlimited Edition',
      setNumber: '232',
      rarity: 'Rare',
      illustrator: 'Christopher Rush',
      releaseYear: 1993,
      isFoil: false,
    },
    notes: 'Power Nine reserved list collectible artifact',
  },

  // RETRO GAMING
  {
    name: 'Pokémon Emerald Version (GBA - Complete In Box CIB)',
    category: 'gaming',
    sandboxId: 'sandbox-gaming',
    imageUrl: pokemonEmeraldImg,
    basePriceUSD: 360.00,
    tags: ['GBA', 'Nintendo', 'Rayquaza', 'CIB Complete'],
    marketSource: 'PriceCharting Video Game Index',
    notes: 'Original Game Boy Advance box with mint manual & inserts',
  },
];

const CONDITIONS = ['PSA_10', 'PSA_9', 'RAW_NM', 'CGC_10', 'BGS_9.5', 'NIB', 'MINT_IN_BOX'] as const;

/**
 * Generates a rich, authentic randomized portfolio with valid cards, Beyblades, and collectables
 * for any newly authenticated user.
 */
export function generateStarterPortfolioForUser(userId: string, _userDisplayName?: string | null): AssetItem[] {
  // Shuffle available catalog templates
  const shuffled = [...MASTER_CATALOG_TEMPLATES].sort(() => Math.random() - 0.5);

  // Guarantee diverse mix: at least 1-2 Pokemon, 1-2 Beyblades, 1 MTG, 1 One Piece or Game
  const selectedTemplates: CatalogTemplate[] = [];

  const pokemonList = shuffled.filter((t) => t.category === 'pokemon');
  const beybladeList = shuffled.filter((t) => t.category === 'beyblade');
  const mtgList = shuffled.filter((t) => t.category === 'mtg');
  const onePieceList = shuffled.filter((t) => t.category === 'onepiece');
  const gamingList = shuffled.filter((t) => t.category === 'gaming');

  // Pick 2 Pokemon
  if (pokemonList[0]) selectedTemplates.push(pokemonList[0]);
  if (pokemonList[1]) selectedTemplates.push(pokemonList[1]);

  // Pick 2 Beyblades
  if (beybladeList[0]) selectedTemplates.push(beybladeList[0]);
  if (beybladeList[1]) selectedTemplates.push(beybladeList[1]);

  // Pick 1 MTG
  if (mtgList[0]) selectedTemplates.push(mtgList[0]);

  // Pick 1 One Piece or Retro Game
  if (onePieceList[0] && Math.random() > 0.4) {
    selectedTemplates.push(onePieceList[0]);
  } else if (gamingList[0]) {
    selectedTemplates.push(gamingList[0]);
  }

  // Generate randomized item records scoped to userId
  const now = Date.now();
  const items: AssetItem[] = selectedTemplates.map((template, idx) => {
    // Randomize slight price variance (+/- 8%)
    const priceVariance = 0.94 + Math.random() * 0.12;
    const currentPrice = Number((template.basePriceUSD * priceVariance).toFixed(2));

    // Purchase price usually 65% - 90% of current valuation
    const purchaseRatio = 0.65 + Math.random() * 0.25;
    const purchasePrice = Number((currentPrice * purchaseRatio).toFixed(2));

    // Random purchase date within past 40 to 365 days
    const daysAgo = Math.floor(40 + Math.random() * 320);
    const purchaseDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Pick condition
    let condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
    if (template.category === 'beyblade') {
      condition = Math.random() > 0.5 ? 'NIB' : 'MINT_IN_BOX';
    } else if (template.category === 'gaming') {
      condition = 'RAW_NM';
    }

    const cardSpecsWithGrade = template.cardSpecs
      ? {
          ...template.cardSpecs,
          gradingCompany: condition.startsWith('PSA') ? 'PSA' : condition.startsWith('CGC') ? 'CGC' : condition.startsWith('BGS') ? 'BGS' : 'None',
          gradeValue: condition.includes('10') ? '10' : condition.includes('9.5') ? '9.5' : condition.includes('9') ? '9' : undefined,
          certNumber: `${Math.floor(10000000 + Math.random() * 89999999)}`,
        }
      : undefined;

    const itemId = `item-${userId}-${template.category}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`;

    // Generate logical physical storage location
    let storageLocation: any = {
      metaStorage: 'Master Fireproof Safe (Office)',
      container: 'VaultX 9-Pocket Zip Binder',
      slot: `Page ${idx + 1}, Slot 1`,
      notes: 'Collector sleeve protected',
    };

    if (condition.startsWith('PSA') || condition.startsWith('BGS') || condition.startsWith('CGC')) {
      storageLocation = {
        metaStorage: 'Master Fireproof Safe (Office)',
        container: 'Pelican 1500 Slab Case',
        slot: `Row 1, Slab #${idx + 1}`,
        notes: `${condition.replace('_', ' ')} slab sleeve protected`,
      };
    } else if (template.category === 'beyblade') {
      storageLocation = {
        metaStorage: 'Display Cabinet (Living Room)',
        container: 'Acrylic Display Showcase Tier 1',
        slot: `Pedestal #${idx + 1}`,
        notes: 'Original Japanese packaging',
      };
    } else if (template.category === 'gaming') {
      storageLocation = {
        metaStorage: 'Display Cabinet (Living Room)',
        container: 'Boxed Game Acrylic Stand',
        slot: 'Shelf 3 Center',
        notes: 'Box protector enclosed',
      };
    }

    return {
      id: itemId,
      sandboxId: template.sandboxId,
      name: template.name,
      category: template.category,
      imageUrl: template.imageUrl,
      currentPriceUSD: currentPrice,
      previousPriceUSD_24h: Number((currentPrice * (0.98 + Math.random() * 0.03)).toFixed(2)),
      previousPriceUSD_7d: Number((currentPrice * (0.94 + Math.random() * 0.08)).toFixed(2)),
      previousPriceUSD_30d: Number((currentPrice * (0.88 + Math.random() * 0.14)).toFixed(2)),
      purchasePriceUSD: purchasePrice,
      purchaseDate,
      quantity: template.category === 'mtg' && currentPrice < 60 ? 4 : (Math.random() > 0.8 ? 2 : 1),
      condition,
      notes: template.notes,
      tags: [...template.tags, condition],
      priceHistory: generateHistory(currentPrice, Math.random() > 0.3 ? 'bullish' : 'dip_rebound', 0.65, 365),
      cardSpecs: cardSpecsWithGrade,
      beybladeSpecs: template.beybladeSpecs,
      storageLocation,
      transactions: [
        {
          id: `tx-${itemId}-1`,
          type: 'BUY',
          date: purchaseDate,
          quantity: template.category === 'mtg' && currentPrice < 60 ? 4 : 1,
          pricePerUnitUSD: purchasePrice,
          notes: `Initial acquired portfolio asset - ${template.name}`,
        },
      ],
      lastUpdated: new Date().toISOString(),
      isFavorite: idx === 0 || idx === 1,
      marketSource: template.marketSource,
      userId,
    };
  });

  return items;
}

export const generateRandomizedPortfolioForUser = generateStarterPortfolioForUser;
