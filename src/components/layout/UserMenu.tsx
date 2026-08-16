import React, { useState } from 'react';
import {
  LogOut,
  LogIn,
  CheckCircle2,
  Mail,
  ChevronDown,
  Box,
  Coins,
  Check,
  Download,
  Upload,
  Activity,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVault } from '../../context/VaultContext';
import { CurrencyCode } from '../../types';
import { CURRENCIES } from '../../data/initialData';

interface UserMenuProps {
  onOpenAuthModal: (mode: 'signin' | 'register') => void;
  onOpenStorageInventory?: () => void;
  onOpenDiagnosticsModal?: () => void;
  onExportJSON?: () => void;
  onImportJSON?: () => void;
  onResetPortfolio?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  onOpenAuthModal,
  onOpenStorageInventory,
  onOpenDiagnosticsModal,
  onExportJSON,
  onImportJSON,
  onResetPortfolio,
}) => {
  const { user, userProfile, logout, loading } = useAuth();
  const { items, currency, setCurrency } = useVault();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Count unique physical containers
  const containerCount = new Set(
    items
      .map((i) => i.storageLocation?.container)
      .filter(Boolean)
  ).size;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsOpen(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-xl bg-black/[0.04] animate-pulse shrink-0" />
    );
  }

  // Active user exists if user or userProfile is set
  const currentUser = user || (userProfile ? { email: userProfile.email, displayName: userProfile.displayName, photoURL: userProfile.photoURL } : null);

  // Guest / Logged Out State
  if (!currentUser) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          id="navbar-signin-register-btn"
          onClick={() => onOpenAuthModal('signin')}
          className="h-8 px-2.5 sm:px-3.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Sign In / Register</span>
          <span className="sm:hidden">Sign In</span>
        </button>
      </div>
    );
  }

  // Authenticated User State
  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Collector';
  const email = userProfile?.email || user?.email || 'collector@vault.io';
  const photoURL = userProfile?.photoURL || user?.photoURL;

  return (
    <div className="relative shrink-0">
      {/* Click-away backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[0.5px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <button
        type="button"
        id="user-profile-menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="h-8 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 rounded-xl bg-white hover:bg-[#F2F2F7] border border-black/[0.08] transition-all shadow-2xs active:scale-95 cursor-pointer relative z-50 shrink-0"
        title={displayName}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded-full object-cover border border-black/[0.08] shrink-0"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#007AFF] to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold uppercase shadow-2xs shrink-0">
            {displayName.charAt(0)}
          </div>
        )}

        <span className="hidden sm:inline max-w-[85px] md:max-w-[120px] truncate text-xs font-semibold text-[#1C1C1E]">
          {displayName}
        </span>
        <ChevronDown className="w-3 h-3 text-[#8E8E93] shrink-0" />
      </button>

      {isOpen && (
        <div
          id="user-profile-dropdown"
          className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-[300px] sm:w-72 rounded-3xl bg-white border border-black/[0.08] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* User Header Profile */}
          <div className="p-3 bg-[#F8F9FB] rounded-2xl border border-black/[0.04] mb-2">
            <div className="flex items-center gap-2.5">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl object-cover border border-black/[0.08] shadow-xs shrink-0"
                />
              ) : null}

              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-[#1C1C1E] truncate flex items-center gap-1.5">
                  <span className="truncate">{displayName}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <div className="text-[11px] text-[#8E8E93] truncate font-mono mt-0.5">
                  {email}
                </div>
              </div>
            </div>

            {/* Provider Badge */}
            <div className="mt-2.5 pt-2 border-t border-black/[0.04] flex items-center justify-between text-[10px]">
              <span className="text-[#8E8E93] font-medium">Account Status:</span>
              <span className="px-2 py-0.5 rounded-full font-semibold bg-white border border-black/[0.08] text-[#1C1C1E] flex items-center gap-1">
                <Mail className="w-2.5 h-2.5 text-[#007AFF]" />
                <span>Verified Collector</span>
              </span>
            </div>
          </div>

          {/* Account Status / Cloud Sync */}
          <div className="px-2 py-1 text-[11px] text-[#8E8E93] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Cloud Synced</span>
            </span>
            <span className="font-mono text-[10px] text-emerald-600 font-bold">Secure</span>
          </div>

          <div className="my-1 h-[1px] bg-black/[0.06]" />

          {/* Currency Switcher for Mobile / Quick Access */}
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#8E8E93] mb-1.5">
              <Coins className="w-3 h-3 text-[#007AFF]" />
              <span>Display Currency</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {Object.values(CURRENCIES).map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrency(c.code as CurrencyCode);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center ${
                    currency === c.code
                      ? 'bg-[#007AFF] text-white shadow-2xs'
                      : 'bg-black/[0.04] text-[#1C1C1E] hover:bg-black/[0.08]'
                  }`}
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>

          <div className="my-1 h-[1px] bg-black/[0.06]" />

          {/* Physical Storage & Real-World Vault Inventory */}
          {onOpenStorageInventory && (
            <button
              type="button"
              id="user-profile-storage-inventory-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onOpenStorageInventory();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-[#1C1C1E] hover:bg-[#007AFF]/10 hover:text-[#007AFF] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#007AFF]" />
                <span>Physical Storage Inventory</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#007AFF]/10 text-[#007AFF]">
                {containerCount} boxes
              </span>
            </button>
          )}

          {/* Optional Direct Vault Tools inside User Menu for mobile convenience */}
          {(onExportJSON || onImportJSON || onOpenDiagnosticsModal) && (
            <>
              <div className="my-1 h-[1px] bg-black/[0.06]" />
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Vault Tools & Backup
              </div>

              {onExportJSON && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    onExportJSON();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#1C1C1E] hover:bg-black/[0.04] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Vault JSON</span>
                </button>
              )}

              {onImportJSON && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    onImportJSON();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#1C1C1E] hover:bg-black/[0.04] transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span>Import Backup JSON</span>
                </button>
              )}

              {onOpenDiagnosticsModal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    onOpenDiagnosticsModal();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#1C1C1E] hover:bg-black/[0.04] transition-colors cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  <span>API Pipeline Diagnostics</span>
                </button>
              )}
            </>
          )}

          <div className="my-1 h-[1px] bg-black/[0.06]" />

          {/* Actions */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? 'Signing out...' : 'Sign Out of Vault'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

