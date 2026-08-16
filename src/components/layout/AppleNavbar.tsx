import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { useAuth } from '../../context/AuthContext';
import {
  RefreshCw,
  ScanLine,
  Plus,
  BarChart3,
  Download,
  Upload,
  RotateCcw,
  Check,
  ChevronDown,
  Layers,
  Activity,
  LogIn,
  Radio,
  Box,
  Sparkles,
} from 'lucide-react';
import { CurrencyCode } from '../../types';
import { CURRENCIES } from '../../data/initialData';
import { UserMenu } from './UserMenu';

interface AppleNavbarProps {
  onOpenAddModal: () => void;
  onOpenScanModal: () => void;
  onOpenAnalyticsModal: () => void;
  onOpenAgentModal?: () => void;
  onOpenStorageModal: () => void;
  onOpenNewSandboxModal: () => void;
  onOpenDiagnosticsModal: () => void;
  onOpenAuthModal: (mode: 'signin' | 'register') => void;
}

export const AppleNavbar: React.FC<AppleNavbarProps> = ({
  onOpenAddModal,
  onOpenScanModal,
  onOpenAnalyticsModal,
  onOpenAgentModal,
  onOpenStorageModal,
  onOpenDiagnosticsModal,
  onOpenAuthModal,
}) => {
  const {
    activeView,
    setActiveView,
    currency,
    setCurrency,
    syncPrices,
    isSyncing,
    lastSyncTime,
    isAutoSyncEnabled,
    setIsAutoSyncEnabled,
    autoSyncIntervalSeconds,
    setAutoSyncIntervalSeconds,
    nextSyncCountdown,
    exportJSON,
    importJSON,
    resetToDefaults,
  } = useVault();

  const { activeUserId } = useAuth();
  const isLoggedIn = !!activeUserId;

  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showSyncDropdown, setShowSyncDropdown] = useState(false);

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const success = importJSON(content);
          if (success) {
            alert('Vault data imported successfully!');
          } else {
            alert('Invalid backup file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleReset = async () => {
    if (window.confirm('Reset all sandboxes and portfolio data in your Firestore vault to initial state?')) {
      await resetToDefaults();
    }
  };

  return (
    <header
      id="apple-navbar"
      className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 border-b border-black/[0.06] text-[#1C1C1E] transition-all"
    >
      {/* Click-away backdrop overlay for dropdowns in navbar */}
      {(showCurrencyDropdown || showSyncDropdown) && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => {
            setShowCurrencyDropdown(false);
            setShowSyncDropdown(false);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1 sm:gap-4 relative z-40">
        {/* Left: App Logo & Microservice View Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
          <button
            onClick={() => setActiveView('portfolio')}
            className="flex items-center gap-1.5 sm:gap-2 text-left cursor-pointer focus:outline-none shrink-0"
          >
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#007AFF] via-indigo-500 to-sky-400 p-[1px] shadow-sm flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] sm:rounded-[11px] flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#007AFF]" />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tracking-tight text-sm sm:text-base text-[#1C1C1E] whitespace-nowrap">
                  Collector<span className="text-[#007AFF] font-bold">Vault</span>
                </span>
                <span className="hidden md:inline text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                  Pro
                </span>
              </div>
            </div>
          </button>

          {/* Microservice View Switcher: Single unified toggle */}
          {isLoggedIn ? (
            <div className="flex items-center bg-black/[0.04] p-0.5 rounded-xl border border-black/[0.06] text-[11px] sm:text-xs font-semibold shrink-0">
              <button
                id="nav-view-portfolio-btn"
                onClick={() => setActiveView('portfolio')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeView === 'portfolio'
                    ? 'bg-white text-[#1C1C1E] shadow-2xs font-bold'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#007AFF] shrink-0" />
                <span className="hidden xs:inline">Portfolios</span>
                <span className="xs:hidden">Vault</span>
              </button>
              <button
                id="nav-view-storage-btn"
                onClick={() => setActiveView('storage')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeView === 'storage'
                    ? 'bg-[#007AFF] text-white shadow-2xs font-bold'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                <Box className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>Storage</span>
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 pl-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live APIs: Scryfall • TCGdex • Takara Tomy
              </span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Currency Switcher */}
          <div className="relative shrink-0 hidden md:block">
            <button
              id="currency-switcher-btn"
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-white hover:bg-[#F2F2F7] border border-black/[0.08] text-xs font-semibold text-[#1C1C1E] transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span>{currency}</span>
              <ChevronDown className="w-3 h-3 text-[#8E8E93]" />
            </button>

            {showCurrencyDropdown && (
              <div
                className="absolute right-0 mt-2 w-36 rounded-2xl bg-white border border-black/[0.08] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95"
                onClick={() => setShowCurrencyDropdown(false)}
              >
                {Object.values(CURRENCIES).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code as CurrencyCode)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      currency === c.code ? 'bg-[#007AFF]/10 text-[#007AFF] font-semibold' : 'text-[#1C1C1E] hover:bg-black/[0.04]'
                    }`}
                  >
                    <span>{c.label}</span>
                    {currency === c.code && <Check className="w-3.5 h-3.5 text-[#007AFF]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LOGGED IN ACTIONS ONLY */}
          {isLoggedIn ? (
            <>
              {/* Live Real-Time Sync & Auto-Refresh Control */}
              <div className="relative shrink-0 hidden md:block">
                <button
                  id="sync-market-prices-btn"
                  onClick={() => setShowSyncDropdown(!showSyncDropdown)}
                  title={`Auto-refresh: ${isAutoSyncEnabled ? `Every ${autoSyncIntervalSeconds}s (Next in ${nextSyncCountdown}s)` : 'Manual'} • Last: ${lastSyncTime || 'now'}`}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-[#F2F2F7] text-[#1C1C1E] border border-black/[0.08] text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    {isAutoSyncEnabled && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoSyncEnabled ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                  </span>
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="font-semibold">
                    {isSyncing ? 'Syncing...' : isAutoSyncEnabled ? `Live ${nextSyncCountdown}s` : 'Live Prices'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#8E8E93] shrink-0" />
                </button>

                {showSyncDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-black/[0.08] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-black/[0.05]">
                      <div className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold text-[#1C1C1E]">Real-Time Market Feeds</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        {isAutoSyncEnabled ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>

                    <div className="px-2.5 py-2 text-[11px] text-[#8E8E93] leading-relaxed">
                      Syncs live pricing from TCGPlayer, TCGdex & Scryfall APIs.
                      {lastSyncTime && <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">Last update: {lastSyncTime}</div>}
                    </div>

                    {/* Instant Manual Refresh Button */}
                    <button
                      id="trigger-force-refresh-btn"
                      onClick={() => {
                        syncPrices(true);
                        setShowSyncDropdown(false);
                      }}
                      disabled={isSyncing}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Fetching Live Feeds...' : 'Sync Live Prices Now'}</span>
                    </button>

                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                      Auto-Refresh Frequency
                    </div>

                    <div className="space-y-1">
                      {[
                        { label: 'Real-Time (Every 30s)', seconds: 30, desc: 'Ultra-fresh continuous feed' },
                        { label: 'Standard (Every 1m)', seconds: 60, desc: 'Recommended default' },
                        { label: 'Moderate (Every 3m)', seconds: 180, desc: 'Low bandwidth' },
                        { label: 'Relaxed (Every 5m)', seconds: 300, desc: 'Occasional check' },
                      ].map((opt) => (
                        <button
                          key={opt.seconds}
                          onClick={() => {
                            setIsAutoSyncEnabled(true);
                            setAutoSyncIntervalSeconds(opt.seconds);
                            setShowSyncDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                            isAutoSyncEnabled && autoSyncIntervalSeconds === opt.seconds
                              ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                              : 'text-[#1C1C1E] hover:bg-black/[0.04]'
                          }`}
                        >
                          <div className="flex flex-col text-left">
                            <span className="font-medium">{opt.label}</span>
                            <span className="text-[10px] text-[#8E8E93]">{opt.desc}</span>
                          </div>
                          {isAutoSyncEnabled && autoSyncIntervalSeconds === opt.seconds && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      ))}

                      {/* Manual Only Option */}
                      <button
                        onClick={() => {
                          setIsAutoSyncEnabled(false);
                          setShowSyncDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                          !isAutoSyncEnabled
                            ? 'bg-zinc-100 text-zinc-900 font-semibold border border-zinc-300'
                            : 'text-[#1C1C1E] hover:bg-black/[0.04]'
                        }`}
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-medium">Manual Only</span>
                          <span className="text-[10px] text-[#8E8E93]">Update only when requested</span>
                        </div>
                        {!isAutoSyncEnabled && <Check className="w-3.5 h-3.5 text-zinc-700 shrink-0" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Omni-Agent AI Natural Language Reasoning Engine */}
              {onOpenAgentModal && (
                <button
                  type="button"
                  id="open-agent-modal-btn"
                  onClick={onOpenAgentModal}
                  className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                  title="Omni-Vault & Physical Storage Meta-Agent (Gemini 3.7 Flash)"
                >
                  <Sparkles className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-purple-600 shrink-0" />
                  <span className="hidden sm:inline">Meta-Agent</span>
                </button>
              )}

              {/* AI Scanner Trigger */}
              <button
                type="button"
                id="open-scan-modal-btn"
                onClick={onOpenScanModal}
                className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/80 text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                title="AI Card & Beyblade Scanner"
              >
                <ScanLine className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-500 shrink-0" />
                <span className="hidden sm:inline">AI Scanner</span>
              </button>

              {/* Analytics / Portfolio Insights */}
              <button
                type="button"
                id="open-analytics-btn"
                onClick={onOpenAnalyticsModal}
                className="hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-[#F2F2F7] text-[#1C1C1E] border border-black/[0.08] text-xs font-medium transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                title="Portfolio Insights"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#007AFF] shrink-0" />
                <span>Insights</span>
              </button>

              {/* Primary Add Asset Button */}
              <button
                type="button"
                id="open-add-item-btn"
                onClick={onOpenAddModal}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-semibold text-xs transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] shrink-0" />
                <span className="hidden xs:inline">Add</span>
                <span className="hidden md:inline">Asset</span>
              </button>

              {/* User Account / Profile Menu (includes storage inventory & vault tools) */}
              <UserMenu
                onOpenAuthModal={onOpenAuthModal}
                onOpenStorageInventory={onOpenStorageModal}
                onOpenDiagnosticsModal={onOpenDiagnosticsModal}
                onExportJSON={exportJSON}
                onImportJSON={handleImportClick}
                onResetPortfolio={handleReset}
              />
            </>
          ) : (
            /* GUEST STATE: SIGN IN / REGISTER CTA */
            <div className="flex items-center gap-2">
              <button
                id="guest-signin-btn"
                onClick={() => onOpenAuthModal('signin')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
