import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { ShieldCheck, Mail, Lock, User, Building, ArrowRight, CheckCircle2, AlertCircle, Sparkles, KeyRound } from 'lucide-react';

export function AuthScreen() {
  const { login, register, loginWithOAuth, forgotPassword, resetPassword, error, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Custom Google account picker modal state
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('muhammadanasmughal428@gmail.com');
  const [customGoogleName, setCustomGoogleName] = useState('Muhammad Anas Mughal');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setStatusNotice(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setIsSubmitting(false);
        }
      } else if (mode === 'register') {
        const res = await register({ email, password, name, company });
        if (!res.success) {
          setIsSubmitting(false);
        }
      } else if (mode === 'forgot') {
        const res = await forgotPassword(email);
        setIsSubmitting(false);
        if (res.success) {
          setStatusNotice(res.message || 'Reset token generated.');
          if (res.resetToken) {
            setResetToken(res.resetToken);
            setMode('reset');
          }
        }
      } else if (mode === 'reset') {
        const res = await resetPassword(email, resetToken, newPassword);
        setIsSubmitting(false);
        if (res.success) {
          setStatusNotice('Password updated successfully! Please sign in with your new password.');
          setMode('login');
        }
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook', directEmail?: string, directName?: string) => {
    clearError();
    setStatusNotice(null);
    setIsSubmitting(true);
    const res = await loginWithOAuth(provider, directEmail, directName);
    setIsSubmitting(false);
    if (res.success) {
      setShowGooglePicker(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    clearError();
    setStatusNotice(`Credentials pre-filled for ${demoEmail}. Click "Sign In to Dashboard" to proceed.`);
  };

  return (
    <div id="auth-page-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background ambient gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20 mb-4 border border-blue-400/30">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          SEO AEO AIO GEO E-E-A-T Auditor
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enterprise Search, Answer, AI Discovery & Trust Evaluation Platform
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl p-6 sm:p-8">

          {/* Quick 1-Click Verification / Demo Banner */}
          <div className="mb-6 p-3.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-blue-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Instant 1-Click Verified Logins
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30 font-mono">Ready</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Click below to immediately log in with your personal Google account or demo credentials:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                id="quick-login-anas-btn"
                onClick={() => handleOAuthLogin('google', 'muhammadanasmughal428@gmail.com', 'Muhammad Anas Mughal')}
                className="text-left px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-750 text-slate-200 rounded-lg border border-slate-700/80 hover:border-blue-500/60 transition text-[11px] font-medium truncate"
              >
                Google: Anas Mughal
              </button>
              <button
                type="button"
                id="quick-fill-demo-btn"
                onClick={() => fillDemoAccount('demo@auditor.ai', 'demo1234')}
                className="text-left px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-750 text-slate-200 rounded-lg border border-slate-700/80 hover:border-blue-500/60 transition text-[11px] font-medium truncate"
              >
                Demo: Alex Rivera
              </button>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-2.5 mb-6">
            <button
              type="button"
              id="google-oauth-btn"
              disabled={isSubmitting}
              onClick={() => setShowGooglePicker(true)}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-white text-sm font-medium rounded-xl border border-slate-700 hover:border-slate-600 shadow-sm transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              id="facebook-oauth-btn"
              disabled={isSubmitting}
              onClick={() => handleOAuthLogin('facebook', 'anas.facebook@example.com', 'Muhammad Anas')}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-blue-200 text-sm font-medium rounded-xl border border-[#1877F2]/40 shadow-sm transition disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-current text-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continue with Facebook
            </button>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 font-semibold tracking-wider">
                Or Continue with Email
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-800 mb-6 text-sm">
            <button
              type="button"
              id="tab-login-btn"
              onClick={() => { setMode('login'); clearError(); setStatusNotice(null); }}
              className={`flex-1 py-2 text-center font-medium border-b-2 transition ${
                mode === 'login' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="tab-register-btn"
              onClick={() => { setMode('register'); clearError(); setStatusNotice(null); }}
              className={`flex-1 py-2 text-center font-medium border-b-2 transition ${
                mode === 'register' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error & Notice Banners */}
          {error && (
            <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {statusNotice && (
            <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      id="register-name-input"
                      required
                      placeholder="e.g. Muhammad Anas Mughal"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Company / Agency (Optional)</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      id="register-company-input"
                      placeholder="e.g. Enterprise SEO Agency"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    id="auth-email-input"
                    required
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      id="forgot-password-link"
                      onClick={() => { setMode('forgot'); clearError(); }}
                      className="text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    id="auth-password-input"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Verification Reset Token</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      id="reset-token-input"
                      required
                      placeholder="Paste reset token"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      id="reset-newpassword-input"
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              id="auth-submit-btn"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In to Dashboard'}
                    {mode === 'register' && 'Complete Registration'}
                    {mode === 'forgot' && 'Send Reset Token'}
                    {mode === 'reset' && 'Confirm New Password'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                id="back-to-signin-btn"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 mt-2 py-1"
              >
                Back to Sign In
              </button>
            )}
          </form>
        </div>

        {/* Security / System Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>Protected by SSRF Defense & TLS Encryption</p>
          <p>Audits perform live HTTP inspections with verifiable evidence.</p>
        </div>
      </div>

      {/* Google Account Selector Modal */}
      {showGooglePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="font-semibold text-white text-base">Select Google Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGooglePicker(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select or customize the Google/Gmail account to authenticate into the platform:
            </p>

            {/* Quick pre-set account option */}
            <div
              onClick={() => handleOAuthLogin('google', 'muhammadanasmughal428@gmail.com', 'Muhammad Anas Mughal')}
              className="flex items-center gap-3 p-3 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-blue-500 rounded-xl cursor-pointer transition"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                MA
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Muhammad Anas Mughal</p>
                <p className="text-xs text-slate-400 truncate">muhammadanasmughal428@gmail.com</p>
              </div>
              <span className="text-xs text-blue-400 font-medium">Use Account</span>
            </div>

            {/* Custom Google Email input */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs text-slate-300 mb-1">Or enter any custom Google account email:</label>
              <div className="space-y-2">
                <input
                  type="email"
                  id="custom-google-email-input"
                  placeholder="your.email@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500"
                />
                <input
                  type="text"
                  id="custom-google-name-input"
                  placeholder="Display Name"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500"
                />
                <button
                  type="button"
                  id="confirm-custom-google-btn"
                  onClick={() => handleOAuthLogin('google', customGoogleEmail, customGoogleName)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition"
                >
                  Sign in with this Google ID
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
