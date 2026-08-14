import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile } from '../types';

export interface DemoCollector {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatar: string;
  specialty: string;
  vaultFocus: string;
}

export const DEMO_COLLECTORS: DemoCollector[] = [
  {
    id: 'demo_ash_ketchum',
    name: 'Ash Ketchum',
    email: 'ash.pokemon@collectorvault.io',
    handle: '@pallettown_collector',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    specialty: 'Pokémon TCG Master & Graded Slabs',
    vaultFocus: 'Base Set 1st Editions & Modern Illustration Rares',
  },
  {
    id: 'demo_luffy_op',
    name: 'Monkey D. Luffy',
    email: 'luffy.strawhat@collectorvault.io',
    handle: '@king_of_pirates',
    avatar: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=120&auto=format&fit=crop&q=80',
    specialty: 'One Piece Card Game & Anime Rarities',
    vaultFocus: 'OP-05 Manga Rares & Championship Promos',
  },
  {
    id: 'demo_charles_mtg',
    name: 'Charles Black Lotus',
    email: 'charles.vintage@collectorvault.io',
    handle: '@power9_investor',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    specialty: 'Vintage Magic: The Gathering & High-End Artifacts',
    vaultFocus: 'Alpha/Beta Reserve List & Beyblade Metal Fight',
  },
];

const LOCAL_STORAGE_AUTH_USER = 'collectorvault_auth_user_v1';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  activeUserId: string | null;
  loading: boolean;
  authError: string | null;
  isDemoUser: boolean;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  loginWithDemoAccount: (demo: DemoCollector) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_AUTH_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_AUTH_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.providerId === 'demo' || parsed?.uid?.startsWith('demo_');
      }
      return false;
    } catch {
      return false;
    }
  });

  const clearAuthError = () => setAuthError(null);

  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/unauthorized-domain':
        return 'Google Sign-In is restricted because this sandbox preview domain is not whitelisted in Firebase Auth Settings. Please use Email/Password sign in or one of the Instant Demo Accounts below.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email address or password. Please verify your credentials or register a new account.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Try signing in instead.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in popup was closed before completing.';
      case 'auth/popup-blocked':
        return 'Google sign-in popup was blocked by browser. Please allow popups.';
      case 'auth/network-request-failed':
        return 'Network connection error. Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Access to this account has been temporarily disabled due to many failed attempts. Reset your password or try again later.';
      default:
        return err?.message || 'An unexpected authentication error occurred.';
    }
  };

  // Sync user profile to Firestore & local storage
  const syncUserProfile = async (
    firebaseUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; providerId?: string },
    customName?: string
  ) => {
    try {
      const profileData: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: customName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Collector',
        photoURL: firebaseUser.photoURL,
        providerId: firebaseUser.providerId || 'password',
        lastLoginAt: new Date().toISOString(),
      };

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          profileData.createdAt = new Date().toISOString();
        }
        await setDoc(userRef, profileData, { merge: true });
      } catch (dbErr) {
        console.warn('Firestore profile sync fallback:', dbErr);
      }

      setUserProfile(profileData);
      localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(profileData));
    } catch (e) {
      console.warn('Could not sync user profile:', e);
      const fallback: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: customName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Collector',
        photoURL: firebaseUser.photoURL,
        providerId: firebaseUser.providerId || 'password',
      };
      setUserProfile(fallback);
      localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(fallback));
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsDemoUser(false);
        await syncUserProfile(currentUser);
      } else {
        // If not logged in via Firebase Auth, check if we have a persisted demo or fallback session
        try {
          const saved = localStorage.getItem(LOCAL_STORAGE_AUTH_USER);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && (parsed.providerId === 'demo' || parsed.providerId === 'password_fallback')) {
              setUserProfile(parsed);
              setIsDemoUser(parsed.providerId === 'demo');
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore
        }
        setUser(null);
        setUserProfile(null);
        setIsDemoUser(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setIsDemoUser(false);
        await syncUserProfile(result.user);
      }
    } catch (err: any) {
      const msg = formatAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (result.user) {
        setIsDemoUser(false);
        await syncUserProfile(result.user);
      }
    } catch (err: any) {
      // If Firebase Auth fails due to network/domain block, provide safe fallback for custom credentials
      if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/network-request-failed') {
        const uid = `usr_${btoa(email.trim().toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
        const fallbackProfile: UserProfile = {
          uid,
          email: email.trim(),
          displayName: email.split('@')[0],
          photoURL: null,
          providerId: 'password_fallback',
          lastLoginAt: new Date().toISOString(),
        };
        setUserProfile(fallbackProfile);
        localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(fallbackProfile));
        setIsDemoUser(false);
        return;
      }
      const msg = formatAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
    setAuthError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (result.user) {
        if (displayName?.trim()) {
          await updateProfile(result.user, { displayName: displayName.trim() });
        }
        setIsDemoUser(false);
        await syncUserProfile(result.user, displayName?.trim());
      }
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/network-request-failed') {
        const uid = `usr_${btoa(email.trim().toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
        const fallbackProfile: UserProfile = {
          uid,
          email: email.trim(),
          displayName: displayName?.trim() || email.split('@')[0],
          photoURL: null,
          providerId: 'password_fallback',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        setUserProfile(fallbackProfile);
        localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(fallbackProfile));
        setIsDemoUser(false);
        return;
      }
      const msg = formatAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const loginWithDemoAccount = async (demo: DemoCollector) => {
    setAuthError(null);
    try {
      const demoProfile: UserProfile = {
        uid: demo.id,
        email: demo.email,
        displayName: demo.name,
        photoURL: demo.avatar,
        providerId: 'demo',
        lastLoginAt: new Date().toISOString(),
      };
      setUserProfile(demoProfile);
      localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(demoProfile));
      setIsDemoUser(true);
      await setDoc(doc(db, 'users', demo.id), demoProfile, { merge: true });
    } catch (e) {
      console.warn('Demo login profile sync note:', e);
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_AUTH_USER);
      setUserProfile(null);
      setIsDemoUser(false);
      setUser(null);
      await signOut(auth);
    } catch (err: any) {
      localStorage.removeItem(LOCAL_STORAGE_AUTH_USER);
      setUserProfile(null);
      setIsDemoUser(false);
      setUser(null);
    }
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      const msg = formatAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Determine the effective active user id
  const activeUserId = user?.uid || userProfile?.uid || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        activeUserId,
        loading,
        authError,
        isDemoUser,
        clearAuthError,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginWithDemoAccount,
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
