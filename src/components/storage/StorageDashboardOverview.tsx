import React, { useState, useMemo } from 'react';
import { useVault } from '../../context/VaultContext';
import {
  VaultStorageSummary,
  ContainerStat,
  buildVaultStorageSummary,
} from '../../utils/storageAnalytics';
import {
  Box,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  Folder,
  ArrowUpRight,
  Flame,
  PieChart as PieIcon,
  BarChart3,
  Dumbbell,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StorageDashboardOverviewProps {
  onSelectContainer: (metaStorage: string, container: string) => void;
  onSelectMetaStorage: (metaStorage: string) => void;
}

export const StorageDashboardOverview: React.FC<StorageDashboardOverviewProps> = ({
  onSelectContainer,
  onSelectMetaStorage,
}) => {
  const { items, storageUnits, formatPrice } = useVault();
  const [activeTab, setActiveTab] = useState<'all' | 'ranking' | 'distribution' | 'weight' | 'fragility'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Compute storage summary
  const summary: VaultStorageSummary = useMemo(() => {
    return buildVaultStorageSummary(items, storageUnits);
  }, [items, storageUnits]);

  // Total vault valuation for proportion comparison
  const totalVaultValueUSD = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.currentPriceUSD || 0) * (it.quantity || 1), 0);
  }, [items]);

  const allocatedPercentage = totalVaultValueUSD > 0
    ? (summary.totalAssignedValueUSD / totalVaultValueUSD) * 100
    : 0;

  // Filter containers by category if category pill is selected
  const displayedContainers = useMemo(() => {
    if (!selectedCategoryFilter) return summary.rankedContainers;
    return summary.rankedContainers.filter((c) =>
      c.categoryDistribution.some((cat) => cat.category === selectedCategoryFilter)
    );
  }, [summary.rankedContainers, selectedCategoryFilter]);

  const topContainer = summary.rankedContainers[0];

  return (
    <div id="storage-intelligence-dashboard" className="bg-white rounded-2xl border border-black/[0.06] shadow-xs p-4 sm:p-6 flex-1 flex flex-col gap-5 sm:gap-6 min-w-0">
      {/* Integrated Dashboard Navigation & Context Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-blue-50 text-[#007AFF] shrink-0">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#1C1C1E] tracking-tight truncate">
                Storage Intelligence & Diagnostics
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F2F2F7] text-[#1C1C1E] border border-black/[0.06] hidden xs:inline">
                {summary.totalContainers} Active Units
              </span>
            </div>
            <p className="text-xs text-[#8E8E93] mt-0.5 truncate">
              {activeTab === 'all' && 'Comprehensive overview of container valuation rankings, mass loadout, and preservation safety.'}
              {activeTab === 'ranking' && 'Storage containers ordered by total monetary valuation and asset concentration.'}
              {activeTab === 'distribution' && 'Cross-category distribution of collectible genres across physical storage containers.'}
              {activeTab === 'weight' && 'Physical load loadout, tare container weight, and collectible payload analytics.'}
              {activeTab === 'fragility' && 'Preservation vulnerability scoring and delicate asset protection guidelines.'}
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1 bg-[#F2F2F7] p-1 rounded-xl shrink-0 overflow-x-auto no-scrollbar max-w-full">
          <button
            id="tab-all-overview"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white text-[#1C1C1E] shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            Overview
          </button>
          <button
            id="tab-ranking-leaderboard"
            onClick={() => setActiveTab('ranking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'ranking'
                ? 'bg-white text-[#1C1C1E] shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            Value Ranking
          </button>
          <button
            id="tab-distribution-breakdown"
            onClick={() => setActiveTab('distribution')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'distribution'
                ? 'bg-white text-[#1C1C1E] shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            Asset Distribution
          </button>
          <button
            id="tab-weight-loadout"
            onClick={() => setActiveTab('weight')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'weight'
                ? 'bg-white text-[#1C1C1E] shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            Container Weight
          </button>
          <button
            id="tab-fragility-matrix"
            onClick={() => setActiveTab('fragility')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'fragility'
                ? 'bg-white text-[#1C1C1E] shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            Fragility Index
          </button>
        </div>
      </div>

      {/* Featured Overview Highlights (Only on overview tab) */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Spotlight 1: #1 Value Leader Container */}
          <div
            onClick={() => topContainer && onSelectContainer(topContainer.metaStorage, topContainer.containerName)}
            className="bg-[#F2F2F7]/50 hover:bg-[#F2F2F7] rounded-2xl border border-black/[0.06] p-4 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <Award className="w-3.5 h-3.5" />
                <span>#1 Vault Value Leader</span>
              </div>
              <span className="text-xs text-[#8E8E93] flex items-center gap-1">
                <span>Inspect</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="mt-3">
              <div className="text-base font-bold text-[#1C1C1E] truncate">
                {topContainer ? topContainer.containerName : 'No Containers'}
              </div>
              <div className="text-xs text-[#8E8E93] mt-0.5 flex items-center gap-2">
                <span>Location: {topContainer?.metaStorage}</span>
                <span>•</span>
                <span>{topContainer?.itemCount || 0} items</span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold text-[#1C1C1E]">
                  {topContainer ? formatPrice(topContainer.totalValueUSD) : '$0'}
                </span>
                {topContainer && (
                  <span className="text-xs font-semibold text-emerald-600">
                    ({topContainer.valueSharePercentage?.toFixed(0)}% of stored wealth)
                  </span>
                )}
              </div>
              {topContainer?.topValuedItem && (
                <div className="mt-2 text-xs bg-white/80 p-2 rounded-xl border border-black/[0.04] text-[#8E8E93] flex items-center justify-between">
                  <span className="truncate">
                    Top grail: <strong className="text-[#1C1C1E]">{topContainer.topValuedItem.name}</strong>
                  </span>
                  <span className="font-bold text-[#1C1C1E] shrink-0 ml-2">
                    {formatPrice(topContainer.topValuedItem.currentPriceUSD)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Spotlight 2: Preservation Vulnerability Matrix */}
          <div className="bg-[#F2F2F7]/50 rounded-2xl border border-black/[0.06] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#007AFF] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Preservation Diagnosis</span>
              </div>
              <span className="text-xs font-semibold text-[#8E8E93]">
                {summary.overallFragilityLabel}
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[#1C1C1E]">
                  {summary.overallFragilityScore}/100
                </span>
                <span className="text-xs text-[#8E8E93]">
                  Vulnerability Index
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-black/[0.06] rounded-full h-2 overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(5, summary.overallFragilityScore)}%`,
                    backgroundColor: summary.overallFragilityScore >= 65 ? '#EF4444' : '#10B981',
                  }}
                />
              </div>

              {/* 4 item tiers breakdown */}
              <div className="grid grid-cols-4 gap-1.5 mt-3 text-center">
                <div className="p-1.5 rounded-lg bg-red-50 text-red-700">
                  <div className="text-[10px] font-semibold">Critical</div>
                  <div className="text-xs font-bold">{summary.overallFragilityBreakdown.critical}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                  <div className="text-[10px] font-semibold">High</div>
                  <div className="text-xs font-bold">{summary.overallFragilityBreakdown.high}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                  <div className="text-[10px] font-semibold">Medium</div>
                  <div className="text-xs font-bold">{summary.overallFragilityBreakdown.medium}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <div className="text-[10px] font-semibold">Durable</div>
                  <div className="text-xs font-bold">{summary.overallFragilityBreakdown.low}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preservation & Health Advisory Banner */}
      {summary.preservationAlerts && summary.preservationAlerts.length > 0 && (
        <div className="space-y-2">
          {summary.preservationAlerts.slice(0, 2).map((alert, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs ${
                alert.type === 'warning'
                  ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
                  : alert.type === 'info'
                  ? 'bg-blue-50/70 border-blue-200/80 text-blue-900'
                  : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {alert.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : alert.type === 'info' ? (
                  <Info className="w-4 h-4 text-[#007AFF]" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div className="flex-1">
                <span className="font-bold">{alert.title}: </span>
                <span>{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT 1: FULL OVERVIEW & RANKING */}
      {(activeTab === 'all' || activeTab === 'ranking') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-[#1C1C1E]">
                Containers Ranked by Stored Asset Value
              </h3>
            </div>
            <span className="text-xs text-[#8E8E93]">
              {summary.rankedContainers.length} Active Storage Containers
            </span>
          </div>

          <div className="space-y-3">
            {displayedContainers.map((cont, idx) => {
              const rank = cont.valueRank || idx + 1;
              const rankColor =
                rank === 1
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : rank === 2
                  ? 'bg-slate-200 text-slate-800 border-slate-300'
                  : rank === 3
                  ? 'bg-amber-700/10 text-amber-900 border-amber-700/20'
                  : 'bg-black/[0.04] text-[#8E8E93] border-black/[0.06]';

              return (
                <div
                  key={`${cont.metaStorage}:::${cont.containerName}`}
                  onClick={() => onSelectContainer(cont.metaStorage, cont.containerName)}
                  className="group bg-white rounded-2xl border border-black/[0.08] hover:border-[#007AFF] hover:shadow-md p-4 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${rankColor}`}
                    >
                      #{rank}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1C1C1E] group-hover:text-[#007AFF] transition-colors truncate">
                          {cont.containerName}
                        </h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/[0.04] text-[#8E8E93] shrink-0">
                          {cont.unitConfig?.type || 'Container'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#8E8E93]">
                        <span className="flex items-center gap-1 text-[#1C1C1E] font-medium">
                          <Folder className="w-3 h-3 text-[#8E8E93]" />
                          {cont.metaStorage}
                        </span>
                        <span>•</span>
                        <span>{cont.itemCount} items ({cont.totalQuantity} total qty)</span>
                        {cont.topValuedItem && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px] text-[11px] text-[#007AFF]">
                              Top: {cont.topValuedItem.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right metrics & progress bar */}
                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-black/[0.04]">
                    {/* Weight badge */}
                    <div className="text-left md:text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                        Total Mass
                      </div>
                      <div className="text-xs font-bold text-[#1C1C1E] flex items-center gap-1 md:justify-end mt-0.5">
                        <Scale className="w-3 h-3 text-[#8E8E93]" />
                        {cont.weightFormatted.display}
                      </div>
                    </div>

                    {/* Fragility badge */}
                    <div className="text-left md:text-right min-w-[90px]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                        Fragility
                      </div>
                      <div className="flex items-center gap-1 md:justify-end mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cont.fragilityColor }}
                        />
                        <span className="text-xs font-semibold text-[#1C1C1E]">
                          {cont.fragilityLabel.split(' ')[0]} ({cont.fragilityScore})
                        </span>
                      </div>
                    </div>

                    {/* Value & share */}
                    <div className="text-right min-w-[110px]">
                      <div className="text-sm font-bold text-[#1C1C1E]">
                        {formatPrice(cont.totalValueUSD)}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                        {cont.valueSharePercentage?.toFixed(1)}% of storage
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-[#007AFF] group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: ASSET DISTRIBUTION ACROSS CONTAINERS */}
      {(activeTab === 'all' || activeTab === 'distribution') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#007AFF]" />
              <h3 className="text-sm font-bold text-[#1C1C1E]">
                Asset Category Distribution in Storage
              </h3>
            </div>
            {selectedCategoryFilter && (
              <button
                onClick={() => setSelectedCategoryFilter(null)}
                className="text-xs font-semibold text-[#007AFF] hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Interactive Category Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {summary.overallCategoryDistribution.map((cat) => {
              const isSelected = selectedCategoryFilter === cat.category;
              return (
                <button
                  key={cat.category}
                  onClick={() =>
                    setSelectedCategoryFilter(isSelected ? null : cat.category)
                  }
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/50 border-[#007AFF] ring-2 ring-[#007AFF]/20'
                      : 'bg-[#F2F2F7]/50 hover:bg-[#F2F2F7] border-black/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-[10px] font-bold text-[#8E8E93]">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="text-xs font-bold text-[#1C1C1E] capitalize truncate">
                      {cat.category}
                    </div>
                    <div className="text-xs font-semibold text-[#8E8E93] mt-0.5">
                      {cat.count} items ({formatPrice(cat.valueUSD)})
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Category Allocation by Container Matrix */}
          <div className="bg-[#F2F2F7]/40 rounded-2xl border border-black/[0.06] p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
              Container Multi-Category Breakdown
            </h4>

            <div className="space-y-2.5">
              {summary.rankedContainers.map((c) => (
                <div key={c.containerName} className="bg-white rounded-xl p-3 border border-black/[0.04]">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-[#1C1C1E]">{c.containerName}</span>
                    <span className="text-[#8E8E93]">{c.itemCount} items • {formatPrice(c.totalValueUSD)}</span>
                  </div>

                  {/* Multi-color stacked progress bar */}
                  <div className="h-2 rounded-full bg-black/[0.04] overflow-hidden flex">
                    {c.categoryDistribution.map((cat) => (
                      <div
                        key={cat.category}
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                        title={`${cat.category}: ${cat.count} items (${cat.percentage.toFixed(0)}%)`}
                        className="h-full transition-all"
                      />
                    ))}
                  </div>

                  {/* Category labels in container */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {c.categoryDistribution.map((cat) => (
                      <span
                        key={cat.category}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/[0.03] text-[#1C1C1E] flex items-center gap-1"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="capitalize">{cat.category}</span> ({cat.count})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: CONTAINER PHYSICAL WEIGHT & MASS LOADOUT */}
      {(activeTab === 'all' || activeTab === 'weight') && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#007AFF] shrink-0" />
              <h3 className="text-sm font-bold text-[#1C1C1E]">
                Container Physical Weight & Mass Loadout
              </h3>
            </div>
            <span className="text-xs text-[#8E8E93] shrink-0">
              Total Weight: {summary.totalVaultWeightFormatted.display}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.rankedContainers.map((c) => {
              const itemsPct = c.totalWeightGrams > 0 ? (c.itemsWeightGrams / c.totalWeightGrams) * 100 : 0;
              const tarePct = c.totalWeightGrams > 0 ? (c.tareWeightGrams / c.totalWeightGrams) * 100 : 0;

              return (
                <div
                  key={c.containerName}
                  onClick={() => onSelectContainer(c.metaStorage, c.containerName)}
                  className="bg-white rounded-2xl border border-black/[0.08] hover:border-[#007AFF] hover:shadow-md p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 min-w-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[#1C1C1E] truncate" title={c.containerName}>
                          {c.containerName}
                        </h4>
                        <span className="text-[10px] text-[#8E8E93] truncate block mt-0.5" title={c.metaStorage}>
                          {c.metaStorage}
                        </span>
                      </div>

                      <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-[#007AFF] shrink-0 whitespace-nowrap">
                        {c.weightFormatted.display}
                      </span>
                    </div>

                    {/* Weight composition breakdown */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                        <span>Items Payload:</span>
                        <span className="font-bold text-[#1C1C1E]">{Math.round(c.itemsWeightGrams)} g</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                        <span>Container Tare:</span>
                        <span className="font-bold text-[#1C1C1E]">{Math.round(c.tareWeightGrams)} g</span>
                      </div>

                      {/* Weight split visual bar */}
                      <div className="h-2 rounded-full bg-black/[0.04] overflow-hidden flex mt-1">
                        <div
                          style={{ width: `${itemsPct}%` }}
                          title={`Collectible Items: ${itemsPct.toFixed(0)}%`}
                          className="bg-[#007AFF] h-full"
                        />
                        <div
                          style={{ width: `${tarePct}%` }}
                          title={`Container Case Tare: ${tarePct.toFixed(0)}%`}
                          className="bg-slate-300 h-full"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#8E8E93] pt-0.5">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" /> Items ({itemsPct.toFixed(0)}%)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Tare Case ({tarePct.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-xs">
                    <span className="text-[#8E8E93]">Average Item Weight:</span>
                    <span className="font-semibold text-[#1C1C1E]">
                      {c.totalQuantity > 0 ? `${(c.itemsWeightGrams / c.totalQuantity).toFixed(1)} g` : '0 g'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: PRESERVATION & FRAGILITY RISK MATRIX */}
      {(activeTab === 'all' || activeTab === 'fragility') && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <h3 className="text-sm font-bold text-[#1C1C1E]">
                Fragility & Preservation Vulnerability Matrix
              </h3>
            </div>
            <span className="text-xs text-[#8E8E93] shrink-0">
              0 = Indestructible • 100 = Critical Care
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.rankedContainers.map((c) => (
              <div
                key={c.containerName}
                onClick={() => onSelectContainer(c.metaStorage, c.containerName)}
                className="bg-white rounded-2xl border border-black/[0.08] hover:border-[#007AFF] hover:shadow-md p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 min-w-0"
              >
                <div className="space-y-3 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-[#1C1C1E] truncate" title={c.containerName}>
                        {c.containerName}
                      </h4>
                      <span className="text-[10px] text-[#8E8E93] truncate block mt-0.5" title={c.metaStorage}>
                        {c.metaStorage}
                      </span>
                    </div>

                    <div className="shrink-0">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-xl text-white inline-block whitespace-nowrap shadow-2xs"
                        style={{ backgroundColor: c.fragilityColor }}
                      >
                        {c.fragilityLabel} ({c.fragilityScore})
                      </span>
                    </div>
                  </div>

                  {/* Fragility meter */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8E8E93]">Fragility Vulnerability Level:</span>
                      <span className="font-bold text-[#1C1C1E]">{c.fragilityScore} / 100</span>
                    </div>
                    <div className="w-full bg-black/[0.06] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(5, c.fragilityScore)}%`,
                          backgroundColor: c.fragilityColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Item sensitivity breakdown */}
                  <div className="grid grid-cols-4 gap-1 pt-1 text-center">
                    <div className="p-1.5 rounded-lg bg-red-50 text-red-700">
                      <div className="text-[10px] font-semibold">Critical</div>
                      <div className="text-xs font-bold">{c.fragilityBreakdown.critical}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                      <div className="text-[10px] font-semibold">High</div>
                      <div className="text-xs font-bold">{c.fragilityBreakdown.high}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                      <div className="text-[10px] font-semibold">Medium</div>
                      <div className="text-xs font-bold">{c.fragilityBreakdown.medium}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                      <div className="text-[10px] font-semibold">Durable</div>
                      <div className="text-xs font-bold">{c.fragilityBreakdown.low}</div>
                    </div>
                  </div>
                </div>

                {c.fragileItemNames.length > 0 && (
                  <div className="pt-2 border-t border-black/[0.04] text-[11px] text-[#8E8E93] flex items-baseline gap-1 min-w-0">
                    <span className="font-semibold text-amber-700 shrink-0">Delicate Items:</span>
                    <span className="truncate flex-1" title={c.fragileItemNames.join(', ')}>
                      {c.fragileItemNames.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Pick Location Jump Footer */}
      <div className="pt-4 border-t border-black/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
            Quick Jump to Storage Locations
          </span>
          <span className="text-xs text-[#8E8E93]">
            {Object.keys(storageUnits).length || 5} Available units
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {summary.rankedContainers.map((c) => (
            <button
              key={`${c.metaStorage}:::${c.containerName}`}
              onClick={() => onSelectContainer(c.metaStorage, c.containerName)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2F2F7] hover:bg-[#007AFF] hover:text-white text-[#1C1C1E] text-xs font-semibold transition-all shadow-xs"
            >
              <Box className="w-3.5 h-3.5 opacity-70" />
              <span>{c.containerName}</span>
              <span className="opacity-60 text-[10px]">({c.itemCount})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
