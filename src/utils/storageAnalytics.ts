import { AssetItem, FragilityLevel, StorageUnit, HobbyType } from '../types';

export interface ContainerStat {
  containerName: string;
  metaStorage: string;
  unitConfig?: StorageUnit;
  itemCount: number;
  totalQuantity: number;
  totalValueUSD: number;
  totalCostUSD: number;
  unrealizedGainUSD: number;
  items: AssetItem[];
  
  // Weight Metrics
  itemsWeightGrams: number;
  tareWeightGrams: number;
  totalWeightGrams: number;
  weightFormatted: {
    grams: string;
    kg: string;
    lbs: string;
    display: string;
  };
  
  // Fragility Metrics
  fragilityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  fragilityScore: number; // 0 (Indestructible) - 100 (Extremely Fragile)
  fragilityLabel: 'Low Risk / Durable' | 'Moderate Sensitivity' | 'High Fragility' | 'Critical Care Required';
  fragilityColor: string;
  fragileItemNames: string[];
  
  // Asset Type / Category Distribution
  categoryDistribution: {
    category: HobbyType | string;
    count: number;
    valueUSD: number;
    percentage: number;
    color: string;
  }[];

  // Centerpiece Asset
  topValuedItem?: AssetItem;
  
  // Rank relative to all containers
  valueRank?: number;
  valueSharePercentage?: number;
}

export interface VaultStorageSummary {
  totalContainers: number;
  totalLocations: number;
  totalAssignedItems: number;
  totalAssignedValueUSD: number;
  totalVaultWeightGrams: number;
  totalVaultWeightFormatted: {
    kg: string;
    lbs: string;
    display: string;
  };
  overallFragilityScore: number;
  overallFragilityLabel: string;
  overallFragilityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  rankedContainers: ContainerStat[];
  overallCategoryDistribution: {
    category: string;
    count: number;
    valueUSD: number;
    percentage: number;
    color: string;
  }[];
  unassignedItemsCount: number;
  unassignedItemsValueUSD: number;
  preservationAlerts: {
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    containerName?: string;
  }[];
}

/**
 * Standard container empty tare weights (in grams) based on container type/name
 */
export const DEFAULT_CONTAINER_TARE_WEIGHTS: Record<string, number> = {
  slab_case: 2100,   // Pelican 1500 or hard case ~2.1 kg
  binder: 480,       // VaultX 9/12 pocket padded zip binder ~480g
  display: 250,      // Acrylic display showcase ~250g
  deposit_box: 1400, // Bank steel safety box ~1.4 kg
  box: 350,          // BCW monster box or cardboard bin ~350g
  safe: 4500,        // Heavy mini safe unit ~4.5 kg
  shelf: 100,        // Shelf slot placeholder
  drawer: 500,
  other: 200,
};

/**
 * Resolves standard realistic physical weight for any asset in grams
 */
export function getAssetWeightGrams(item: AssetItem): number {
  if (typeof item.weightGrams === 'number' && item.weightGrams > 0) {
    return item.weightGrams;
  }

  // Beyblade specs check
  if (item.beybladeSpecs?.weightGrams && item.beybladeSpecs.weightGrams > 0) {
    return item.beybladeSpecs.weightGrams;
  }

  // Graded slab check
  const isGraded = item.condition?.startsWith('PSA') || 
                   item.condition?.startsWith('BGS') || 
                   item.condition?.startsWith('CGC') || 
                   (item.cardSpecs?.gradingCompany && item.cardSpecs.gradingCompany !== 'None');

  if (isGraded) {
    if (item.condition?.startsWith('BGS') || item.cardSpecs?.gradingCompany === 'BGS') {
      return 62; // BGS thick heavy slab
    }
    return 54; // PSA / CGC standard slab
  }

  // Category based standard fallback
  switch (item.category) {
    case 'pokemon':
    case 'mtg':
    case 'onepiece':
    case 'yugioh':
    case 'lorcana':
    case 'sports_cards':
      if (item.name?.toLowerCase().includes('box') || item.name?.toLowerCase().includes('booster')) {
        return 740; // Sealed booster box
      }
      return 1.8; // Raw trading card in penny sleeve

    case 'beyblade':
      if (item.name?.toLowerCase().includes('starter') || item.name?.toLowerCase().includes('launcher')) {
        return 95; // Starter pack with string launcher
      }
      return 45; // Average Beyblade blade + ratchet + bit

    case 'gaming':
    case 'consoles':
      if (item.name?.toLowerCase().includes('console') || item.name?.toLowerCase().includes('system')) {
        return 1200;
      }
      return 160; // GBA/DS/Game cartridge CIB complete in box

    case 'watches':
      return 155; // Luxury timepiece

    case 'sneakers':
      return 950; // Pair of sneakers with box

    case 'lego':
      return 1400; // LEGO collector set

    case 'diecast':
      return 110; // 1:64 diecast car

    case 'action_figures':
      return 280;

    case 'coins_bullion':
      return 31.1; // 1 troy oz coin in capsule

    case 'fine_art':
      return 1800;

    case 'vinyl_music':
      return 230; // 12-inch vinyl LP

    default:
      return 50;
  }
}

