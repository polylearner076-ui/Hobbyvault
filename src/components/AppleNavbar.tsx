import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import {
  Sparkles,
  RefreshCw,
  ScanLine,
  Plus,
  BarChart3,
  SlidersHorizontal,
  Download,
  Upload,
  RotateCcw,
  Check,
  ChevronDown,
  Layers,
  Shield,
  Activity,
} from 'lucide-react';
import { CurrencyCode } from '../types';
import { CURRENCIES } from '../data/initialData';
import { UserMenu } from './UserMenu';

interface AppleNavbarProps {
  onOpenAddModal: () => void;
  onOpenScanModal: () => void;
  onOpenAnalyticsModal: () => void;
  onOpenNewSandboxModal: () => void;
  onOpenDiagnosticsModal: () => void;
  onOpenAuthModal: (mode: 'signin' | 'register') => void;
}

export const AppleNavbar: React.FC<AppleNavbarProps> = ({
  onOpenAddModal,
  onOpenScanModal,
  onOpenAnalyticsModal,
  onOpenNewSandboxModal,
  onOpenDiagnosticsModal,
  onOpenAuthModal,
}) => {
  const {
    sandboxes,
    activeSandboxId,
    setActiveSandboxId,
    activeSandbox,
    currency,
    setCurrency,
    syncPrices,
    isSyncing,
    lastSyncTime,
    exportJSON,
    importJSON,
    resetToDefaults,
    totalValueUSD,
    formatPrice,
  } = useVault();

  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showVaultDropdown, setShowVaultDropdown] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

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
    setShowSettingsDropdown(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset all sandboxes and portfolio data to initial state?')) {
      resetToDefaults();
      setShowSettingsDropdown(false);
    }
  };

  return (
    <header
      id="apple-navbar"
      className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 border-b border-black/[0.06] text-[#1C1C1E] transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: App Logo & Active Sandbox Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#007AFF] via-indigo-500 to-sky-400 p-[1px] shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#007AFF]" />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tracking-tight text-base text-[#1C1C1E]">
                  Collector<span className="text-[#007AFF] font-bold">Vault</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                  Pro
                </span>
              </div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden md:block h-5 w-[1px] bg-black/[0.08] mx-1" />

          {/* Quick Sandbox Selector for Mobile & Compact */}
          <div className="relative">
            <button
              id="sandbox-selector-btn"
              onClick={() => setShowVaultDropdown(!showVaultDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.07] border border-black/[0.06] text-xs font-medium text-[#1C1C1E] transition-colors shadow-sm"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: activeSandbox ? activeSandbox.themeColor : '#007AFF' }}
              />
              <span className="max-w-[130px] truncate font-semibold">
                {activeSandbox ? activeSandbox.name : 'Unified Portfolio'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93]" />
            </button>

            {showVaultDropdown && (
              <div
                className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-black/[0.08] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowVaultDropdown(false)}
              >
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                  Select Sandbox / Vault
                </div>
                <button
                  onClick={() => setActiveSandboxId('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeSandboxId === 'all'
                      ? 'bg-[#007AFF]/10 text-[#007AFF] font-semibold border border-[#007AFF]/20'
                      : 'text-[#1C1C1E] hover:bg-black/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#007AFF]" />
                    <span>Unified All Portfolios</span>
                  </div>
                  {activeSandboxId === 'all' && <Check className="w-3.5 h-3.5 text-[#007AFF]" />}
                </button>

                <div className="my-1 h-[1px] bg-black/[0.06]" />

                {sandboxes.map((sb) => (
                  <button
                    key={sb.id}
                    onClick={() => setActiveSandboxId(sb.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      activeSandboxId === sb.id
                        ? 'bg-black/[0.06] text-[#1C1C1E] font-semibold border border-black/[0.08]'
                        : 'text-[#1C1C1E] hover:bg-black/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sb.themeColor }} />
                      <span className="truncate">{sb.name}</span>
                    </div>
                    {activeSandboxId === sb.id && <Check className="w-3.5 h-3.5 text-[#007AFF]" />}
                  </button>
                ))}

                <div className="my-1 h-[1px] bg-black/[0.06]" />

                <button
                  onClick={onOpenNewSandboxModal}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Sandbox...</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Live Sync Prices Button */}
          <button
            id="sync-market-prices-btn"
            onClick={() => syncPrices()}
            disabled={isSyncing}
            title={`Last synced at ${lastSyncTime || 'now'}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F2F2F7] text-[#1C1C1E] border border-black/[0.08] text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#34C759] ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline font-medium">
              {isSyncing ? 'Syncing...' : 'Live Prices'}
            </span>
          </button>

          {/* Currency Switcher */}
          <div className="relative">
            <button
              id="currency-switcher-btn"
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F2F2F7] border border-black/[0.08] text-xs font-semibold text-[#1C1C1E] transition-colors shadow-sm"
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
                    {currency === c.code && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Scanner Trigger */}
          <button
            id="open-scan-modal-btn"
            onClick={onOpenScanModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/80 text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <ScanLine className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">AI Scanner</span>
          </button>

          {/* Analytics / Portfolio Insights */}
          <button
            id="open-analytics-btn"
            onClick={onOpenAnalyticsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F2F2F7] text-[#1C1C1E] border border-black/[0.08] text-xs font-medium transition-all shadow-sm active:scale-95"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#007AFF]" />
            <span className="hidden lg:inline">Insights</span>
          </button>

          {/* API Pipeline & HobbyData Diagnostics */}
          <button
            id="open-diagnostics-btn"
            onClick={onOpenDiagnosticsModal}
            title="Database: HobbyData | Test Scryfall & TCG APIs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xl:inline">API Tests</span>
          </button>

          {/* Primary Add Item Button */}
          <button
            id="open-add-item-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-semibold text-xs transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Asset</span>
          </button>

          {/* User Account / Profile */}
          <div className="h-5 w-[1px] bg-black/[0.08] mx-0.5" />
          <UserMenu onOpenAuthModal={onOpenAuthModal} />

          {/* More Settings Dropdown */}
          <div className="relative">
            <button
              id="settings-menu-btn"
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="p-1.5 rounded-xl bg-white hover:bg-[#F2F2F7] border border-black/[0.08] text-[#8E8E93] hover:text-[#1C1C1E] transition-colors shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {showSettingsDropdown && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-black/[0.08] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 text-xs"
                onClick={() => setShowSettingsDropdown(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                  Data & Backup
                </div>
                <button
                  onClick={exportJSON}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#1C1C1E] hover:bg-black/[0.04] transition-colors font-medium"
                >
                  <Download className="w-4 h-4 text-[#34C759]" />
                  <span>Export Vault (JSON)</span>
                </button>
                <button
                  onClick={handleImportClick}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#1C1C1E] hover:bg-black/[0.04] transition-colors font-medium"
                >
                  <Upload className="w-4 h-4 text-[#007AFF]" />
                  <span>Import Backup JSON</span>
                </button>
                <div className="my-1 h-[1px] bg-black/[0.06]" />
                <button
                  onClick={handleReset}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#FF3B30] hover:bg-red-50 transition-colors font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
