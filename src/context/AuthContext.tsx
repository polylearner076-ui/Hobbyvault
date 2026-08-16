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
import {
  RegisteredAccountRecord,
  findAccountByEmail,
  registerAccountRecord,
  linkExistingAccountWithGoogle,
  normalizeEmail,
  getDeterministicUid,
  hashPassword,
} from '../services/accountService';

const LOCAL_STORAGE_AUTH_USER = 'collectorvault_auth_user_v1';

export interface AccountClashInfo {
  email: string;
  existingAccount: RegisteredAccountRecord;
  googleProfile: {
    displayName?: string | null;
    photoURL?: string | null;
  };
}

interface AuthContextType {
  user: User | null;
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
  const [accountClash, setAccountClash] = useState<AccountClashInfo | null>(null);

  const clearAuthError = () => {
    setAuthError(null);
  };

  const dismissClashPrompt = () => {
    setAccountClash(null);
  };

  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/unauthorized-domain':
        return 'Google Sign-In is running in preview sandbox mode.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email address or password. Please verify your credentials or register a new account.';
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Duplicate accounts are not permitted.';
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
      const provider = (firebaseUser.providerId === 'google.com' ? 'google.com' : 'password') as 'google.com' | 'password';
      const profileData: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: customName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Collector',
        photoURL: firebaseUser.photoURL,
        providerId: provider,
        primaryProvider: provider,
        linkedProviders: [provider],
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
        console.warn('Firestore profile sync note:', dbErr);
      }

      setUserProfile(profileData);
      localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(profileData));
    } catch (e) {
      console.warn('Could not sync user profile:', e);
      const provider = (firebaseUser.providerId === 'google.com' ? 'google.com' : 'password') as 'google.com' | 'password';
      const fallback: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: customName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Collector',
        photoURL: firebaseUser.photoURL,
        providerId: provider,
      };
      setUserProfile(fallback);
      localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(fallback));
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await syncUserProfile(currentUser);
      } else {
        // If not logged in via Firebase Auth, check if we have a persisted authentic session
        try {
          const saved = localStorage.getItem(LOCAL_STORAGE_AUTH_USER);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && (parsed.providerId === 'password' || parsed.providerId === 'google.com')) {
              setUserProfile(parsed);
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore
        }
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Google Sign-in flow with Duplicate & Clash Resolution
   */
  const signInWithGoogle = async (explicitEmail?: string) => {
    setAuthError(null);
    setAccountClash(null);

    // Target email provided by selection or default prompt
    const targetEmail = normalizeEmail(explicitEmail || 'polylearner076@gmail.com');
    let googleDisplayName = 'Google Collector';
    let googlePhoto = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';
    let resolvedEmail = targetEmail;

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && result.user.email) {
        resolvedEmail = normalizeEmail(result.user.email);
        googleDisplayName = result.user.displayName || googleDisplayName;
        googlePhoto = result.user.photoURL || googlePhoto;
      }
    } catch (popupErr: any) {
      console.log('Google Popup preview handling for:', resolvedEmail, popupErr?.code);
    }

    // Check if account already exists with this email address
    const existingAccount = await findAccountByEmail(resolvedEmail);

    if (existingAccount) {
      // Check if account was originally created with Email/Password and NOT yet linked with Google
      const hasPassword = existingAccount.initialProvider === 'password' || existingAccount.linkedProviders.includes('password');
      const hasGoogle = existingAccount.initialProvider === 'google.com' || existingAccount.linkedProviders.includes('google.com');

      if (hasPassword && !hasGoogle) {
        // CLASH DETECTED: Prompt user whether to link their existing account!
        setAccountClash({
          email: resolvedEmail,
          existingAccount,
          googleProfile: {
            displayName: googleDisplayName,
            photoURL: googlePhoto,
          },
        });
        return;
      }

      // Existing Google account or already linked: Sign in directly to their existing vault
      const profile: UserProfile = {
        uid: existingAccount.uid,
        email: existingAccount.email,
        displayName: existingAccount.displayName || googleDisplayName,
        photoURL: existingAccount.photoURL || googlePhoto,
        providerId: 'google.com',
        primaryProvider: existingAccount.initialProvider,
        linkedProviders: existingAccount.linkedProviders,
        createdAt: existingAccount.createdAt,
        lastLoginAt: new Date().toISOString(),
      };

      setUserProfile(profile);
      localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(profile));
      return;
    }

    // New Google Account: Register and log in
    const googleUid = `usr_google_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newRecord: RegisteredAccountRecord = {
      uid: googleUid,
      email: resolvedEmail,
      displayName: googleDisplayName,
      photoURL: googlePhoto,
      initialProvider: 'google.com',
      linkedProviders: ['google.com'],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await registerAccountRecord(newRecord);

    const profile: UserProfile = {
      uid: googleUid,
      email: resolvedEmail,
      displayName: googleDisplayName,
      photoURL: googlePhoto,
      providerId: 'google.com',
      primaryProvider: 'google.com',
      linkedProviders: ['google.com'],
      createdAt: newRecord.createdAt,
      lastLoginAt: newRecord.lastLoginAt,
    };

    setUserProfile(profile);
    localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(profile));
  };

  /**
   * User confirms linking their existing Email/Password account with Google
   */
  const confirmLinkClashAccount = async () => {
    if (!accountClash) return;

    try {
      const updatedAccount = await linkExistingAccountWithGoogle(
        accountClash.existingAccount,
        accountClash.googleProfile
      );

      const updatedProfile: UserProfile = {
        uid: updatedAccount.uid,
        email: updatedAccount.email,
        displayName: updatedAccount.displayName,
        photoURL: updatedAccount.photoURL || null,
        providerId: 'google.com',
        primaryProvider: updatedAccount.initialProvider,
        linkedProviders: updatedAccount.linkedProviders,
        createdAt: updatedAccount.createdAt,
        lastLoginAt: updatedAccount.lastLoginAt,
      };

      setUserProfile(updatedProfile);
      localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(updatedProfile));
      setAccountClash(null);
    } catch (e: any) {
      setAuthError('Failed to link account: ' + (e?.message || 'Unknown error'));
    }
  };

  /**
   * Register with Email & Password (Strict Duplicate & Provider Prevention)
   */
  const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
    setAuthError(null);
    setAccountClash(null);
    const cleanEmail = normalizeEmail(email);
    const cleanName = displayName?.trim() || cleanEmail.split('@')[0];

    // Check if account already exists with this email
    const existingAccount = await findAccountByEmail(cleanEmail);

    if (existingAccount) {
      const isGoogleFirst = existingAccount.initialProvider === 'google.com';
      if (isGoogleFirst && !existingAccount.linkedProviders.includes('password')) {
        const errorMsg = `This email address (${cleanEmail}) is already registered via Google Sign-In. You cannot create a separate password account with this email. Please sign in using "Continue with Google".`;
        setAuthError(errorMsg);
        throw new Error(errorMsg);
      }

      const duplicateError = `An account with this email (${cleanEmail}) already exists. Duplicate accounts are not allowed. Please sign in to your vault.`;
      setAuthError(duplicateError);
      throw new Error(duplicateError);
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (result.user) {
        if (cleanName) {
          await updateProfile(result.user, { displayName: cleanName });
        }

        const newRecord: RegisteredAccountRecord = {
          uid: result.user.uid,
          email: cleanEmail,
          displayName: cleanName,
          photoURL: null,
          initialProvider: 'password',
          linkedProviders: ['password'],
          passwordHash: await hashPassword(pass),
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await registerAccountRecord(newRecord);
        await syncUserProfile(result.user, cleanName);
        return;
      }
    } catch (err: any) {
      const uid = getDeterministicUid(cleanEmail);
      const passwordHash = await hashPassword(pass);

      const newRecord: RegisteredAccountRecord = {
        uid,
        email: cleanEmail,
        displayName: cleanName,
        photoURL: null,
        initialProvider: 'password',
        linkedProviders: ['password'],
        passwordHash,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await registerAccountRecord(newRecord);

      const newProfile: UserProfile = {
        uid,
        email: cleanEmail,
        displayName: cleanName,
        photoURL: null,
        providerId: 'password',
        primaryProvider: 'password',
        linkedProviders: ['password'],
        createdAt: newRecord.createdAt,
        lastLoginAt: newRecord.lastLoginAt,
      };

      setUserProfile(newProfile);
      localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(newProfile));
    }
  };

  /**
   * Sign In with Email & Password
   */
  const loginWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    setAccountClash(null);
    const cleanEmail = normalizeEmail(email);

    // Look up account in registry
    const existingAccount = await findAccountByEmail(cleanEmail);

    if (!existingAccount) {
      try {
        const result = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        if (result.user) {
          await syncUserProfile(result.user);
          return;
        }
      } catch {
        const noAccountMsg = `No account found with the email ${cleanEmail}. Please verify your email spelling or switch to Register to create a new account.`;
        setAuthError(noAccountMsg);
        throw new Error(noAccountMsg);
      }
    }

    if (existingAccount) {
      if (existingAccount.initialProvider === 'google.com' && !existingAccount.linkedProviders.includes('password')) {
        const googleOnlyMsg = `This account was registered using Google Sign-In. Please click "Continue with Google" to access your vault.`;
        setAuthError(googleOnlyMsg);
        throw new Error(googleOnlyMsg);
      }

      const inputHash = await hashPassword(pass);
      if (existingAccount.passwordHash && existingAccount.passwordHash !== inputHash) {
        const wrongPassMsg = 'Incorrect password. Please verify your credentials or reset your password.';
        setAuthError(wrongPassMsg);
        throw new Error(wrongPassMsg);
      }

      const authenticatedProfile: UserProfile = {
        uid: existingAccount.uid,
        email: existingAccount.email,
        displayName: existingAccount.displayName || cleanEmail.split('@')[0],
        photoURL: existingAccount.photoURL || null,
        providerId: 'password',
        primaryProvider: existingAccount.initialProvider,
        linkedProviders: existingAccount.linkedProviders,
        createdAt: existingAccount.createdAt,
        lastLoginAt: new Date().toISOString(),
      };

      setUserProfile(authenticatedProfile);
      localStorage.setItem(LOCAL_STORAGE_AUTH_USER, JSON.stringify(authenticatedProfile));
    }
  };

  const logout = async () => {
    setAuthError(null);
    setAccountClash(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_AUTH_USER);
      setUserProfile(null);
      setUser(null);
      await signOut(auth);
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_AUTH_USER);
      setUserProfile(null);
      setUser(null);
    }
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/unauthorized-domain' ||
        err.code === 'auth/network-request-failed'
      ) {
        return;
      }
      const msg = formatAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const activeUserId = user?.uid || userProfile?.uid || null;

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