/**
 * Resolves standard preservation fragility level for any asset
 */
export function getAssetFragility(item: AssetItem): FragilityLevel {
  if (item.fragility) {
    return item.fragility;
  }

  const isGraded = item.condition?.startsWith('PSA') || 
                   item.condition?.startsWith('BGS') || 
                   item.condition?.startsWith('CGC') || 
                   (item.cardSpecs?.gradingCompany && item.cardSpecs.gradingCompany !== 'None');

  // Hard encapsulated acrylic slabs provide high impact & moisture protection
  if (isGraded) {
    return 'LOW';
  }

  // Raw cards / vintage foils / holy grails are delicate
  if (['pokemon', 'mtg', 'onepiece', 'yugioh', 'lorcana', 'sports_cards'].includes(item.category)) {
    if (item.currentPriceUSD > 1000 || item.condition === 'RAW_NM') {
      return 'HIGH';
    }
    return 'MEDIUM';
  }

  // Beyblades are durable metal/plastic battle tops
  if (item.category === 'beyblade') {
    if (item.condition === 'NIB' || item.condition === 'MINT_IN_BOX') {
      return 'MEDIUM'; // Box packaging can crease
    }
    return 'LOW'; // Metal fight / X blades are physically durable
  }

  // Sealed vintage games or fine art
  if (item.category === 'fine_art' || item.name?.toLowerCase().includes('glass')) {
    return 'CRITICAL';
  }

  if (item.category === 'gaming' || item.category === 'comics_manga') {
    return 'HIGH';
  }

  return 'MEDIUM';
}

/**
 * Format weight from grams to human readable formats
 */
export function formatWeight(grams: number): {
  grams: string;
  kg: string;
  lbs: string;
  display: string;
} {
  const kgVal = grams / 1000;
  const lbsVal = grams * 0.00220462;

  let display = '';
  if (grams < 1000) {
    display = `${Math.round(grams)} g`;
  } else {
    display = `${kgVal.toFixed(2)} kg (${lbsVal.toFixed(1)} lbs)`;
  }

  return {
    grams: `${Math.round(grams)} g`,
    kg: `${kgVal.toFixed(2)} kg`,
    lbs: `${lbsVal.toFixed(2)} lbs`,
    display,
  };
}

/**
 * Category brand color mapping
 */
export const CATEGORY_COLORS: Record<string, string> = {
  pokemon: '#FF9500',      // Amber
  beyblade: '#007AFF',     // Blue
  mtg: '#AF52DE',          // Purple
  onepiece: '#FF3B30',     // Crimson
  gaming: '#34C759',       // Green
  consoles: '#30B0C7',     // Teal
  watches: '#5856D6',      // Indigo
  sneakers: '#FF2D55',     // Pink
  lego: '#FFCC00',         // Yellow
  diecast: '#FF9500',      // Orange
  action_figures: '#5AC8FA',// Sky
  yugioh: '#D04070',       // Magenta
  lorcana: '#5856D6',      // Violet
  sports_cards: '#007AFF', // Blue
  comics_manga: '#FF3B30', // Red
  coins_bullion: '#D4AF37',// Gold
  fine_art: '#8E8E93',     // Silver
  other: '#636366',
};

