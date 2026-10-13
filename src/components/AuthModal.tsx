import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ColorTheme, THEMES } from '../types/theme';

interface AuthModalProps {
  theme?: ColorTheme;
}

export default function AuthModal({ theme = 'blue' }: AuthModalProps) {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    loginWithEmail, 
    loginWithGoogle, 
    loginWithFacebook 
  } = useAuth();

  const themeConfig = THEMES[theme || 'blue'];

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Kripya valid email address enter karein.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password kam az kam 6 characters ka hona chahiye.');
      return;
    }

    setLoadingAction('email');
    try {
      await loginWithEmail(email, password, mode === 'signup' ? name : undefined);
    } catch {
      setError('Login me problem aayi, kripya dubara try karein.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoadingAction('google');
    try {
      await loginWithGoogle();
    } catch {
      setError('Google sign-in fail ho gaya.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFacebookLogin = async () => {
    setError(null);
    setLoadingAction('facebook');
    try {
      await loginWithFacebook();
    } catch {
      setError('Facebook sign-in fail ho gaya.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background click to close */}
      <div className="fixed inset-0" onClick={closeAuthModal} />

      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl text-white z-10 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-gradient-to-b ${themeConfig.glowColor} rounded-full blur-2xl pointer-events-none`} />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5 relative">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${themeConfig.primaryGradient} text-slate-950 font-black text-xs flex items-center justify-center shadow-md`}>
              26
            </div>
            <div>
              <h3 className="font-extrabold text-base md:text-lg text-white leading-tight">
                {mode === 'signin' ? 'Sign In to Account' : 'Create 2026 Account'}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                SEO · AEO · AIO · GEO Platform
              </p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full border border-slate-700/80 hover:border-slate-500 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Login Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers: Sign In vs Sign Up */}
        <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Social Authentication Buttons */}
        <div className="space-y-2.5 mb-5">
          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={!!loadingAction}
            className="w-full bg-slate-950/90 hover:bg-slate-850 text-slate-200 border border-slate-750 hover:border-slate-600 px-4 py-3 rounded-2xl font-medium text-xs flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-75 shadow-xs"
          >
            {loadingAction === 'google' ? (
              <div className={`w-4 h-4 border-2 ${themeConfig.accentBorder.replace('border-', 'border-t-').replace('/30', '')} border-t-transparent rounded-full animate-spin`} />
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
            <span className="font-semibold">Continue with Google</span>
          </button>

          {/* Continue with Facebook */}
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={!!loadingAction}
            className="w-full bg-[#1877F2]/15 hover:bg-[#1877F2]/25 text-blue-200 border border-[#1877F2]/40 hover:border-[#1877F2]/60 px-4 py-3 rounded-2xl font-medium text-xs flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-75 shadow-xs"
          >
            {loadingAction === 'facebook' ? (
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            <span className="font-semibold text-blue-100">Continue with Facebook</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            OR WITH EMAIL
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Muhammad Anas"
                  className={`w-full bg-slate-950/90 border border-slate-750 focus:${themeConfig.accentBorder} rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors`}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className={`w-full bg-slate-950/90 border border-slate-750 focus:${themeConfig.accentBorder} rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors`}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-mono uppercase text-slate-400">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`text-[11px] font-mono ${themeConfig.accentText} hover:opacity-80 flex items-center gap-1 cursor-pointer`}
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show Password</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full bg-slate-950/90 border border-slate-750 focus:${themeConfig.accentBorder} rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!!loadingAction}
            className={`w-full bg-gradient-to-r ${themeConfig.primaryGradient} hover:${themeConfig.primaryHover} text-slate-950 font-bold py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all disabled:opacity-75 mt-2`}
          >
            {loadingAction === 'email' ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In Now' : 'Create Account Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Login Shortcut */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Instant Access:</span>
          <button
            type="button"
            onClick={() => {
              loginWithEmail('muhammadanasmughal428@gmail.com', 'demo2026pass', 'Muhammad Anas Mughal');
            }}
            className={`${themeConfig.accentText} hover:underline font-mono text-xs font-bold flex items-center gap-1 cursor-pointer`}
          >
            <Sparkles className={`w-3 h-3 ${themeConfig.accentText}`} />
            <span>⚡ 1-Click Anas Mughal Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
