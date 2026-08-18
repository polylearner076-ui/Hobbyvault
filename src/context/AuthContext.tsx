import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

const LOCAL_STORAGE_AUTH_USER = 'collectorvault_auth_user_v2';

export interface AccountClashInfo {
  email: string;
  existingAccount: any;
  googleProfile: {
    displayName?: string | null;
    photoURL?: string | null;
  };
}

interface AuthContextType {
  user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  userProfile: UserProfile | null;
  activeUserId: string | null;
  loading: boolean;
  authError: string | null;
  accountClash: AccountClashInfo | null;
  clearAuthError: () => void;
  signInWithGoogle: (explicitEmail?: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  confirmLinkClashAccount: () => Promise<void>;
  dismissClashPrompt: () => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default dummy user initialized from Supabase
const DEFAULT_SUPABASE_USER: UserProfile = {
  uid: 'user_123123',
  email: '123123@gmail.com',
  displayName: 'Dummy Collector',
  photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=123123',
  providerId: 'password',
  primaryProvider: 'password',
  linkedProviders: ['password'],
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_AUTH_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.uid && !parsed?.email?.includes('polylearner')) return parsed;
      }
    } catch {}
    return DEFAULT_SUPABASE_USER;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [accountClash, setAccountClash] = useState<AccountClashInfo | null>(null);

  const clearAuthError = () => {
    setAuthError(null);
  };

  const dismissClashPrompt = () => {
    setAccountClash(null);
  };

  // Restore and verify user session with Supabase on mount
  useEffect(() => {
    async function verifySession() {
      try {
        const activeUid = userProfile?.uid || DEFAULT_SUPABASE_USER.uid;
        const res = await fetch(`/api/auth/me?uid=${encodeURIComponent(activeUid)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const profile: UserProfile = {
              uid: data.user.uid,
              email: data.user.email,
              displayName: data.user.displayName || data.user.email?.split('@')[0] || 'Collector',
              photoURL: data.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.user.email)}`,
              providerId: (data.user.providerId as any) || 'password',
              primaryProvider: (data.user.primaryProvider as any) || 'password',
              linkedProviders: data.user.linkedProviders || ['password'],
              createdAt: data.user.createdAt,
              lastLoginAt: data.user.lastLoginAt,
            };
            setUserProfile(profile);
            localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(profile));
          }
        }
      } catch (err) {
        console.warn('Session verification fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    verifySession();
  }, []);

  /**
   * Direct Login against Supabase database
   */
  const loginWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: pass }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.user) {
        const msg = data.error || 'Invalid email or password in Supabase database.';
        setAuthError(msg);
        throw new Error(msg);
      }

      const profile: UserProfile = {
        uid: data.user.uid,
        email: data.user.email,
        displayName: data.user.displayName || data.user.email.split('@')[0],
        photoURL: data.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.user.email)}`,
        providerId: (data.user.providerId as any) || 'password',
        primaryProvider: (data.user.primaryProvider as any) || 'password',
        linkedProviders: data.user.linkedProviders || ['password'],
        createdAt: data.user.createdAt,
        lastLoginAt: data.user.lastLoginAt,
      };

      setUserProfile(profile);
      localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(profile));
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
      throw err;
    }
  };

  /**
   * Direct Registration in Supabase database
   */
  const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
    setAuthError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: pass, displayName }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.user) {
        const msg = data.error || 'Registration failed in Supabase database.';
        setAuthError(msg);
        throw new Error(msg);
      }

      const profile: UserProfile = {
        uid: data.user.uid,
        email: data.user.email,
        displayName: data.user.displayName || displayName || cleanEmail.split('@')[0],
        photoURL: data.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
        providerId: 'password',
        primaryProvider: 'password',
        linkedProviders: ['password'],
        createdAt: data.user.createdAt,
        lastLoginAt: data.user.lastLoginAt,
      };

      setUserProfile(profile);
      localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(profile));
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
      throw err;
    }
  };

  /**
   * Google sign-in directly synchronized to Supabase
   */
  const signInWithGoogle = async (explicitEmail?: string) => {
    setAuthError(null);
    const targetEmail = (explicitEmail || 'user@example.com').trim().toLowerCase();
    try {
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: 'google_' + targetEmail.replace(/[^a-z0-9]/g, '_'),
          email: targetEmail,
          displayName: 'Google Collector',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          providerId: 'google.com',
          primaryProvider: 'google.com',
          linkedProviders: ['google.com'],
        }),
      });
      const data = await res.json();
      if (data.user) {
        const profile: UserProfile = {
          uid: data.user.uid,
          email: data.user.email,
          displayName: data.user.displayName,
          photoURL: data.user.photoURL,
          providerId: 'google.com',
          primaryProvider: 'google.com',
          linkedProviders: ['google.com'],
        };
        setUserProfile(profile);
        localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(profile));
      }
    } catch (err: any) {
      console.error('Google sign-in sync error:', err);
    }
  };

  const confirmLinkClashAccount = async () => {
    if (accountClash) {
      setAccountClash(null);
    }
  };

  const logout = async () => {
    setAuthError(null);
    setAccountClash(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem(LOCAL_STORAGE_AUTH_USER);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    console.log('Password reset requested for:', email);
  };

  const activeUserId = userProfile?.uid || null;
  const user = userProfile ? {
    uid: userProfile.uid,
    email: userProfile.email,
    displayName: userProfile.displayName,
    photoURL: userProfile.photoURL,
  } : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        activeUserId,
        loading,
        authError,
        accountClash,
        clearAuthError,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        confirmLinkClashAccount,
        dismissClashPrompt,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