/**
 * Calculates complete storage container analytics and dashboard stats
 */
export function calculateContainerStats(
  containerName: string,
  metaStorage: string,
  items: AssetItem[],
  storageUnits: StorageUnit[] = []
): ContainerStat {
  const unitConfig = storageUnits.find(
    (u) => u.container.trim() === containerName.trim() && u.metaStorage.trim() === metaStorage.trim()
  );

  let totalValueUSD = 0;
  let totalCostUSD = 0;
  let totalQuantity = 0;
  let itemsWeightGrams = 0;

  const fragilityBreakdown = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  const fragileItemNames: string[] = [];
  const categoryMap = new Map<string, { count: number; valueUSD: number }>();

  items.forEach((item) => {
    const qty = item.quantity || 1;
    const itemVal = (item.currentPriceUSD || 0) * qty;
    const itemCost = (item.purchasePriceUSD || 0) * qty;
    const singleWeight = getAssetWeightGrams(item);
    const itemWeight = singleWeight * qty;
    const fragility = getAssetFragility(item);

    totalValueUSD += itemVal;
    totalCostUSD += itemCost;
    totalQuantity += qty;
    itemsWeightGrams += itemWeight;

    // Fragility tally
    if (fragility === 'CRITICAL') {
      fragilityBreakdown.critical += qty;
      fragileItemNames.push(item.name);
    } else if (fragility === 'HIGH') {
      fragilityBreakdown.high += qty;
      fragileItemNames.push(item.name);
    } else if (fragility === 'MEDIUM') {
      fragilityBreakdown.medium += qty;
    } else {
      fragilityBreakdown.low += qty;
    }

    // Category distribution
    const cat = item.category || 'other';
    const existing = categoryMap.get(cat) || { count: 0, valueUSD: 0 };
    categoryMap.set(cat, {
      count: existing.count + qty,
      valueUSD: existing.valueUSD + itemVal,
    });
  });

  // Calculate tare weight
  const containerType = unitConfig?.type || 'other';
  const tareWeightGrams = unitConfig?.tareWeightGrams || DEFAULT_CONTAINER_TARE_WEIGHTS[containerType] || 250;
  const totalWeightGrams = itemsWeightGrams + tareWeightGrams;

  // Fragility score calculation: Weighted scale 0 - 100
  // Critical = 100, High = 70, Med = 35, Low = 10
  let fragilityScore = 15;
  if (totalQuantity > 0) {
    const weightedSum =
      fragilityBreakdown.critical * 100 +
      fragilityBreakdown.high * 70 +
      fragilityBreakdown.medium * 35 +
      fragilityBreakdown.low * 10;
    fragilityScore = Math.round(weightedSum / totalQuantity);
  }

  let fragilityLabel: ContainerStat['fragilityLabel'] = 'Low Risk / Durable';
  let fragilityColor = '#34C759'; // Green

  if (fragilityScore >= 75 || fragilityBreakdown.critical > 0) {
    fragilityLabel = 'Critical Care Required';
    fragilityColor = '#FF3B30'; // Red
  } else if (fragilityScore >= 50 || fragilityBreakdown.high > 0) {
    fragilityLabel = 'High Fragility';
    fragilityColor = '#FF9500'; // Amber/Orange
  } else if (fragilityScore >= 28) {
    fragilityLabel = 'Moderate Sensitivity';
    fragilityColor = '#007AFF'; // Blue
  }

  // Category distribution list
  const categoryDistribution = Array.from(categoryMap.entries()).map(([cat, data]) => ({
    category: cat,
    count: data.count,
    valueUSD: data.valueUSD,
    percentage: totalValueUSD > 0 ? (data.valueUSD / totalValueUSD) * 100 : 0,
    color: CATEGORY_COLORS[cat] || '#8E8E93',
  })).sort((a, b) => b.valueUSD - a.valueUSD);

  // Centerpiece item
  const topValuedItem = [...items].sort(
    (a, b) => (b.currentPriceUSD * (b.quantity || 1)) - (a.currentPriceUSD * (a.quantity || 1))
  )[0];

  return {
    containerName,
    metaStorage,
    unitConfig,
    itemCount: items.length,
    totalQuantity,
    totalValueUSD,
    totalCostUSD,
    unrealizedGainUSD: totalValueUSD - totalCostUSD,
    items,
    itemsWeightGrams,
    tareWeightGrams,
    totalWeightGrams,
    weightFormatted: formatWeight(totalWeightGrams),
    fragilityBreakdown,
    fragilityScore,
    fragilityLabel,
    fragilityColor,
    fragileItemNames,
    categoryDistribution,
    topValuedItem,
  };
}

