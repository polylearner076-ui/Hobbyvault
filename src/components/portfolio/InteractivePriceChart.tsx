import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useVault } from '../../context/VaultContext';
import { PriceHistoryPoint, TimeRange } from '../../types';

interface InteractivePriceChartProps {
  customHistory?: PriceHistoryPoint[];
  customCostUSD?: number;
  height?: number;
  showTimeRangeSelector?: boolean;
}

export const InteractivePriceChart: React.FC<InteractivePriceChartProps> = ({
  customHistory,
  customCostUSD,
  height = 240,
  showTimeRangeSelector = true,
}) => {
  const {
    portfolioHistory,
    totalCostUSD,
    timeRange,
    setTimeRange,
    formatPrice,
    convertPrice,
    currencySymbol,
  } = useVault();

  const rawData = customHistory || portfolioHistory;
  const costUSD = customCostUSD !== undefined ? customCostUSD : totalCostUSD;

  // Convert raw USD data into active currency with deduplication and timezone safety
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const map = new Map<string, number>();
    rawData.forEach((pt) => {
      if (pt && pt.date && typeof pt.priceUSD === 'number') {
        map.set(pt.date, pt.priceUSD);
      }
    });

    const sortedEntries = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    return sortedEntries.map(([date, priceUSD]) => {
      // Parse YYYY-MM-DD cleanly to avoid timezone shifting
      const parts = date.split('-');
      let displayDate = date;
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        displayDate = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }

      return {
        date,
        displayDate,
        value: convertPrice(priceUSD),
        priceUSD,
      };
    });
  }, [rawData, convertPrice]);

  const convertedCost = convertPrice(costUSD);

  const isPositive = useMemo(() => {
    if (chartData.length < 2) return true;
    return chartData[chartData.length - 1].value >= chartData[0].value;
  }, [chartData]);

  const strokeColor = isPositive ? '#34C759' : '#FF3B30'; // Apple Mint Green vs Apple Red
  const gradientId = `chartGradient-${isPositive ? 'green' : 'red'}-${Math.random().toString(36).substring(2, 6)}`;

  const ranges: TimeRange[] = ['7D', '1M', '3M', '6M', '1Y', 'ALL'];

  if (chartData.length === 0) {
    return (
      <div className="w-full flex items-center justify-center h-48 bg-[#F2F2F7] rounded-2xl border border-black/[0.06] text-[#8E8E93] text-xs font-medium">
        No price history recorded yet
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Time Range Pills */}
      {showTimeRangeSelector && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-[11px] sm:text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
            Portfolio Value Trend
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 bg-black/[0.04] p-0.5 sm:p-1 rounded-xl border border-black/[0.06] overflow-x-auto no-scrollbar self-start sm:self-auto max-w-full">
            {ranges.map((r) => (
              <button
                key={r}
                id={`btn-timerange-${r}`}
                onClick={() => setTimeRange(r)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  timeRange === r
                    ? 'bg-white text-[#1C1C1E] shadow-2xs'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.04]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="displayDate"
              stroke="#8E8E93"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={5}
              minTickGap={32}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#8E8E93"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${currencySymbol}${val > 999 ? (val / 1000).toFixed(1) + 'k' : val.toFixed(0)}`}
              domain={['dataMin * 0.95', 'dataMax * 1.05']}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dataPoint = payload[0].payload;
                  const firstPoint = chartData[0];
                  const diff = dataPoint.value - firstPoint.value;
                  const diffPct = firstPoint.value > 0 ? (diff / firstPoint.value) * 100 : 0;
                  const isUp = diff >= 0;

                  return (
                    <div className="rounded-xl bg-white/95 border border-black/[0.08] p-3 shadow-xl backdrop-blur-md text-xs">
                      <div className="text-[#8E8E93] font-medium">{dataPoint.date}</div>
                      <div className="text-base font-bold text-[#1C1C1E] mt-0.5 font-mono">
                        {formatPrice(dataPoint.priceUSD)}
                      </div>
                      <div className={`flex items-center gap-1 font-semibold text-[11px] mt-1 ${isUp ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                        <span>{isUp ? '+' : ''}{diffPct.toFixed(2)}%</span>
                        <span className="text-[#8E8E93] font-normal">in this period</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {convertedCost > 0 && (
              <ReferenceLine
                y={convertedCost}
                stroke="#AEAEB2"
                strokeDasharray="3 3"
                label={{
                  value: 'Avg Cost Basis',
                  fill: '#8E8E93',
                  fontSize: 10,
                  position: 'insideBottomRight',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
