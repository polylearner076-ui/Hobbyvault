import React, { useState } from 'react';
import {
  LogOut,
  LogIn,
  CheckCircle2,
  Mail,
  ChevronDown,
  Box,
  Archive,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVault } from '../../context/VaultContext';

interface UserMenuProps {
  onOpenAuthModal: (mode: 'signin' | 'register') => void;
  onOpenStorageInventory?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onOpenAuthModal, onOpenStorageInventory }) => {
  const { user, userProfile, logout, loading } = useAuth();
  const { items } = useVault();
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
      <div className="w-8 h-8 rounded-xl bg-black/[0.04] animate-pulse" />
    );
  }

  // Active user exists if user or userProfile is set
  const currentUser = user || (userProfile ? { email: userProfile.email, displayName: userProfile.displayName, photoURL: userProfile.photoURL } : null);

  // Guest / Logged Out State
  if (!currentUser) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          id="navbar-signin-register-btn"
          onClick={() => onOpenAuthModal('signin')}
          className="h-8 px-3.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5 shrink-0" />
          <span>Sign In / Register</span>
        </button>
      </div>
    );
  }

  // Authenticated User State
  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Collector';
  const email = userProfile?.email || user?.email || 'collector@vault.io';
  const photoURL = userProfile?.photoURL || user?.photoURL;
  const isGoogleUser = userProfile?.providerId === 'google.com' || user?.providerData?.some((p) => p.providerId === 'google.com');

  return (
    <div className="relative shrink-0">
      <button
        id="user-profile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 flex items-center gap-2 px-2.5 rounded-xl bg-white hover:bg-[#F2F2F7] border border-black/[0.08] transition-all shadow-2xs active:scale-95 cursor-pointer"
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded-full object-cover border border-black/[0.08]"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#007AFF] to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold uppercase shadow-2xs">
            {displayName.charAt(0)}
          </div>
        )}

        <span className="max-w-[85px] sm:max-w-[120px] truncate text-xs font-semibold text-[#1C1C1E]">
          {displayName}
        </span>
        <ChevronDown className="w-3 h-3 text-[#8E8E93] shrink-0" />
      </button>

      {isOpen && (
        <div
          id="user-profile-dropdown"
          className="absolute right-0 mt-2 w-72 rounded-3xl bg-white border border-black/[0.08] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95"
          onClick={() => setIsOpen(false)}
        >
          {/* User Header Profile */}
          <div className="p-3 bg-[#F8F9FB] rounded-2xl border border-black/[0.04] mb-2">
            <div className="flex items-center gap-3">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-2xl object-cover border border-black/[0.08] shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-indigo-600 text-white flex items-center justify-center text-sm font-bold uppercase shadow-xs">
                  {displayName.charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-[#1C1C1E] truncate flex items-center gap-1">
                  <span>{displayName}</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                </div>
                <div className="text-[11px] text-[#8E8E93] truncate font-mono mt-0.5">
                  {email}
                </div>
              </div>
            </div>

            {/* Provider Badge */}
            <div className="mt-2.5 pt-2 border-t border-black/[0.04] flex items-center justify-between text-[10px]">
              <span className="text-[#8E8E93] font-medium">Auth Provider:</span>
              <span className="px-2 py-0.5 rounded-full font-semibold bg-white border border-black/[0.08] text-[#1C1C1E] flex items-center gap-1">
                <Mail className="w-2.5 h-2.5 text-[#007AFF]" />
                <span>Email & Password</span>
              </span>
            </div>
          </div>

          {/* Account Status / Cloud Sync */}
          <div className="px-3 py-1.5 text-[11px] text-[#8E8E93] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud SQL (PostgreSQL) Synced</span>
            </span>
            <span className="font-mono text-[10px] text-emerald-600 font-bold">Encrypted</span>
          </div>

          <div className="my-1 h-[1px] bg-black/[0.06]" />

          {/* Physical Storage & Real-World Vault Inventory */}
          {onOpenStorageInventory && (
            <button
              id="user-profile-storage-inventory-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onOpenStorageInventory();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#1C1C1E] hover:bg-[#007AFF]/10 hover:text-[#007AFF] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#007AFF]" />
                <span>Physical Storage Inventory</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#007AFF]/10 text-[#007AFF]">
                {containerCount} containers
              </span>
            </button>
          )}

          <div className="my-1 h-[1px] bg-black/[0.06]" />

          {/* Actions */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? 'Signing out...' : 'Sign Out of Vault'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
