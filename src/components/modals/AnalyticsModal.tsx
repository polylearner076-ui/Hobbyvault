import React, { useState, useEffect, useMemo } from 'react';
import { useVault } from '../../context/VaultContext';
import { fetchMarketInsights } from '../../services/api';
import {
  X,
  PieChart as PieChartIcon,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AnalyticsModalProps {
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ onClose }) => {
  const { items, sandboxes, formatPrice, totalValueUSD, totalGainLossUSD, totalCostUSD } = useVault();

  const [aiInsights, setAiInsights] = useState<any | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Compute allocation per Sandbox
  const allocationData = useMemo(() => {
    const map: Record<string, { name: string; valueUSD: number; color: string; count: number }> = {};

    sandboxes.forEach((sb) => {
      map[sb.id] = { name: sb.name, valueUSD: 0, color: sb.themeColor, count: 0 };
    });

    items.forEach((item) => {
      const match = map[item.sandboxId];
      if (match) {
        match.valueUSD += item.currentPriceUSD * item.quantity;
        match.count += item.quantity;
      }
    });

    return Object.values(map).filter((item) => item.valueUSD > 0);
  }, [items, sandboxes]);

  // Top gainers
  const topGainers = useMemo(() => {
    return [...items]
      .sort((a, b) => {
        const gainA = (a.currentPriceUSD - a.purchasePriceUSD) * a.quantity;
        const gainB = (b.currentPriceUSD - b.purchasePriceUSD) * b.quantity;
        return gainB - gainA;
      })
      .slice(0, 4);
  }, [items]);

  // Fetch AI Market Analysis
  const handleLoadInsights = async () => {
    try {
      setLoadingInsights(true);
      const data = await fetchMarketInsights(items, sandboxes);
      if (data) {
        setAiInsights(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    handleLoadInsights();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/30 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div
        id="analytics-modal"
        className="relative w-full max-w-3xl rounded-3xl bg-white border border-black/[0.08] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-[#1C1C1E]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] bg-[#F2F2F7]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#007AFF]/10 text-[#007AFF]">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-[#1C1C1E] tracking-wide">
              Portfolio Intelligence & Allocation
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#F2F2F7] border border-black/[0.06]">
              <div className="text-[10px] uppercase font-bold text-[#8E8E93]">Total Net Worth</div>
              <div className="text-xl font-extrabold text-[#1C1C1E] font-mono mt-1">
                {formatPrice(totalValueUSD)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F2F2F7] border border-black/[0.06]">
              <div className="text-[10px] uppercase font-bold text-[#8E8E93]">Unrealized Gain</div>
              <div
                className={`text-xl font-extrabold font-mono mt-1 ${
                  totalGainLossUSD >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'
                }`}
              >
                {totalGainLossUSD >= 0 ? '+' : ''}
                {formatPrice(totalGainLossUSD)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F2F2F7] border border-black/[0.06]">
              <div className="text-[10px] uppercase font-bold text-[#8E8E93]">Portfolio ROI</div>
              <div className="text-xl font-extrabold text-[#007AFF] font-mono mt-1">
                {totalCostUSD > 0 ? `${(((totalValueUSD - totalCostUSD) / totalCostUSD) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
          </div>

          {/* Allocation by Hobby Sandbox */}
          <div className="p-5 rounded-2xl bg-[#F2F2F7] border border-black/[0.06] space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
              Vault Allocation Breakdown
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Donut Chart */}
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      dataKey="valueUSD"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => formatPrice(Number(val))}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: 'rgba(0,0,0,0.08)',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        color: '#1C1C1E',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="space-y-2">
                {allocationData.map((item, idx) => {
                  const pct = totalValueUSD > 0 ? (item.valueUSD / totalValueUSD) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-black/[0.06] shadow-sm">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-[#1C1C1E] truncate">{item.name}</span>
                        <span className="text-[10px] text-[#8E8E93]">({item.count})</span>
                      </div>
                      <div className="text-right font-mono font-bold text-[#1C1C1E] shrink-0">
                        {pct.toFixed(1)}% <span className="text-[#8E8E93] font-normal text-[10px]">({formatPrice(item.valueUSD)})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Market Insights Report */}
          <div className="p-5 rounded-2xl bg-[#F2F2F7] border border-black/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#007AFF] font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>AI Collector Intelligence Report</span>
              </div>
              <button
                onClick={handleLoadInsights}
                disabled={loadingInsights}
                className="text-[#8E8E93] hover:text-[#1C1C1E] p-1 transition-colors cursor-pointer"
                title="Refresh Insights"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingInsights ? (
              <div className="py-6 flex items-center justify-center gap-2 text-[#8E8E93]">
                <RefreshCw className="w-4 h-4 animate-spin text-[#007AFF]" />
                <span>Generating valuation report with Gemini 3.7 Flash...</span>
              </div>
            ) : aiInsights ? (
              <div className="space-y-3">
                <p className="text-[#1C1C1E] text-xs leading-relaxed">{aiInsights.summary}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-3 rounded-xl bg-white border border-black/[0.06] shadow-sm">
                    <div className="text-[10px] font-bold uppercase text-[#34C759] mb-1">
                      Key Growth Drivers
                    </div>
                    <ul className="space-y-1 text-[#1C1C1E] list-disc list-inside">
                      {aiInsights.growthDrivers?.map((driver: string, i: number) => (
                        <li key={i} className="line-clamp-1">{driver}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-black/[0.06] shadow-sm">
                    <div className="text-[10px] font-bold uppercase text-[#007AFF] mb-1">
                      Collecting Recommendations
                    </div>
                    <ul className="space-y-1 text-[#1C1C1E] list-disc list-inside">
                      {aiInsights.recommendations?.map((rec: string, i: number) => (
                        <li key={i} className="line-clamp-1">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-[#8E8E93]">
                  <span>Sentiment: <strong className="text-[#1C1C1E]">{aiInsights.sentiment || 'Bullish'}</strong></span>
                  <span>Projected Yield: <strong className="text-[#34C759]">{aiInsights.projectedAnnualYield || '+14%'}</strong></span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Top Asset Gainers */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
              Top Value Drivers in Collection
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {topGainers.map((item) => {
                const totalVal = item.currentPriceUSD * item.quantity;
                const totalCost = item.purchasePriceUSD * item.quantity;
                const gain = totalVal - totalCost;
                const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#F2F2F7] border border-black/[0.06]"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 object-contain rounded-lg bg-white p-0.5 border border-black/[0.06]"
                      />
                      <div className="truncate">
                        <div className="font-bold text-[#1C1C1E] truncate">{item.name}</div>
                        <div className="text-[10px] text-[#8E8E93]">{item.condition.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-[#1C1C1E]">{formatPrice(totalVal)}</div>
                      <div className={`text-[10px] font-mono font-bold ${gain >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                        {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