/**
 * Computes the complete multi-container ranking and storage hub summary
 */
export function buildVaultStorageSummary(
  items: AssetItem[],
  storageUnits: StorageUnit[] = []
): VaultStorageSummary {
  // Group items by container & metaStorage
  const containerMap = new Map<string, { meta: string; container: string; items: AssetItem[] }>();
  const unassignedItems: AssetItem[] = [];
  const locationSet = new Set<string>();

  // Register all known storageUnits even if currently empty
  storageUnits.forEach((unit) => {
    const key = `${unit.metaStorage.trim()}:::${unit.container.trim()}`;
    locationSet.add(unit.metaStorage.trim());
    if (!containerMap.has(key)) {
      containerMap.set(key, {
        meta: unit.metaStorage.trim(),
        container: unit.container.trim(),
        items: [],
      });
    }
  });

  // Assign items into containers
  items.forEach((item) => {
    const meta = item.storageLocation?.metaStorage?.trim();
    const cont = item.storageLocation?.container?.trim();

    if (meta && cont) {
      const key = `${meta}:::${cont}`;
      locationSet.add(meta);
      if (!containerMap.has(key)) {
        containerMap.set(key, {
          meta,
          container: cont,
          items: [],
        });
      }
      containerMap.get(key)!.items.push(item);
    } else {
      unassignedItems.push(item);
    }
  });

  // Compute container stats
  const containerStats: ContainerStat[] = [];
  let totalAssignedValueUSD = 0;
  let totalAssignedItems = 0;
  let totalVaultWeightGrams = 0;

  const overallFragilityBreakdown = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  const overallCategoryMap = new Map<string, { count: number; valueUSD: number }>();

  containerMap.forEach(({ meta, container, items: contItems }) => {
    const stat = calculateContainerStats(container, meta, contItems, storageUnits);
    containerStats.push(stat);

    totalAssignedValueUSD += stat.totalValueUSD;
    totalAssignedItems += stat.itemCount;
    totalVaultWeightGrams += stat.totalWeightGrams;

    overallFragilityBreakdown.critical += stat.fragilityBreakdown.critical;
    overallFragilityBreakdown.high += stat.fragilityBreakdown.high;
    overallFragilityBreakdown.medium += stat.fragilityBreakdown.medium;
    overallFragilityBreakdown.low += stat.fragilityBreakdown.low;

    stat.categoryDistribution.forEach((cat) => {
      const existing = overallCategoryMap.get(cat.category) || { count: 0, valueUSD: 0 };
      overallCategoryMap.set(cat.category, {
        count: existing.count + cat.count,
        valueUSD: existing.valueUSD + cat.valueUSD,
      });
    });
  });

  // Rank containers by overall stored asset value descending
  const rankedContainers = containerStats
    .sort((a, b) => b.totalValueUSD - a.totalValueUSD)
    .map((stat, idx) => ({
      ...stat,
      valueRank: idx + 1,
      valueSharePercentage: totalAssignedValueUSD > 0 ? (stat.totalValueUSD / totalAssignedValueUSD) * 100 : 0,
    }));

  // Overall category distribution
  const overallCategoryDistribution = Array.from(overallCategoryMap.entries()).map(([cat, data]) => ({
    category: cat,
    count: data.count,
    valueUSD: data.valueUSD,
    percentage: totalAssignedValueUSD > 0 ? (data.valueUSD / totalAssignedValueUSD) * 100 : 0,
    color: CATEGORY_COLORS[cat] || '#8E8E93',
  })).sort((a, b) => b.valueUSD - a.valueUSD);

  // Overall fragility score
  let overallFragilityScore = 15;
  const totalQty = overallFragilityBreakdown.critical + overallFragilityBreakdown.high + overallFragilityBreakdown.medium + overallFragilityBreakdown.low;
  if (totalQty > 0) {
    const weightedSum =
      overallFragilityBreakdown.critical * 100 +
      overallFragilityBreakdown.high * 70 +
      overallFragilityBreakdown.medium * 35 +
      overallFragilityBreakdown.low * 10;
    overallFragilityScore = Math.round(weightedSum / totalQty);
  }

  let overallFragilityLabel = 'Safe & Durable';
  if (overallFragilityScore >= 70 || overallFragilityBreakdown.critical > 0) {
    overallFragilityLabel = 'High Preservation Alert';
  } else if (overallFragilityScore >= 45) {
    overallFragilityLabel = 'Moderate Fragility Exposure';
  }

  // Unassigned metrics
  const unassignedItemsValueUSD = unassignedItems.reduce(
    (acc, it) => acc + (it.currentPriceUSD || 0) * (it.quantity || 1),
    0
  );

  // Preservation health checks & smart alerts
  const preservationAlerts: VaultStorageSummary['preservationAlerts'] = [];

  // Check 1: Unassigned items
  if (unassignedItems.length > 0) {
    preservationAlerts.push({
      type: 'warning',
      title: 'Unassigned Collectibles Detected',
      message: `${unassignedItems.length} collectible(s) valued at $${unassignedItemsValueUSD.toLocaleString()} have not been assigned to a physical container.`,
    });
  }

  // Check 2: High value containers without armor
  rankedContainers.forEach((cont) => {
    if (cont.totalValueUSD > 1500 && cont.unitConfig?.type === 'box') {
      preservationAlerts.push({
        type: 'warning',
        title: 'High-Value Concentration in Standard Box',
        message: `${cont.containerName} holds $${cont.totalValueUSD.toLocaleString()} of assets in a cardboard container. Consider relocating high grails to a fireproof safe or Pelican case.`,
        containerName: cont.containerName,
      });
    }

    if (cont.fragilityBreakdown.high > 2 && cont.unitConfig?.type === 'binder') {
      preservationAlerts.push({
        type: 'info',
        title: 'High-Fragility Items in Binder',
        message: `${cont.containerName} contains ${cont.fragilityBreakdown.high} raw/fragile items. Ensure pages are side-loading and acid-free.`,
        containerName: cont.containerName,
      });
    }
  });

  if (preservationAlerts.length === 0) {
    preservationAlerts.push({
      type: 'success',
      title: 'Optimal Physical Vault Protection',
      message: 'All registered assets are safely allocated across reinforced containers with high preservation standards.',
    });
  }

  return {
    totalContainers: rankedContainers.length,
    totalLocations: locationSet.size,
    totalAssignedItems,
    totalAssignedValueUSD,
    totalVaultWeightGrams,
    totalVaultWeightFormatted: {
      kg: `${(totalVaultWeightGrams / 1000).toFixed(2)} kg`,
      lbs: `${(totalVaultWeightGrams * 0.00220462).toFixed(2)} lbs`,
      display: formatWeight(totalVaultWeightGrams).display,
    },
    overallFragilityScore,
    overallFragilityLabel,
    overallFragilityBreakdown,
    rankedContainers,
    overallCategoryDistribution,
    unassignedItemsCount: unassignedItems.length,
    unassignedItemsValueUSD,
    preservationAlerts,
  };
}
