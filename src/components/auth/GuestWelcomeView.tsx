import React from 'react';
import {
  Shield,
  Lock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  ScanLine,
  Layers,
  Sparkle,
} from 'lucide-react';

interface GuestWelcomeViewProps {
  onOpenAuthModal: (mode: 'signin' | 'register') => void;
}

export const GuestWelcomeView: React.FC<GuestWelcomeViewProps> = ({ onOpenAuthModal }) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-black/[0.08] p-8 md:p-12 shadow-sm">
        {/* Subtle background ambient lights */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-gradient-to-br from-[#007AFF]/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-gradient-to-tr from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/20 text-[#007AFF] text-xs font-semibold tracking-tight">
            <Shield className="w-3.5 h-3.5" />
            <span>Encrypted Hobby Asset Management</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1C1C1E] leading-[1.15]">
            Your Private Collectibles & TCG Asset Vault
          </h1>

          <p className="text-sm sm:text-base text-[#8E8E93] leading-relaxed max-w-2xl">
            Track, grade, and evaluate your Pokémon, Beyblade X, Magic: The Gathering, and One Piece collections with live API market data from Scryfall, TCGdex, and Takara Tomy Live.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="guest-signin-btn"
              onClick={() => onOpenAuthModal('signin')}
              className="px-6 py-3 rounded-2xl bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.99] text-white text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In to Your Vault</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="guest-register-btn"
              onClick={() => onOpenAuthModal('register')}
              className="px-6 py-3 rounded-2xl bg-[#F2F2F7] hover:bg-[#E5E5EA] active:scale-[0.99] text-[#1C1C1E] text-sm font-semibold border border-black/[0.06] transition-all flex items-center gap-2"
            >
              <span>Create Collector Account</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-[#8E8E93] border-t border-black/[0.06]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero data leaks before sign in</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Strict duplicate account rejection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Direct Encrypted Credentials</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>PostgreSQL Cloud SQL Persistence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Capabilities Preview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-black/[0.08] space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-semibold">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-xs text-[#1C1C1E]">Multi-Category Sandboxing</h3>
          <p className="text-[11px] text-[#8E8E93] leading-relaxed">
            Separate your Pokémon slabs, Beyblade X blades, MTG reserve lists, and One Piece Manga Rares.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-black/[0.08] space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#007AFF] flex items-center justify-center font-semibold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-xs text-[#1C1C1E]">Live Verified APIs</h3>
          <p className="text-[11px] text-[#8E8E93] leading-relaxed">
            Scryfall Live, TCGdex official, and Takara Tomy indexes keep your valuations synced in real-time.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-black/[0.08] space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-semibold">
            <ScanLine className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-xs text-[#1C1C1E]">AI Vision Grading</h3>
          <p className="text-[11px] text-[#8E8E93] leading-relaxed">
            Gemini Flash grading assistant detects centering, surface scratches, and edges on raw cards.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-black/[0.08] space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-xs text-[#1C1C1E]">Privacy & Isolation</h3>
          <p className="text-[11px] text-[#8E8E93] leading-relaxed">
            Your portfolio is completely hidden before sign in. Assets are isolated per authenticated user ID.
          </p>
        </div>
      </div>
    </div>
  );
};
