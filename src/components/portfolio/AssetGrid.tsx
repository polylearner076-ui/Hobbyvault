import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { AssetItem } from '../../types';
import { AssetCard } from './AssetCard';
import {
  Search,
  X,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Layers,
  Sparkles,
  Tag,
  Filter,
  RotateCcw,
  Check,
} from 'lucide-react';
import { CollectibleImage } from '../common/CollectibleImage';

interface AssetGridProps {
  onSelectItem: (item: AssetItem) => void;
  onOpenAddModal: () => void;
  onOpenScanModal?: () => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  onSelectItem,
  onOpenAddModal,
}) => {
  const {
    filteredItems,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTag,
    setSelectedTag,
    availableTags,
    availableCategories,
    clearAllFilters,
    selectedCondition,
    setSelectedCondition,
    sortBy,
    setSortBy,
    formatPrice,
    activeSandbox,
    agentActiveFilter,
    clearAgentActiveFilter,
  } = useVault();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const conditions = [
    { id: 'ALL', label: 'All Grades' },
    { id: 'PSA_10', label: 'PSA 10' },
    { id: 'CGC_10', label: 'CGC 10' },
    { id: 'RAW_NM', label: 'Near Mint' },
    { id: 'NIB', label: 'Sealed / NIB' },
  ];

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    selectedTag !== null ||
    selectedCondition !== 'ALL' ||
    Boolean(searchQuery.trim()) ||
    agentActiveFilter !== null;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-20">
      {/* Active Meta-Agent Filter Banner */}
      {agentActiveFilter && (
        <div className="mb-3 p-3.5 rounded-2xl bg-purple-50 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-900">
                  Active Meta-Agent Filter
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-200/60 text-purple-800 font-semibold">
                  {filteredItems.length} Matched Assets ({formatPrice(agentActiveFilter.totalValueUSD)})
                </span>
              </div>
              <p className="text-[11px] text-purple-700 font-medium truncate max-w-lg">
                &ldquo;{agentActiveFilter.title || agentActiveFilter.query}&rdquo;
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearAgentActiveFilter}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Agent Filter</span>
          </button>
        </div>
      )}

      {/* Primary Search & Filter Bar */}
      <div className="w-full max-w-full space-y-2.5 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-black/[0.06] shadow-sm">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0" />
            <input
              id="search-assets-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSandbox
                  ? `Search ${activeSandbox.name} items, tags, sets, parts...`
                  : 'Search by card name, tag, set, game, blade, grade, note...'
              }
              className="w-full pl-9 pr-8 py-2 bg-[#F2F2F7] border border-black/[0.06] rounded-xl text-xs sm:text-sm text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1C1C1E] p-1 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Condition Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 py-0.5">
            {conditions.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCondition(c.id)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCondition === c.id
                    ? 'bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.04] border border-transparent'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Sort and View Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Sort Dropdown */}
            <select
              id="sort-assets-select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 sm:px-3 py-1.5 bg-[#F2F2F7] border border-black/[0.06] rounded-xl text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] cursor-pointer"
            >
              <option value="value_desc">Highest Value</option>
              <option value="value_asc">Lowest Value</option>
              <option value="gain_desc">Top % Gainers</option>
              <option value="gain_asc">Top % Losers</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="recent">Recently Added</option>
            </select>

            {/* Grid vs Table Toggle */}
            <div className="flex items-center bg-[#F2F2F7] p-1 rounded-xl border border-black/[0.06]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
                title="Table View"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Box */}
        {availableCategories.length > 0 && (
          <div className="w-full max-w-full bg-white p-3 rounded-2xl border border-black/[0.06] shadow-sm space-y-2.5">
            {/* Category / Asset Types Row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#007AFF]" />
                <span>Category:</span>
              </span>

              {/* All Types Chip */}
              <button
                type="button"
                id="filter-type-all"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#1C1C1E] text-white shadow-2xs'
                    : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.06]'
                }`}
              >
                All
              </button>

              {/* Dynamic Category Chips */}
              {availableCategories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
                return (
                  <button
                    key={cat.id}
                    id={`filter-type-${cat.id}`}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold max-w-[220px] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#007AFF] text-white shadow-2xs'
                        : 'bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#007AFF]/10 hover:text-[#007AFF]'
                    }`}
                  >
                    <span className="truncate">{cat.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-black/[0.06] text-[#8E8E93]'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Filters Summary Bar & 1-Click Reset */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/[0.04] text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[#8E8E93]">
                    Active Filters ({filteredItems.length} results):
                  </span>

                  {selectedCategory !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#007AFF]/10 text-[#007AFF] text-xs font-semibold max-w-[220px]">
                      <span className="truncate">
                        Category: {availableCategories.find((c) => c.id.toLowerCase() === selectedCategory.toLowerCase())?.label || selectedCategory}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('ALL')}
                        className="hover:text-blue-900 cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedTag && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#34C759]/15 text-[#28A745] text-xs font-semibold max-w-[200px]">
                      <span className="truncate">Tag: #{selectedTag}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTag(null)}
                        className="hover:text-emerald-900 cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedCondition !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/[0.06] text-[#1C1C1E] text-xs font-semibold">
                      <span>Grade: {conditions.find((c) => c.id === selectedCondition)?.label || selectedCondition}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCondition('ALL')}
                        className="hover:text-black cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {searchQuery.trim() && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/[0.06] text-[#1C1C1E] text-xs font-semibold max-w-[220px]">
                      <span className="truncate">Search: &ldquo;{searchQuery}&rdquo;</span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="hover:text-black cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  id="btn-reset-all-filters"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer shrink-0 ml-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="w-full py-16 px-4 rounded-3xl bg-white border border-black/[0.06] shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-black/[0.04] flex items-center justify-center text-[#8E8E93] mb-4 border border-black/[0.06]">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#1C1C1E] mb-1">No Assets Match Filters</h3>
          <p className="text-xs sm:text-sm text-[#8E8E93] max-w-sm mb-6">
            {hasActiveFilters
              ? 'No collectibles in your vault matched the active tag, type, or search filters. Try clearing your filters.'
              : activeSandbox
              ? `Your ${activeSandbox.name} vault is currently empty.`
              : 'Your collection is empty. Start adding items to track market values!'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C1C1E] hover:bg-black text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add From Catalog</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredItems.map((item) => (
            <AssetCard key={item.id} item={item} onClick={() => onSelectItem(item)} />
          ))}
        </div>
      ) : (
        /* Table / List Mode */
        <div className="w-full overflow-x-auto rounded-2xl border border-black/[0.06] bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F2F7] text-[#8E8E93] font-bold border-b border-black/[0.06] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-3">Type & Tags</th>
                <th className="py-3 px-3">Condition / Specs</th>
                <th className="py-3 px-3 text-right">Qty</th>
                <th className="py-3 px-4 text-right">Buy Price</th>
                <th className="py-3 px-4 text-right">Current Market</th>
                <th className="py-3 px-4 text-right">Gain / Loss</th>
                <th className="py-3 px-4 text-right">24h Move</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-[#1C1C1E]">
              {filteredItems.map((item) => {
                const totalVal = item.currentPriceUSD * item.quantity;
                const totalCost = item.purchasePriceUSD * item.quantity;
                const gain = totalVal - totalCost;
                const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0;
                const prev24 = item.previousPriceUSD_24h ?? item.currentPriceUSD;
                const delta24 = item.currentPriceUSD - prev24;
                const delta24Pct = prev24 > 0 ? (delta24 / prev24) * 100 : 0;

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="hover:bg-black/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F2F2F7] border border-black/[0.06] shrink-0">
                          <CollectibleImage
                            src={item.imageUrl}
                            alt={item.name}
                            category={item.category}
                            showBadge={false}
                            iconClassName="w-4 h-4"
                            className="w-full h-full object-contain p-1"
                            containerClassName="w-full h-full flex items-center justify-center"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-[#1C1C1E] line-clamp-1">{item.name}</div>
                          <div className="text-[11px] text-[#8E8E93]">
                            {item.cardSpecs?.setName || item.beybladeSpecs?.brand || 'Asset'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type & Tags Column */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(item.category);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF] hover:text-white transition-colors cursor-pointer"
                        >
                          {item.category}
                        </button>
                        {item.tags?.slice(0, 2).map((t, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(t);
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-black/[0.04] text-[#8E8E93] hover:text-[#34C759] hover:bg-[#34C759]/10 transition-colors cursor-pointer"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/[0.05] text-[#1C1C1E] border border-black/[0.06]">
                        {item.condition.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">x{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#8E8E93]">
                      {formatPrice(item.purchasePriceUSD)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#1C1C1E]">
                      {formatPrice(item.currentPriceUSD)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        gain >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'
                      }`}
                    >
                      {gain >= 0 ? '+' : ''}
                      {gainPct.toFixed(1)}% ({formatPrice(gain)})
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold text-[11px] ${
                        delta24 >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'
                      }`}
                    >
                      {delta24 >= 0 ? '+' : ''}
                      {delta24Pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

