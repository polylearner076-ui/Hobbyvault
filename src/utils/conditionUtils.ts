import { AssetItem, AssetCopy, ItemCondition, StorageLocation } from '../types';

export interface ConditionMeta {
  code: ItemCondition;
  label: string;
  shortLabel: string;
  multiplier: number;
  category: 'graded' | 'raw' | 'sealed';
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const CONDITION_METAS: Record<string, ConditionMeta> = {
  PSA_10: {
    code: 'PSA_10',
    label: 'Gem Mint 10 (PSA 10)',
    shortLabel: 'PSA 10 Gem Mint',
    multiplier: 3.5,
    category: 'graded',
    description: 'Virtually perfect card with four sharp corners, sharp focus, full original gloss.',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  PSA_10_GEM_MINT: {
    code: 'PSA_10_GEM_MINT',
    label: 'Gem Mint 10 (PSA 10)',
    shortLabel: 'PSA 10 Gem Mint',
    multiplier: 3.5,
    category: 'graded',
    description: 'Virtually perfect card with four sharp corners, sharp focus, full original gloss.',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  BGS_10: {
    code: 'BGS_10',
    label: 'Pristine 10 (BGS 10)',
    shortLabel: 'BGS 10 Pristine',
    multiplier: 4.2,
    category: 'graded',
    description: 'Flawless centering, sub-grades 9.5-10, pristine surface & edges.',
    badgeBg: 'bg-emerald-50 text-emerald-800',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
  },
  BGS_10_PRISTINE: {
    code: 'BGS_10_PRISTINE',
    label: 'Pristine 10 (BGS 10)',
    shortLabel: 'BGS 10 Pristine',
    multiplier: 4.2,
    category: 'graded',
    description: 'Flawless centering, sub-grades 9.5-10, pristine surface & edges.',
    badgeBg: 'bg-emerald-50 text-emerald-800',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
  },
  CGC_10: {
    code: 'CGC_10',
    label: 'Pristine 10 (CGC 10)',
    shortLabel: 'CGC 10 Pristine',
    multiplier: 3.2,
    category: 'graded',
    description: 'Perfect corners, flawless surface under magnification.',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  CGC_10_PRISTINE: {
    code: 'CGC_10_PRISTINE',
    label: 'Pristine 10 (CGC 10)',
    shortLabel: 'CGC 10 Pristine',
    multiplier: 3.2,
    category: 'graded',
    description: 'Perfect corners, flawless surface under magnification.',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  'BGS_9.5': {
    code: 'BGS_9.5',
    label: 'Gem Mint 9.5 (BGS 9.5)',
    shortLabel: 'BGS 9.5 Gem Mint',
    multiplier: 2.2,
    category: 'graded',
    description: 'Premium graded slab with exceptional centering and edge clarity.',
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  BGS_9_5: {
    code: 'BGS_9_5',
    label: 'Gem Mint 9.5 (BGS 9.5)',
    shortLabel: 'BGS 9.5 Gem Mint',
    multiplier: 2.2,
    category: 'graded',
    description: 'Premium graded slab with exceptional centering and edge clarity.',
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  PSA_9: {
    code: 'PSA_9',
    label: 'Mint 9 (PSA 9)',
    shortLabel: 'PSA 9 Mint',
    multiplier: 1.8,
    category: 'graded',
    description: 'Superb condition with only minor microscopic flaws.',
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  PSA_9_MINT: {
    code: 'PSA_9_MINT',
    label: 'Mint 9 (PSA 9)',
    shortLabel: 'PSA 9 Mint',
    multiplier: 1.8,
    category: 'graded',
    description: 'Superb condition with only minor microscopic flaws.',
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  PSA_8: {
    code: 'PSA_8',
    label: 'Near Mint-Mint 8 (PSA 8)',
    shortLabel: 'PSA 8 NM-MT',
    multiplier: 1.3,
    category: 'graded',
    description: 'High-end collectible condition with slight wear upon close inspection.',
    badgeBg: 'bg-indigo-50 text-indigo-700',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
  },
  NIB: {
    code: 'NIB',
    label: 'Factory Sealed / New In Box (NIB)',
    shortLabel: 'Factory Sealed',
    multiplier: 1.6,
    category: 'sealed',
    description: 'Brand new, unopened in original manufacturer packaging or shrinkwrap.',
    badgeBg: 'bg-purple-50 text-purple-700',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
  },
  MINT_IN_BOX: {
    code: 'MINT_IN_BOX',
    label: 'Mint In Box (MIB)',
    shortLabel: 'Mint In Box',
    multiplier: 1.3,
    category: 'sealed',
    description: 'Complete with original box, pristine collectible state.',
    badgeBg: 'bg-purple-50 text-purple-700',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
  },
  RAW_NM: {
    code: 'RAW_NM',
    label: 'Near Mint / Flawless (NM)',
    shortLabel: 'Near Mint',
    multiplier: 1.0,
    category: 'raw',
    description: 'Clean surface, minimal whitening, sharp corners. Standard reference market value.',
    badgeBg: 'bg-teal-50 text-teal-700',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
  },
  RAW_LP: {
    code: 'RAW_LP',
    label: 'Well Condition / Lightly Played (LP)',
    shortLabel: 'Well Condition (LP)',
    multiplier: 0.75,
    category: 'raw',
    description: 'Well kept condition with minor edge whitening or light surface scratches.',
    badgeBg: 'bg-amber-50 text-amber-700',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
  },
  RAW_MP: {
    code: 'RAW_MP',
    label: 'Moderately Played (MP)',
    shortLabel: 'Moderately Played (MP)',
    multiplier: 0.50,
    category: 'raw',
    description: 'Visible edge wear, minor indentations or noticeable clouding.',
    badgeBg: 'bg-orange-50 text-orange-700',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
  },
  RAW_HP: {
    code: 'RAW_HP',
    label: 'Poor Condition / Heavily Played (HP)',
    shortLabel: 'Poor Condition (HP)',
    multiplier: 0.25,
    category: 'raw',
    description: 'Heavy wear, creasing, severe scratches, or structural blemishes.',
    badgeBg: 'bg-rose-50 text-rose-700',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
  },
  USED: {
    code: 'USED',
    label: 'Used / Battle-Tested',
    shortLabel: 'Used / Battle-Tested',
    multiplier: 0.40,
    category: 'raw',
    description: 'Battle-tested Beyblade or game piece showing play marks and cosmetic scuffs.',
    badgeBg: 'bg-zinc-100 text-zinc-700',
    badgeText: 'text-zinc-700',
    badgeBorder: 'border-zinc-300',
  },
};

export function getConditionMeta(cond: ItemCondition | string): ConditionMeta {
  const normalizedKey = cond === 'BGS_9.5' ? 'BGS_9_5' : cond;
  return (
    (CONDITION_METAS as any)[normalizedKey] ||
    CONDITION_METAS.RAW_NM
  );
}

/**
 * Calculates current market estimate for a specific copy based on base raw NM price and condition.
 */
export function calculateCopyValue(basePriceUSD: number, copy: Partial<AssetCopy>): number {
  if (typeof copy.currentValueUSD === 'number' && copy.currentValueUSD > 0) {
    return copy.currentValueUSD;
  }
  const meta = getConditionMeta(copy.condition || 'RAW_NM');
  const computed = basePriceUSD * meta.multiplier;
  return Number(Math.max(1, computed).toFixed(2));
}

/**
 * Calculates total valuation for an asset including all its individual copies
 */
export function calculateItemTotalValuation(item: AssetItem): number {
  if (item.copies && item.copies.length > 0) {
    return item.copies.reduce((sum, copy) => sum + calculateCopyValue(item.currentPriceUSD, copy), 0);
  }
  return item.currentPriceUSD * (item.quantity || 1);
}

/**
 * Calculates total purchase cost for an asset including all its individual copies
 */
export function calculateItemTotalCost(item: AssetItem): number {
  if (item.copies && item.copies.length > 0) {
    return item.copies.reduce((sum, copy) => sum + (copy.purchasePriceUSD ?? item.purchasePriceUSD ?? 0), 0);
  }
  return (item.purchasePriceUSD || 0) * (item.quantity || 1);
}

/**
 * Builds a human-readable condition breakdown for cards with multiple copies
 * e.g. "1x Gem Mint 10, 1x Well Condition, 1x Poor Condition"
 */
export function getConditionBreakdown(item: AssetItem): string {
  if (!item.copies || item.copies.length <= 1) {
    const meta = getConditionMeta(item.condition);
    return meta.shortLabel;
  }

  const counts: Record<string, number> = {};
  item.copies.forEach((c) => {
    const meta = getConditionMeta(c.condition);
    const label = c.customConditionLabel || meta.shortLabel;
    counts[label] = (counts[label] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([label, count]) => `${count}x ${label}`)
    .join(', ');
}

/**
 * Creates default copies from an existing item if copies[] is empty
 */
export function ensureCopiesForAsset(item: AssetItem): AssetCopy[] {
  if (item.copies && item.copies.length > 0) {
    return item.copies;
  }

  const count = Math.max(1, item.quantity || 1);
  const copies: AssetCopy[] = [];

  for (let i = 0; i < count; i++) {
    copies.push({
      id: `copy-${item.id}-${i + 1}`,
      condition: item.condition || 'RAW_NM',
      purchasePriceUSD: item.purchasePriceUSD,
      purchaseDate: item.purchaseDate,
      currentValueUSD: item.currentPriceUSD,
      storageLocation: item.storageLocation,
      notes: count > 1 ? `Copy #${i + 1}` : undefined,
    });
  }

  return copies;
}
