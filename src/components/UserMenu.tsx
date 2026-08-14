import React, { useState } from 'react';
import {
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  CheckCircle2,
  Mail,
  Calendar,
  Sparkles,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserMenuProps {
  onOpenAuthModal: (mode: 'signin' | 'register') => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onOpenAuthModal }) => {
  const { user, userProfile, isDemoUser, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          id="navbar-signin-btn"
          onClick={() => onOpenAuthModal('signin')}
          className="h-8 px-3 rounded-xl bg-white hover:bg-[#F2F2F7] text-[#1C1C1E] border border-black/[0.08] text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5 text-[#007AFF] shrink-0" />
          <span>Sign In</span>
        </button>

        <button
          type="button"
          id="navbar-register-btn"
          onClick={() => onOpenAuthModal('register')}
          className="h-8 px-3 rounded-xl bg-white hover:bg-[#F2F2F7] text-[#1C1C1E] border border-black/[0.08] text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 text-[#007AFF] shrink-0" />
          <span>Register</span>
        </button>
      </div>
    );
  }

  // Authenticated User State
  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Collector';
  const email = userProfile?.email || user?.email || 'collector@vault.io';
  const photoURL = userProfile?.photoURL || user?.photoURL;
  const isGoogleUser = user?.providerData?.some((p) => p.providerId === 'google.com');

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
              <span className="text-[#8E8E93] font-medium">Auth Mode:</span>
              <span className="px-2 py-0.5 rounded-full font-semibold bg-white border border-black/[0.08] text-[#1C1C1E] flex items-center gap-1">
                {isGoogleUser ? (
                  <>
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google Account</span>
                  </>
                ) : isDemoUser ? (
                  <>
                    <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                    <span>Demo Profile</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-2.5 h-2.5 text-[#007AFF]" />
                    <span>Registered Collector</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Account Status / Cloud Sync */}
          <div className="px-3 py-1.5 text-[11px] text-[#8E8E93] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Personal Vault Sync Active</span>
            </span>
            <span className="font-mono text-[10px] text-emerald-600 font-bold">Encrypted</span>
          </div>

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

