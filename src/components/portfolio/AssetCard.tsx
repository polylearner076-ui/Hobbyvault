import React from 'react';
import { AssetItem } from '../../types';
import { useVault } from '../../context/VaultContext';
import {
  Star,
  MapPin,
  Layers,
  Tag,
} from 'lucide-react';
import {
  getConditionMeta,
  calculateItemTotalValuation,
  calculateItemTotalCost,
  getConditionBreakdown,
} from '../../utils/conditionUtils';

interface AssetCardProps {
  item: AssetItem;
  onClick: () => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ item, onClick }) => {
  const {
    formatPrice,
    updateItem,
    selectedTag,
    setSelectedTag,
    selectedCategory,
    setSelectedCategory,
  } = useVault();

  const totalValue = calculateItemTotalValuation(item);
  const totalCost = calculateItemTotalCost(item);
  const gainUSD = totalValue - totalCost;
  const gainPercent = totalCost > 0 ? (gainUSD / totalCost) * 100 : 0;
  const isGainPositive = gainUSD >= 0;

  const prev24 = item.previousPriceUSD_24h ?? item.currentPriceUSD;
  const delta24hUSD = item.currentPriceUSD - prev24;
  const delta24hPercent = prev24 > 0 ? (delta24hUSD / prev24) * 100 : 0;
  const is24hPositive = delta24hUSD >= 0;

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateItem(item.id, { isFavorite: !item.isFavorite });
  };

  const hasMultipleCopies = item.copies && item.copies.length > 1;

  const renderConditionBadge = () => {
    if (hasMultipleCopies) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 flex items-center gap-1">
          <Layers className="w-2.5 h-2.5" />
          <span>{item.copies!.length} Copies • Multi-Condition</span>
        </span>
      );
    }

    const meta = getConditionMeta(item.condition);
    if (item.condition.startsWith('PSA_10')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#FF3B30] text-white shadow-xs tracking-wider">
          PSA 10 GEM MT
        </span>
      );
    }
    if (item.condition.startsWith('BGS_10')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#FF9500] text-white shadow-xs font-mono">
          BGS 10 PRISTINE
        </span>
      );
    }
    if (item.condition.startsWith('CGC_10')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#007AFF] text-white shadow-xs">
          CGC 10 PRISTINE
        </span>
      );
    }
    if (item.condition === 'NIB' || item.condition === 'MINT_IN_BOX') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
          SEALED BOX
        </span>
      );
    }
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${meta.badgeBg} ${meta.badgeBorder}`}>
        {meta.shortLabel}
      </span>
    );
  };

  const renderBeybladeType = () => {
    if (!item.beybladeSpecs) return null;
    const type = item.beybladeSpecs.type;
    let colorClass = 'bg-blue-50 text-blue-600 border-blue-200';
    if (type === 'Attack') colorClass = 'bg-red-50 text-red-600 border-red-200';
    if (type === 'Defense') colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (type === 'Stamina') colorClass = 'bg-amber-50 text-amber-600 border-amber-200';
    if (type === 'Balance') colorClass = 'bg-purple-50 text-purple-600 border-purple-200';

    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${colorClass}`}>
        {type}
      </span>
    );
  };

  return (
    <div
      id={`asset-card-${item.id}`}
      onClick={onClick}
      className="group relative rounded-3xl bg-white hover:bg-white border border-black/[0.06] hover:border-black/[0.12] p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between text-[#1C1C1E]"
    >
      {/* Top Media & Floating Badges */}
      <div>
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#F2F2F7] mb-3.5 border border-black/[0.04] flex items-center justify-center">
          <img
            src={item.imageUrl}
            alt={item.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-105"
            onError={(e: any) => {
              e.target.src = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80';
            }}
          />

          {/* Floating Favorite Star */}
          <button
            onClick={toggleFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-[#8E8E93] hover:text-[#FF9500] backdrop-blur-md border border-black/[0.06] transition-colors shadow-xs cursor-pointer"
          >
            <Star
              className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-[#FF9500] text-[#FF9500]' : ''}`}
            />
          </button>

          {/* Quantity / Copies Badge if > 1 */}
          {(item.copies?.length || item.quantity) > 1 && (
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/75 text-white font-mono text-[10px] font-bold shadow-xs">
              x{item.copies?.length || item.quantity} copies
            </span>
          )}

          {/* 24h move pill */}
          <div
            className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold backdrop-blur-md shadow-xs border ${
              is24hPositive
                ? 'bg-white/90 text-[#34C759] border-[#34C759]/30'
                : 'bg-white/90 text-[#FF3B30] border-[#FF3B30]/30'
            }`}
          >
            {is24hPositive ? '+' : ''}
            {delta24hPercent.toFixed(1)}% 24h
          </div>
        </div>

        {/* Condition & Specific Spec Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {renderConditionBadge()}
          {renderBeybladeType()}
          {item.cardSpecs?.rarity && (
            <span className="px-1.5 py-0.5 rounded text-[10px] text-[#8E8E93] bg-black/[0.04] border border-black/[0.06] truncate max-w-[120px] font-medium">
              {item.cardSpecs.rarity}
            </span>
          )}
          {item.beybladeSpecs?.code && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold text-[#007AFF] bg-[#007AFF]/10 border border-[#007AFF]/20">
              {item.beybladeSpecs.code}
            </span>
          )}
        </div>

        {/* Multi-Condition breakdown row */}
        {hasMultipleCopies && (
          <div className="text-[10px] text-[#8E8E93] mb-1.5 bg-[#F2F2F7] px-2 py-1 rounded-lg line-clamp-1 border border-black/[0.04]">
            {getConditionBreakdown(item)}
          </div>
        )}

        {/* Item Title */}
        <h3 className="font-bold text-sm text-[#1C1C1E] line-clamp-2 leading-snug group-hover:text-[#007AFF] transition-colors">
          {item.name}
        </h3>

        {/* Subtitle / Set info */}
        <div className="text-xs text-[#8E8E93] mt-1 line-clamp-1 font-medium">
          {item.cardSpecs?.setName || (item.beybladeSpecs ? `${item.beybladeSpecs.brand} • ${item.beybladeSpecs.generation}` : (item.tags?.[0] || 'Collectible Asset'))}
        </div>

        {/* Assigned Tags List - Clickable for Instant Tag Filtering */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {item.tags.slice(0, 3).map((t, idx) => {
              const isTagActive = selectedTag?.toLowerCase() === t.toLowerCase();
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTag(isTagActive ? null : t);
                  }}
                  title={`Filter by tag: #${t}`}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                    isTagActive
                      ? 'bg-[#007AFF] text-white shadow-2xs'
                      : 'bg-black/[0.04] text-[#8E8E93] hover:text-[#007AFF] hover:bg-[#007AFF]/10 border border-black/[0.04]'
                  }`}
                >
                  <span>#{t}</span>
                </button>
              );
            })}
            {item.tags.length > 3 && (
              <span className="text-[9px] text-[#8E8E93] font-medium">
                +{item.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Physical Storage Location Breadcrumb */}
        {item.storageLocation?.container && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-[#007AFF] bg-[#007AFF]/6 px-2 py-0.5 rounded-md border border-[#007AFF]/15 font-medium truncate">
            <MapPin className="w-2.5 h-2.5 shrink-0 text-[#007AFF]" />
            <span className="truncate">
              {item.storageLocation.container}
              {item.storageLocation.slot ? ` • ${item.storageLocation.slot}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Pricing & Gain / Loss */}
      <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-[#8E8E93]">
              {hasMultipleCopies ? 'Total Asset Value' : 'Market Price'}
            </span>
            {item.marketSource && (
              <span
                title={`Live feed source: ${item.marketSource}`}
                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
              />
            )}
          </div>
          <div className="text-base font-extrabold text-[#1C1C1E] font-mono leading-tight">
            {formatPrice(hasMultipleCopies ? totalValue : item.currentPriceUSD)}
          </div>
          {hasMultipleCopies && (
            <div className="text-[10px] text-[#8E8E93] font-mono">
              Raw Base: {formatPrice(item.currentPriceUSD)}
            </div>
          )}
        </div>

        {/* Return on Investment */}
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-[#8E8E93]">Gain / Loss</div>
          <div
            className={`text-xs font-bold font-mono ${
              isGainPositive ? 'text-[#34C759]' : 'text-[#FF3B30]'
            }`}
          >
            {isGainPositive ? '+' : ''}
            {gainPercent.toFixed(1)}%
          </div>
          <div className="text-[10px] text-[#8E8E93] font-mono">
            {isGainPositive ? '+' : ''}
            {formatPrice(gainUSD)}
          </div>
        </div>
      </div>
    </div>
  );
};
