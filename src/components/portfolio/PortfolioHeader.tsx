import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { InteractivePriceChart } from './InteractivePriceChart';

export const PortfolioHeader: React.FC = () => {
  const {
    activeSandbox,
    totalValueUSD,
    totalCostUSD,
    totalGainLossUSD,
    totalGainLossPercent,
    change24hUSD,
    change24hPercent,
    timeRange,
    setTimeRange,
    periodPerformance,
    formatPrice,
    filteredItems,
    isSyncing,
    lastSyncTime,
    isAutoSyncEnabled,
    nextSyncCountdown,
    syncPrices,
  } = useVault();

  const [showChart, setShowChart] = useState(true);

  const isAllTimeGainPositive = totalGainLossUSD >= 0;
  const is24hPositive = change24hUSD >= 0;
  const isPeriodPositive = periodPerformance.isPositive;

  const totalQuantity = filteredItems.reduce((acc, i) => acc + i.quantity, 0);

  const timeRangeLabel = timeRange === 'ALL' ? 'All-Time' : timeRange;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
      <div className="rounded-3xl bg-white border border-black/[0.06] p-5 sm:p-7 shadow-sm relative overflow-hidden">
        {/* Subtle Ambient Accent */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{
            backgroundColor: activeSandbox ? activeSandbox.themeColor : '#007AFF',
          }}
        />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Top Label & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: activeSandbox ? activeSandbox.themeColor : '#007AFF',
                }}
              />
              <span className="text-xs uppercase tracking-widest font-bold text-[#8E8E93]">
                {activeSandbox ? `${activeSandbox.name} Vault` : 'All Sandboxes Portfolio'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-black/[0.05] text-[#8E8E93] font-mono font-medium">
                {totalQuantity} {totalQuantity === 1 ? 'Asset' : 'Assets'}
              </span>

              {/* Real-Time Live Sync Telemetry Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  {isAutoSyncEnabled && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isAutoSyncEnabled ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                </span>
                <span>
                  {isSyncing
                    ? 'Updating prices...'
                    : isAutoSyncEnabled
                    ? `Live Feeds • Next in ${nextSyncCountdown}s`
                    : `Updated ${lastSyncTime || 'now'}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => syncPrices(true)}
                disabled={isSyncing}
                title="Fetch latest verified market prices from TCGPlayer & Scryfall"
                className="flex items-center gap-1.5 text-xs text-[#1C1C1E] hover:text-black px-2.5 py-1 rounded-xl bg-black/[0.04] hover:bg-black/[0.07] border border-black/[0.06] transition-all font-medium active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              <button
                onClick={() => setShowChart(!showChart)}
                className="flex items-center gap-1.5 text-xs text-[#1C1C1E] hover:text-black px-3 py-1 rounded-xl bg-black/[0.04] hover:bg-black/[0.07] border border-black/[0.06] transition-colors font-medium cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-[#007AFF]" />
                <span>{showChart ? 'Hide Trend Chart' : 'Show Trend Chart'}</span>
              </button>
            </div>
          </div>

          {/* Large Valuation Typography */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1C1C1E] font-mono">
                {formatPrice(totalValueUSD)}
              </div>

              {/* Profit / Loss & 24H Delta Badges */}
              <div className="flex flex-wrap items-center gap-2.5 mt-3">
                {/* Dynamic Period Performance Badge (Synchronized with 7D, 1M, 3M, 6M, 1Y, ALL) */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    isPeriodPositive
                      ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20'
                      : 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20'
                  }`}
                >
                  {isPeriodPositive ? (
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>
                    {timeRangeLabel} Return: {isPeriodPositive ? '+' : ''}
                    {formatPrice(periodPerformance.changeUSD)} ({isPeriodPositive ? '+' : ''}
                    {periodPerformance.changePercent.toFixed(2)}%)
                  </span>
                </div>

                {/* 24H Change */}
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                    is24hPositive
                      ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20'
                      : 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20'
                  }`}
                >
                  <span>
                    {is24hPositive ? '+' : ''}
                    {formatPrice(change24hUSD)} ({is24hPositive ? '+' : ''}
                    {change24hPercent.toFixed(2)}%) 24h
                  </span>
                </div>

                {/* All-Time Lifetime Profit (vs Purchase Cost Basis) */}
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                    isAllTimeGainPositive
                      ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20'
                      : 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20'
                  }`}
                >
                  <span>
                    All-Time Profit: {isAllTimeGainPositive ? '+' : ''}
                    {formatPrice(totalGainLossUSD)} ({isAllTimeGainPositive ? '+' : ''}
                    {totalGainLossPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Summary Pill Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-[#F2F2F7] p-3 rounded-2xl border border-black/[0.04]">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#8E8E93]">Total Cost</span>
                <span className="text-xs font-bold text-[#1C1C1E] font-mono">
                  {formatPrice(totalCostUSD)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#8E8E93]">{timeRangeLabel} Return</span>
                <span
                  className={`text-xs font-bold font-mono ${
                    isPeriodPositive ? 'text-[#34C759]' : 'text-[#FF3B30]'
                  }`}
                >
                  {isPeriodPositive ? '+' : ''}
                  {periodPerformance.changePercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-col col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-[#8E8E93]">Tracked Market</span>
                <span className="text-xs font-bold text-[#007AFF] truncate">
                  Live API Comps
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Trend Chart */}
          {showChart && (
            <div className="pt-2">
              <InteractivePriceChart height={220} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
