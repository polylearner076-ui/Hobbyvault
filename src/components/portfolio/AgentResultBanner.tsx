import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { Sparkles, X, ChevronDown, ChevronUp, Layers, TrendingUp, TrendingDown, Box, ShieldCheck } from 'lucide-react';

export const AgentResultBanner: React.FC = () => {
  const { activeSandboxId, sandboxes, deleteSandbox, setActiveSandboxId, formatPrice } = useVault();
  const [showDetails, setShowDetails] = useState(false);

  const currentSandbox = sandboxes.find((s) => s.id === activeSandboxId);

  if (!currentSandbox || !currentSandbox.isAgentResult || !currentSandbox.agentResult) {
    return null;
  }

  const result = currentSandbox.agentResult;
  const metrics = result.aggregatedMetrics;

  return (
    <div className="mb-6 rounded-3xl bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-white border border-purple-200/60 p-4 sm:p-6 shadow-sm text-[#1C1C1E] animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-sm shadow-purple-600/30 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold tracking-wider uppercase">
                AI Agent Window
              </span>
              {currentSandbox.agentQuery && (
                <span className="text-xs font-semibold text-[#8E8E93] truncate">
                  Query: "{currentSandbox.agentQuery}"
                </span>
              )}
            </div>

            <p className="text-sm sm:text-base font-bold leading-snug text-[#1C1C1E]">
              {result.directAnswerSummary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-black/[0.04] text-[#1C1C1E] text-xs font-semibold border border-black/[0.08] shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">{showDetails ? 'Hide Metrics' : 'View Metrics'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={async () => {
              setActiveSandboxId('all');
              await deleteSandbox(currentSandbox.id);
            }}
            title="Close this Agent Window"
            className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-[#8E8E93] hover:text-red-600 border border-black/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Agent Metrics Breakdown */}
      {showDetails && metrics && (
        <div className="mt-4 pt-4 border-t border-black/[0.06] space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-white rounded-2xl border border-black/[0.06] shadow-2xs">
              <span className="text-[10px] font-bold text-[#8E8E93] uppercase block">
                Total Valuation
              </span>
              <span className="text-sm sm:text-base font-bold text-[#1C1C1E] font-mono">
                {formatPrice(metrics.totalValueUSD)}
              </span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-black/[0.06] shadow-2xs">
              <span className="text-[10px] font-bold text-[#8E8E93] uppercase block">
                Cost Basis
              </span>
              <span className="text-sm sm:text-base font-bold text-[#1C1C1E] font-mono">
                {formatPrice(metrics.totalCostUSD)}
              </span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-black/[0.06] shadow-2xs">
              <span className="text-[10px] font-bold text-[#8E8E93] uppercase block">
                Unrealized Gain / Loss
              </span>
              <div className="flex items-center gap-1">
                {metrics.totalGainUSD >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                )}
                <span
                  className={`text-xs sm:text-sm font-bold font-mono ${
                    metrics.totalGainUSD >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {formatPrice(metrics.totalGainUSD)} ({metrics.gainPercent >= 0 ? '+' : ''}
                  {metrics.gainPercent}%)
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-black/[0.06] shadow-2xs">
              <span className="text-[10px] font-bold text-[#8E8E93] uppercase block">
                Items / Copies Matched
              </span>
              <span className="text-sm sm:text-base font-bold text-[#1C1C1E] font-mono">
                {metrics.itemCount} items ({metrics.copyCount} copies)
              </span>
            </div>
          </div>

          {result.reasoningSteps && result.reasoningSteps.length > 0 && (
            <div className="p-3 bg-white rounded-2xl border border-black/[0.06] shadow-2xs text-xs space-y-1">
              <span className="font-bold text-[11px] text-purple-700 block uppercase tracking-wider">
                RAG Pipeline Reasoning Steps:
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-[#3A3A3C]">
                {result.reasoningSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
