import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const {
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    authError,
    clearAuthError,
  } = useAuth();

  // Mode: 'signin' | 'register' | 'forgot'
  const [subMode, setSubMode] = useState<'signin' | 'register' | 'forgot'>(
    initialMode === 'register' ? 'register' : initialMode === 'forgot' ? 'forgot' : 'signin'
  );

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleModeSwitch = (mode: 'signin' | 'register' | 'forgot') => {
    clearAuthError();
    setLocalError(null);
    setSuccessMessage(null);
    setSubMode(mode);
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

    if (subMode === 'forgot') {
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

    if (subMode === 'register') {
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
        {/* Header bar */}
        <div className="px-6 pt-5 pb-3.5 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#007AFF] flex items-center justify-center shadow-sm text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#1C1C1E] tracking-tight">
                {subMode === 'register'
                  ? 'Create Collector Account'
                  : subMode === 'forgot'
                  ? 'Reset Password'
                  : 'Sign In to Your Vault'}
              </h3>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                {subMode === 'register'
                  ? 'Cloud SQL PostgreSQL synced portfolio storage'
                  : subMode === 'forgot'
                  ? 'Enter your registered email address'
                  : 'Access your private cards, slabs & items'}
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

        {/* Sub-mode selector: Sign In vs Register */}
        <div className="px-6 pt-4 pb-1">
          <div className="flex justify-center gap-1 p-1 bg-[#F2F2F7] rounded-xl text-xs font-semibold">
            <button
              type="button"
              id="auth-mode-signin-btn"
              onClick={() => handleModeSwitch('signin')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                subMode === 'signin'
                  ? 'bg-white text-[#1C1C1E] shadow-sm font-bold'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="auth-mode-register-btn"
              onClick={() => handleModeSwitch('register')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                subMode === 'register'
                  ? 'bg-white text-[#1C1C1E] shadow-sm font-bold'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Errors / Success Alerts */}
          {activeError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex-1 leading-relaxed">
                <div className="font-semibold mb-0.5">Notice</div>
                {activeError}
              </div>
              <button
                onClick={() => {
                  clearAuthError();
                  setLocalError(null);
                }}
                className="text-amber-800 hover:text-amber-950 font-bold text-xs"
              >
                ×
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {subMode === 'register' && (
              <div>
                <label className="text-[11px] font-bold text-[#1C1C1E] block mb-1">
                  Collector Full Name or Alias
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Poly Collector"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-black/[0.1] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-[#1C1C1E] block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="collector@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-black/[0.1] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>
            </div>

            {subMode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#1C1C1E]">Password</label>
                  {subMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('forgot')}
                      className="text-[11px] text-[#007AFF] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-white border border-black/[0.1] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1C1C1E]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {subMode === 'register' && (
              <div>
                <label className="text-[11px] font-bold text-[#1C1C1E] block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-black/[0.1] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              id="submit-auth-btn"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {subMode === 'register'
                      ? 'Create Account'
                      : subMode === 'forgot'
                      ? 'Send Recovery Email'
                      : 'Sign In to Vault'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
