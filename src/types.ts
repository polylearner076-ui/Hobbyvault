export type StandardHobbyType =
  | 'pokemon'
  | 'beyblade'
  | 'mtg'
  | 'onepiece'
  | 'yugioh'
  | 'lorcana'
  | 'sports_cards'
  | 'tcg_general'
  | 'gunpla'
  | 'action_figures'
  | 'lego'
  | 'diecast'
  | 'warhammer'
  | 'gaming'
  | 'consoles'
  | 'comics_manga'
  | 'anime_merch'
  | 'watches'
  | 'sneakers'
  | 'coins_bullion'
  | 'fine_art'
  | 'vinyl_music'
  | 'custom';

export type HobbyType = StandardHobbyType | string;

export interface CategoryGroup {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export interface CategoryTypeMeta {
  id: HobbyType;
  label: string;
  group: string; // e.g. 'Trading Card Games (TCG)', 'Toys, Models & Spinning Tops', 'Gaming & Electronics', 'Luxury & Fashion', 'Comics & Entertainment', 'Art & Memorabilia', 'Custom Hobby'
  description?: string;
  defaultColor: string;
  iconName: string;
  isCustom?: boolean;
  isTCG?: boolean;
  isToy?: boolean;
}

export interface AgentFilter {
  id: string;
  query: string;
  title: string;
  matchedItemIds: string[];
  matchedCount: number;
  totalValueUSD: number;
  active: boolean;
}

export interface AgentMetricBreakdown {
  totalValueUSD: number;
  totalCostUSD: number;
  totalGainUSD: number;
  gainPercent: number;
  itemCount: number;
  copyCount: number;
  topAssets: Array<{
    id: string;
    name: string;
    category: string;
    valueUSD: number;
    purchasePriceUSD?: number;
    gainUSD?: number;
    locationStr: string;
    condition: string;
    imageUrl?: string;
  }>;
  categoryBreakdown: Array<{
    category: string;
    label: string;
    valueUSD: number;
    count: number;
    percentage: number;
  }>;
  storageBreakdown: Array<{
    location: string;
    container: string;
    valueUSD: number;
    count: number;
    percentage: number;
  }>;
}

export interface AgentQueryResult {
  answer: string;
  directAnswerSummary: string;
  aggregatedMetrics: AgentMetricBreakdown;
  matchedItemIds: string[];
  matchedStorageLocations: Array<{ metaStorage: string; container?: string }>;
  reasoningSteps: string[];
  suggestedAction?: {
    type: 'FILTER_PORTFOLIO' | 'VIEW_STORAGE' | 'HIGHLIGHT_ASSETS' | 'NONE';
    label: string;
    payload?: any;
  };
  filterCriteria?: {
    includedCategories?: string[];
    excludedCategories?: string[];
    includedTags?: string[];
    conditionGrades?: string[];
    storageLocations?: string[];
    minPriceUSD?: number;
    maxPriceUSD?: number;
  };
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rateToUSD: number; // 1 USD = X Currency
  label: string;
}

export type ItemCondition =
  | 'RAW_NM' // Near Mint / Mint
  | 'RAW_LP' // Lightly Played / Well Condition
  | 'RAW_MP' // Moderately Played
  | 'RAW_HP' // Heavily Played / Poor Condition / Damaged
  | 'RAW_DMG' // Damaged
  | 'PSA_10'
  | 'PSA_10_GEM_MINT'
  | 'PSA_9'
  | 'PSA_9_MINT'
  | 'PSA_8'
  | 'BGS_10'
  | 'BGS_10_PRISTINE'
  | 'BGS_9.5'
  | 'BGS_9_5'
  | 'CGC_10'
  | 'CGC_10_PRISTINE'
  | 'NIB' // New In Box / Factory Sealed
  | 'MINT_IN_BOX'
  | 'USED' // Used / Battle-tested
  | 'USED_COMPLETE';

export type FragilityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AssetCopy {
  id: string;
  condition: ItemCondition;
  customConditionLabel?: string; // e.g. "Flawless", "Well Condition", "Poor Condition", "Heavy Crease"
  gradeCompany?: 'PSA' | 'BGS' | 'CGC' | 'None';
  gradeValue?: string;
  certNumber?: string;
  purchasePriceUSD?: number;
  purchaseDate?: string;
  currentValueUSD?: number; // Condition adjusted value
  storageLocation?: StorageLocation;
  serialNumber?: string;
  notes?: string;
  isFavorite?: boolean;
  weightGrams?: number; // Physical weight in grams
  fragility?: FragilityLevel; // Fragility sensitivity rating
  fragilityNotes?: string;
}

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
  tareWeightGrams?: number; // Empty container weight in grams
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
  copies?: AssetCopy[];
  notes?: string;
  tags: string[];
  priceHistory: PriceHistoryPoint[];
  beybladeSpecs?: BeybladeSpecs;
  cardSpecs?: CardSpecs;
  transactions: Transaction[];
  storageLocation?: StorageLocation;
  weightGrams?: number; // Physical weight in grams (e.g. 1.8g raw card, 55g PSA slab, 45g Beyblade, 750g box)
  fragility?: FragilityLevel; // Preservation fragility rating (LOW, MEDIUM, HIGH, CRITICAL)
  fragilityNotes?: string;
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
  isAgentResult?: boolean;
  agentQuery?: string;
  agentResult?: AgentQueryResult;
}

export interface AgentBackgroundTask {
  id: string;
  prompt: string;
  model: string;
  status: 'running' | 'completed' | 'error';
  startTime: number;
  result?: AgentQueryResult;
  error?: string;
  createdSandboxId?: string;
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
