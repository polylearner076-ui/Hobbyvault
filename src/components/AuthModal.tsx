import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Shield,
  KeyRound,
  Zap,
} from 'lucide-react';
import { useAuth, DEMO_COLLECTORS, DemoCollector } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'register' | 'forgot' | 'demo';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const {
    signInWithGoogle,
    loginWithEmail,
    registerWithEmail,
    loginWithDemoAccount,
    resetPassword,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register' | 'forgot' | 'demo'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleModeChange = (newMode: 'signin' | 'register' | 'forgot' | 'demo') => {
    clearAuthError();
    setLocalError(null);
    setSuccessMessage(null);
    setMode(newMode);
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.warn('Google sign-in error handled:', err);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleDemoLogin = async (demo: DemoCollector) => {
    setIsSubmitting(true);
    try {
      await loginWithDemoAccount(demo);
      onClose();
    } catch (err: any) {
      setLocalError('Failed to sign in with demo account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLocalError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setIsSubmitting(true);
      try {
        await resetPassword(email);
        setSuccessMessage(`A password reset link has been sent to ${email}. Please check your inbox.`);
      } catch (err: any) {
        setLocalError(err.message || 'Failed to send reset email.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match. Please verify your password.');
        return;
      }

      setIsSubmitting(true);
      try {
        await registerWithEmail(email, password, name);
        onClose();
      } catch (err: any) {
        setLocalError(err.message || 'Failed to create account.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Sign In mode
      setIsSubmitting(true);
      try {
        await loginWithEmail(email, password);
        onClose();
      } catch (err: any) {
        setLocalError(err.message || 'Failed to sign in.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const activeError = localError || authError;
  const isUnauthorizedDomain = activeError?.includes('unauthorized-domain') || activeError?.includes('restricted');

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="auth-modal-container"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-black/[0.08] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="px-6 pt-5 pb-3.5 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#007AFF] to-indigo-600 flex items-center justify-center shadow-sm text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#1C1C1E] tracking-tight">
                {mode === 'signin' && 'Sign In to CollectorVault'}
                {mode === 'register' && 'Create Collector Account'}
                {mode === 'demo' && 'Instant Demo Collector Accounts'}
                {mode === 'forgot' && 'Reset Password'}
              </h3>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                {mode === 'signin' && 'Access and synchronize your personal assets'}
                {mode === 'register' && 'Create your personal encrypted vault'}
                {mode === 'demo' && 'Test isolated account portfolios with one click'}
                {mode === 'forgot' && 'Enter your email to receive recovery link'}
              </p>
            </div>
          </div>

          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        {mode !== 'forgot' && (
          <div className="px-6 pt-3.5 pb-1">
            <div className="flex bg-[#F2F2F7] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-white text-[#1C1C1E] shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-white text-[#1C1C1E] shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('demo')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  mode === 'demo'
                    ? 'bg-white text-[#007AFF] shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Demo</span>
              </button>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Error Alert */}
          {activeError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex-1 leading-relaxed">
                <div className="font-semibold mb-0.5">Authentication Notice</div>
                {activeError}
                {isUnauthorizedDomain && (
                  <div className="mt-2 pt-2 border-t border-amber-200 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleModeChange('register')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 font-semibold text-[#1C1C1E] text-[11px] hover:bg-amber-100/50"
                    >
                      Register with Email
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange('demo')}
                      className="px-2.5 py-1 rounded-lg bg-[#007AFF] text-white font-semibold text-[11px] hover:bg-[#0066D6]"
                    >
                      Use Demo Collector
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setLocalError(null);
                  clearAuthError();
                }}
                className="text-amber-500 hover:text-amber-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Demo Mode List */}
          {mode === 'demo' ? (
            <div className="space-y-3">
              <p className="text-xs text-[#8E8E93]">
                Select a collector profile to instantly sign in and test account-linked vaults and asset isolation:
              </p>

              <div className="space-y-2">
                {DEMO_COLLECTORS.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handleDemoLogin(demo)}
                    disabled={isSubmitting}
                    className="w-full p-3 rounded-2xl bg-[#F8F9FB] hover:bg-[#F2F4F8] border border-black/[0.06] hover:border-[#007AFF]/30 transition-all text-left flex items-center gap-3 group active:scale-[0.99]"
                  >
                    <img
                      src={demo.avatar}
                      alt={demo.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover border border-black/[0.08] shadow-2xs group-hover:ring-2 group-hover:ring-[#007AFF]/30"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#1C1C1E] truncate">
                          {demo.name}
                        </span>
                        <span className="text-[10px] text-[#007AFF] font-semibold bg-[#007AFF]/10 px-2 py-0.5 rounded-full">
                          Instant Login
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8E8E93] truncate">{demo.specialty}</div>
                      <div className="text-[10px] text-[#8E8E93]/80 font-mono truncate mt-0.5">
                        {demo.email}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Google Sign-in Button */}
              {mode !== 'forgot' && (
                <>
                  <button
                    type="button"
                    id="google-signin-btn"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleSubmitting || isSubmitting}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl bg-white hover:bg-[#F9F9FB] border border-black/[0.12] text-[#1C1C1E] text-xs font-semibold shadow-xs hover:shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {isGoogleSubmitting ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-[#007AFF] rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    )}
                    <span>
                      {mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-[1px] bg-black/[0.08]" />
                    <span className="text-[11px] text-[#8E8E93] font-medium uppercase tracking-wider">
                      or with email credentials
                    </span>
                    <div className="flex-1 h-[1px] bg-black/[0.08]" />
                  </div>
                </>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1C1E] mb-1">
                      Full Name / Collector Handle
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ash Ketchum"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F2F2F7]/70 border border-black/[0.08] text-xs font-medium text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1E] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F2F2F7]/70 border border-black/[0.08] text-xs font-medium text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#1C1C1E]">
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => handleModeChange('forgot')}
                          className="text-[11px] text-[#007AFF] hover:underline font-medium"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F2F2F7]/70 border border-black/[0.08] text-xs font-medium text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1C1C1E]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1C1E] mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F2F2F7]/70 border border-black/[0.08] text-xs font-medium text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleSubmitting}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.99] text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {mode === 'signin' && 'Sign In to Vault'}
                        {mode === 'register' && 'Register Account'}
                        {mode === 'forgot' && 'Send Reset Email'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Bottom Switcher */}
          <div className="text-center pt-1 text-xs text-[#8E8E93]">
            {mode === 'forgot' ? (
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className="text-[#007AFF] font-semibold hover:underline"
              >
                Back to Sign In
              </button>
            ) : mode === 'signin' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('register')}
                  className="text-[#007AFF] font-semibold hover:underline"
                >
                  Create one now
                </button>
              </span>
            ) : mode === 'register' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('signin')}
                  className="text-[#007AFF] font-semibold hover:underline"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className="text-[#007AFF] font-semibold hover:underline"
              >
                Or use email & password sign in
              </button>
            )}
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="px-6 py-3 bg-[#FBFBFD] border-t border-black/[0.06] text-[11px] text-[#8E8E93] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Vault Security</span>
          </div>
          <span className="text-[10px] font-mono text-[#8E8E93]">User-Isolated Firestore</span>
        </div>
      </div>
    </div>
  );
};

