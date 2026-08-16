export type HobbyType = 'pokemon' | 'beyblade' | 'tcg_general' | 'yugioh' | 'mtg' | 'onepiece' | 'gaming' | 'custom';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rateToUSD: number; // 1 USD = X Currency
  label: string;
}

export type ItemCondition = 'RAW_NM' | 'RAW_LP' | 'RAW_MP' | 'RAW_HP' | 'PSA_10' | 'PSA_9' | 'PSA_8' | 'BGS_10' | 'BGS_9.5' | 'CGC_10' | 'NIB' | 'MINT_IN_BOX' | 'USED';

export interface PriceHistoryPoint {
  date: string; // YYYY-MM-DD
  priceUSD: number;
  volume?: number;
}

export interface BeybladeSpecs {
  generation: 'Beyblade X' | 'Burst' | 'Metal Fight' | 'Original / Plastics' | 'Other';
  system?: string; // e.g., UX, BX, Dynamite Battle, Superking, 4D
  type: 'Attack' | 'Defense' | 'Stamina' | 'Balance';
  spinDirection: 'Right' | 'Left' | 'Dual';
  blade?: string;
  ratchet?: string; // e.g. 3-60, 4-60, 5-70, 9-60
  bit?: string; // e.g. Flat, Ball, Needle, Gear Point, Hexa
  weightGrams?: number;
  code?: string; // e.g. BX-01, UX-02, BX-00
  brand: 'Takara Tomy' | 'Hasbro' | 'Sonokong' | 'Other';
}

export interface CardSpecs {
  game: 'Pokemon' | 'Magic: The Gathering' | 'Yu-Gi-Oh!' | 'One Piece' | 'Other TCG';
  setName: string;
  setNumber?: string;
  rarity?: string;
  illustrator?: string;
  cardNumber?: string;
  releaseYear?: number;
  isFoil?: boolean;
  isFirstEdition?: boolean;
  gradingCompany?: 'PSA' | 'BGS' | 'CGC' | 'None';
  gradeValue?: string;
  certNumber?: string;
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  date: string;
  quantity: number;
  pricePerUnitUSD: number;
  notes?: string;
}

export interface StorageLocation {
  metaStorage: string; // Top-level location/vault/furniture (e.g. "Fireproof Home Safe", "Display Cabinet A", "Bank Safe Deposit Box", "Office Shelf 2")
  container: string;   // Specific storage container/binder/box (e.g. "VaultX 12-Pocket Binder", "Pelican 1500 Slab Case", "BCW Monster Box", "Deck Box")
  slot?: string;       // Exact position/slot/page (e.g. "Page 4, Top-Right", "Slot #08", "Shelf 1 Center")
  notes?: string;
}

export type StorageUnitType = 'safe' | 'binder' | 'slab_case' | 'box' | 'display' | 'shelf' | 'deposit_box' | 'drawer' | 'other';

export interface StorageUnit {
  id: string;
  metaStorage: string; // e.g. "Master Fireproof Safe (Office)"
  container: string;   // e.g. "Pelican 1500 Slab Case"
  type?: StorageUnitType;
  notes?: string;
  capacity?: number;
  createdAt?: string;
  userId?: string;
  isStarred?: boolean;
}

export interface AssetItem {
  id: string;
  sandboxId: string;
  name: string;
  category: HobbyType;
  imageUrl: string;
  currentPriceUSD: number;
  previousPriceUSD_24h?: number;
  previousPriceUSD_7d?: number;
  previousPriceUSD_30d?: number;
  purchasePriceUSD: number;
  purchaseDate: string;
  quantity: number;
  condition: ItemCondition;
  notes?: string;
  tags: string[];
  priceHistory: PriceHistoryPoint[];
  beybladeSpecs?: BeybladeSpecs;
  cardSpecs?: CardSpecs;
  transactions: Transaction[];
  storageLocation?: StorageLocation;
  lastUpdated: string;
  isFavorite?: boolean;
  marketSource?: string; // e.g. 'TCGPlayer / PriceCharting / Takara Tomy Live'
  userId?: string;
}

export interface Sandbox {
  id: string;
  name: string;
  type: HobbyType;
  description: string;
  iconName: string;
  themeColor: string; // e.g. '#FF3B30', '#007AFF', '#FF9500', '#AF52DE', '#34C759'
  createdAt: string;
  customFields?: { key: string; label: string; type: 'text' | 'number' | 'select' }[];
  userId?: string;
}

export type TimeRange = '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: 'google.com' | 'password';
  primaryProvider?: 'google.com' | 'password';
  linkedProviders?: ('google.com' | 'password')[];
  createdAt?: string;
  lastLoginAt?: string;
}
