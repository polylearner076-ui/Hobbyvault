import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Activity,
  Layers,
} from 'lucide-react';
import { InteractivePriceChart } from './InteractivePriceChart';

export const PortfolioHeader: React.FC = () => {
  const {
    activeSandbox,
    activeSandboxId,
    totalValueUSD,
    totalCostUSD,
    totalGainLossUSD,
    totalGainLossPercent,
    change24hUSD,
    change24hPercent,
    change30dUSD,
    change30dPercent,
    formatPrice,
    filteredItems,
    items,
  } = useVault();

  const [showChart, setShowChart] = useState(true);

  const isGainPositive = totalGainLossUSD >= 0;
  const is24hPositive = change24hUSD >= 0;

  const totalQuantity = filteredItems.reduce((acc, i) => acc + i.quantity, 0);

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
            <div className="flex items-center gap-2">
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
            </div>

            <button
              onClick={() => setShowChart(!showChart)}
              className="flex items-center gap-1.5 text-xs text-[#1C1C1E] hover:text-black px-3 py-1 rounded-xl bg-black/[0.04] hover:bg-black/[0.07] border border-black/[0.06] transition-colors font-medium"
            >
              <Activity className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>{showChart ? 'Hide Trend Chart' : 'Show Trend Chart'}</span>
            </button>
          </div>

          {/* Large Valuation Typography */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1C1C1E] font-mono">
                {formatPrice(totalValueUSD)}
              </div>

              {/* Profit / Loss & 24H Delta Badges */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {/* 24H Change */}
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                    is24hPositive
                      ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20'
                      : 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20'
                  }`}
                >
                  {is24hPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {is24hPositive ? '+' : ''}
                    {formatPrice(change24hUSD)} ({is24hPositive ? '+' : ''}
                    {change24hPercent.toFixed(2)}%) 24h
                  </span>
                </div>

                {/* Total Unrealized Gain */}
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                    isGainPositive
                      ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20'
                      : 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20'
                  }`}
                >
                  <span>
                    Total Profit: {isGainPositive ? '+' : ''}
                    {formatPrice(totalGainLossUSD)} ({isGainPositive ? '+' : ''}
                    {totalGainLossPercent.toFixed(1)}%)
                  </span>
                </div>

                {/* 30D Change */}
                <div className="text-xs text-[#8E8E93] font-medium hidden sm:inline">
                  30D Move: {change30dUSD >= 0 ? '+' : ''}
                  {formatPrice(change30dUSD)} ({change30dUSD >= 0 ? '+' : ''}
                  {change30dPercent.toFixed(1)}%)
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
                <span className="text-[10px] uppercase font-bold text-[#8E8E93]">Avg Return</span>
                <span
                  className={`text-xs font-bold font-mono ${
                    isGainPositive ? 'text-[#34C759]' : 'text-[#FF3B30]'
                  }`}
                >
                  {isGainPositive ? '+' : ''}
                  {totalGainLossPercent.toFixed(1)}%
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
