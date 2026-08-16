import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { queryMetaAgent } from '../../services/api';
import { AgentQueryResult } from '../../types';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  TrendingUp,
  TrendingDown,
  Box,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface OmniAgentModalProps {
  onClose: () => void;
}

export const OmniAgentModal: React.FC<OmniAgentModalProps> = ({ onClose }) => {
  const {
    items,
    storageUnits,
    currency,
    formatPrice,
    setAgentActiveFilter,
    clearAgentActiveFilter,
    agentActiveFilter,
    setActiveView,
    setStorageFocusLocation,
    startAgentBackgroundTask,
    openAgentResultWindow,
  } = useVault();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [showExtendedBreakdown, setShowExtendedBreakdown] = useState(false);

  const availableModels = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'Latest • Fast' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', badge: 'Deep Reasoning' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'Stable' },
  ];

  const sampleQueries = [
    'Total TCG portfolio value excluding toys and Beyblades',
    'Show my top 5 most valuable PSA 10 slabs',
    'What items are stored in Master Safe & Deposit Box?',
    'Unrealized profit across all One Piece and Pokémon cards',
    'Physical storage breakdown and top valuable assets',
  ];

  const handleQuery = async (queryText?: string) => {
    const q = (queryText || prompt).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    if (queryText) setPrompt(queryText);

    try {
      const data = await queryMetaAgent({
        prompt: q,
        vaultItems: items,
        storageUnits,
        currency,
        model: selectedModel,
      });

      if (data) {
        setResult(data);
      } else {
        setError('Agent analysis returned an empty result.');
      }
    } catch (err: any) {
      console.error('OmniAgent query error:', err);
      setError(err.message || 'Failed to query meta-agent.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunInBackground = async (queryText?: string) => {
    const q = (queryText || prompt).trim();
    if (!q) return;
    await startAgentBackgroundTask(q, selectedModel);
    onClose();
  };

  const handleOpenInNewWindow = () => {
    if (!result) return;
    openAgentResultWindow(prompt || 'Agent Query', result);
    onClose();
  };

  const handleApplyFilter = () => {
    if (!result) return;
    setAgentActiveFilter({
      id: `filter_${Date.now()}`,
      query: prompt || 'Meta-Agent Query',
      title: result.directAnswerSummary || prompt,
      matchedItemIds: result.matchedItemIds || [],
      matchedCount: result.matchedItemIds?.length || 0,
      totalValueUSD: result.aggregatedMetrics?.totalValueUSD || 0,
      active: true,
    });
    onClose();
  };

  const handleGoToStorage = (loc: { metaStorage: string; container?: string }) => {
    setStorageFocusLocation({ meta: loc.metaStorage, container: loc.container });
    setActiveView('storage');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        id="omni-agent-modal"
        className="relative w-full max-w-2xl rounded-3xl bg-white border border-black/[0.08] shadow-2xl overflow-hidden flex flex-col my-auto text-[#1C1C1E] max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] bg-gradient-to-r from-[#007AFF]/10 via-indigo-50/50 to-purple-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#007AFF] text-white flex items-center justify-center shadow-sm shadow-[#007AFF]/30 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1C1C1E]">
                  Omni-Vault & Storage Meta-Agent
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E93]">
                Cross-references digital portfolio valuations and physical storage security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <div className="relative flex items-center">
              <select
                id="omni-agent-model-selector"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="appearance-none text-[11px] font-medium bg-white/90 hover:bg-white text-[#1C1C1E] border border-black/[0.08] rounded-xl pl-2.5 pr-7 py-1.5 shadow-2xs focus:outline-none focus:border-[#007AFF] cursor-pointer"
                title="Select AI Agent Model"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.badge})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#8E8E93] absolute right-2 pointer-events-none" />
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/80 hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Query Input Section */}
        <div className="p-4 sm:p-6 space-y-3 border-b border-black/[0.06] bg-[#F9F9FB]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuery();
            }}
            className="relative flex items-center"
          >
            <input
              id="omni-agent-query-input"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything: 'Total TCG value excluding toys', 'Top PSA 10 slabs in Safe'..."
              className="w-full pl-4 pr-24 py-3 bg-white border border-black/[0.1] rounded-2xl text-xs sm:text-sm text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] shadow-sm transition-all"
              autoFocus
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                id="btn-agent-run-background"
                onClick={() => handleRunInBackground()}
                disabled={loading || !prompt.trim()}
                title="Run agent in background & open in a new window tab when completed"
                className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] disabled:opacity-40 transition-all border border-purple-200/60 shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3 h-3 text-purple-600" />
                <span className="hidden sm:inline">Background</span>
              </button>

              <button
                type="submit"
                id="btn-agent-submit"
                disabled={loading || !prompt.trim()}
                className="p-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] disabled:opacity-40 text-white transition-all shadow-sm cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>

          {/* Quick Preset Queries */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] uppercase font-bold text-[#8E8E93] shrink-0 mr-1">
              Suggestions:
            </span>
            {sampleQueries.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuery(sq)}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-black/[0.04] text-[#1C1C1E] border border-black/[0.06] whitespace-nowrap shadow-2xs transition-colors cursor-pointer shrink-0 font-medium"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Body Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-xs">
              <span className="font-semibold">Query Error:</span> {error}
            </div>
          )}

          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-[#1C1C1E]">
                Analyzing {items.length} vault assets and {storageUnits.length} physical storage units...
              </p>
              <span className="text-[11px] text-[#8E8E93]">
                Synthesizing valuation aggregation and physical cross-referencing
              </span>
              <button
                type="button"
                onClick={() => handleRunInBackground()}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <Zap className="w-3.5 h-3.5" />
                Continue in Background & Close
              </button>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Primary Direct Agent Answer Banner */}
              <div className="p-5 rounded-2xl bg-[#007AFF]/5 border border-[#007AFF]/20 text-[#1C1C1E] shadow-2xs">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#007AFF] shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#007AFF]">
                        Agent Response
                      </h4>
                      <span className="text-[10px] font-mono text-[#8E8E93]">
                        {selectedModel}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-semibold leading-relaxed text-[#1C1C1E]">
                      {result.directAnswerSummary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Optional Supplementary Data Toggle */}
              {result.aggregatedMetrics && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowExtendedBreakdown(!showExtendedBreakdown)}
                    className="flex items-center justify-between w-full py-2 px-3 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl text-left text-xs font-semibold text-[#1C1C1E] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#007AFF]" />
                      {showExtendedBreakdown ? 'Hide Detailed Breakdown' : 'View Detailed Financial & Storage Breakdown'}
                    </span>
                    {showExtendedBreakdown ? <ChevronUp className="w-3.5 h-3.5 text-[#8E8E93]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93]" />}
                  </button>

                  {showExtendedBreakdown && (
                    <div className="space-y-4 mt-3 animate-in fade-in duration-150">
                      {/* Aggregated Key Metrics Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 bg-[#F2F2F7] rounded-2xl border border-black/[0.04]">
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase block">
                            Matched Total Value
                          </span>
                          <span className="text-base font-bold text-[#1C1C1E] font-mono">
                            {formatPrice(result.aggregatedMetrics.totalValueUSD)}
                          </span>
                        </div>

                        <div className="p-3 bg-[#F2F2F7] rounded-2xl border border-black/[0.04]">
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase block">
                            Cost Basis
                          </span>
                          <span className="text-base font-bold text-[#1C1C1E] font-mono">
                            {formatPrice(result.aggregatedMetrics.totalCostUSD)}
                          </span>
                        </div>

                        <div className="p-3 bg-[#F2F2F7] rounded-2xl border border-black/[0.04]">
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase block">
                            Unrealized Gain / Loss
                          </span>
                          <div className="flex items-center gap-1">
                            {result.aggregatedMetrics.totalGainUSD >= 0 ? (
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                            )}
                            <span
                              className={`text-sm font-bold font-mono ${
                                result.aggregatedMetrics.totalGainUSD >= 0 ? 'text-emerald-600' : 'text-red-500'
                              }`}
                            >
                              {formatPrice(result.aggregatedMetrics.totalGainUSD)} (
                              {result.aggregatedMetrics.gainPercent >= 0 ? '+' : ''}
                              {result.aggregatedMetrics.gainPercent}%)
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-[#F2F2F7] rounded-2xl border border-black/[0.04]">
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase block">
                            Matched Items / Copies
                          </span>
                          <span className="text-base font-bold text-[#1C1C1E] font-mono">
                            {result.aggregatedMetrics.itemCount} items ({result.aggregatedMetrics.copyCount} copies)
                          </span>
                        </div>
                      </div>

                      {/* Top Matched Assets */}
                      {result.aggregatedMetrics?.topAssets && result.aggregatedMetrics.topAssets.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-[#007AFF]" />
                              Top Assets Highlighted
                            </span>
                            <span className="text-[11px] text-[#8E8E93]">
                              Ranked by current valuation
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {result.aggregatedMetrics.topAssets.map((asset, idx) => (
                              <div
                                key={asset.id || idx}
                                className="flex items-center justify-between p-2.5 bg-white border border-black/[0.06] rounded-2xl hover:border-black/[0.12] transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-5 h-5 rounded-full bg-black/[0.05] text-[#8E8E93] font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-[#1C1C1E] truncate block">
                                      {asset.name}
                                    </span>
                                    <div className="flex items-center gap-2 text-[10px] text-[#8E8E93]">
                                      <span className="px-1.5 py-0.2 rounded bg-black/[0.04] font-medium">
                                        {asset.condition}
                                      </span>
                                      <span className="truncate">📍 {asset.locationStr}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-xs font-bold text-[#1C1C1E] font-mono block">
                                    {formatPrice(asset.valueUSD)}
                                  </span>
                                  {asset.gainUSD !== undefined && (
                                    <span
                                      className={`text-[10px] font-mono ${
                                        asset.gainUSD >= 0 ? 'text-emerald-600' : 'text-red-500'
                                      }`}
                                    >
                                      {asset.gainUSD >= 0 ? '+' : ''}
                                      {formatPrice(asset.gainUSD)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Physical Storage Distribution */}
                      {result.aggregatedMetrics?.storageBreakdown && result.aggregatedMetrics.storageBreakdown.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5 text-emerald-600" />
                            Physical Storage Distribution
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {result.aggregatedMetrics.storageBreakdown.map((storage, idx) => (
                              <div
                                key={idx}
                                onClick={() => handleGoToStorage({ metaStorage: storage.location, container: storage.container })}
                                className="p-2.5 bg-white border border-black/[0.06] rounded-2xl hover:border-[#007AFF] transition-all cursor-pointer group"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-[#1C1C1E] group-hover:text-[#007AFF] truncate">
                                    {storage.location}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-[#1C1C1E]">
                                    {formatPrice(storage.valueUSD)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-[#8E8E93]">
                                  <span className="truncate">{storage.container}</span>
                                  <span>{storage.count} items ({storage.percentage}%)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!loading && !result && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-[#8E8E93]">
              <div className="w-12 h-12 rounded-2xl bg-black/[0.04] flex items-center justify-center text-[#8E8E93] mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-[#1C1C1E]">
                Omni-Vault Intelligence Ready
              </p>
              <p className="text-[11px] max-w-sm">
                Ask any calculation, category grouping, or physical storage question. The agent understands both digital inventory and real-world physical locations.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-black/[0.06] bg-[#F9F9FB]">
          <div>
            {agentActiveFilter && (
              <button
                type="button"
                onClick={() => {
                  clearAgentActiveFilter();
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Active Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer"
            >
              Close
            </button>
            {result && (
              <button
                type="button"
                id="btn-open-agent-result-window"
                onClick={handleOpenInNewWindow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in New Window Tab
              </button>
            )}
            {result && result.matchedItemIds && result.matchedItemIds.length > 0 && (
              <button
                type="button"
                onClick={handleApplyFilter}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                Filter ({result.matchedItemIds.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
