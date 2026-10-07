import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Check, 
  User, 
  Mail, 
  Briefcase, 
  Globe, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  Award,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ColorTheme, THEMES } from '../types/theme';

interface ProfileModalProps {
  theme?: ColorTheme;
}

// 6 Self-contained preset avatars using high-quality SVG data URIs
const PRESET_AVATARS = [
  {
    id: 'avatar-1',
    label: 'Cyber Executive',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%232563eb"/><stop offset="100%" stop-color="%231e40af"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g1)"/><circle cx="50" cy="38" r="18" fill="%230f172a"/><path d="M22 84c0-16 12-26 28-26s28 10 28 26" fill="%230f172a"/><circle cx="50" cy="38" r="14" fill="%23f8fafc"/></svg>',
  },
  {
    id: 'avatar-2',
    label: 'AI Architect',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%234338ca"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g2)"/><circle cx="50" cy="38" r="18" fill="%23ffffff"/><path d="M22 84c0-16 12-26 28-26s28 10 28 26" fill="%23ffffff"/></svg>',
  },
  {
    id: 'avatar-3',
    label: 'Growth Sage',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%23047857"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g3)"/><circle cx="50" cy="38" r="18" fill="%230f172a"/><path d="M22 84c0-16 12-26 28-26s28 10 28 26" fill="%230f172a"/><circle cx="50" cy="38" r="14" fill="%23a7f3d0"/></svg>',
  },
  {
    id: 'avatar-4',
    label: 'Royal Amethyst',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23a855f7"/><stop offset="100%" stop-color="%237e22ce"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g4)"/><circle cx="50" cy="38" r="18" fill="%23ffffff"/><path d="M22 84c0-16 12-26 28-26s28 10 28 26" fill="%23ffffff"/></svg>',
  },
  {
    id: 'avatar-5',
    label: 'Obsidian Noir',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23334155"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g5)"/><circle cx="50" cy="38" r="18" fill="%23fbbf24"/><path d="M22 84c0-16 12-26 28-26s28 10 28 26" fill="%23fbbf24"/></svg>',
  },
  {
    id: 'avatar-6',
    label: 'Sunset Coral',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f43f5e"/><stop offset="100%" stop-color="%23fb923c"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g6)"/><circle cx="50" cy="38" r="18" fill="%23ffffff"/><path d="M22 84c0-16 12-26 28-26s28 10 28 26" fill="%23ffffff"/></svg>',
  },
];

export default function ProfileModal({ theme = 'blue' }: ProfileModalProps) {
  const { 
    user, 
    isProfileModalOpen, 
    closeProfileModal, 
    updateProfile, 
    updateAvatar, 
    logout 
  } = useAuth();

  const themeConfig = THEMES[theme || 'blue'];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [photoSavedToast, setPhotoSavedToast] = useState(false);

  // Sync state if user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
      setWebsite(user.website || '');
    }
  }, [user]);

  if (!isProfileModalOpen || !user) return null;

  // Handle local photo upload from computer/phone
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size 5MB se kam honi chahiye.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        // Automatically save to state & localStorage
        updateAvatar(dataUrl);
        setPhotoSavedToast(true);
        setTimeout(() => setPhotoSavedToast(false), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (dataUrl: string) => {
    updateAvatar(dataUrl);
    setPhotoSavedToast(true);
    setTimeout(() => setPhotoSavedToast(false), 3000);
  };

  const handleRemovePhoto = () => {
    updateAvatar('');
    setPhotoSavedToast(true);
    setTimeout(() => setPhotoSavedToast(false), 3000);
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      role,
      website,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Get user initials for fallback avatar
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (fullName[0] || 'U').toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background click */}
      <div className="fixed inset-0" onClick={closeProfileModal} />

      <div className="relative w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl text-white z-10 max-h-[92vh] overflow-y-auto">
        {/* Ambient Glow */}
        <div className={`absolute top-0 right-1/4 w-80 h-40 bg-gradient-to-b ${themeConfig.glowColor} rounded-full blur-2xl pointer-events-none`} />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6 relative">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${themeConfig.primaryGradient} text-slate-950 font-black text-xs flex items-center justify-center shadow-md`}>
              26
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white leading-tight">
                User Profile & Credentials
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                E-E-A-T Verified Authority Identity
              </p>
            </div>
          </div>

          <button
            onClick={closeProfileModal}
            className="w-8 h-8 rounded-full border border-slate-700/80 hover:border-slate-500 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Profile Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Photo Saved Toast Alert */}
        {photoSavedToast && (
          <div className="mb-5 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>✓ Photo change ho gayi aur automatically SAVE ho gayi hai!</span>
          </div>
        )}

        {/* SECTION 1: PHOTO UPLOAD & CHANGE (Mandatory User Requirement) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar Preview Box */}
            <div className="relative group shrink-0">
              <div className={`w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-700 hover:${themeConfig.accentBorder} transition-colors bg-slate-900 flex items-center justify-center shadow-xl`}>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${themeConfig.primaryGradient} text-slate-950 flex items-center justify-center font-black text-3xl`}>
                    {getInitials(user.name)}
                  </div>
                )}
              </div>

              {/* Quick overlay change button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-mono text-white transition-opacity cursor-pointer gap-1"
                title="Upload Photo"
              >
                <Camera className={`w-5 h-5 ${themeConfig.accentText}`} />
                <span>Change</span>
              </button>
            </div>

            {/* Photo Action Controls */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-base text-white">{user.name}</span>
                <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Apni profile picture upload karein. Picture automatically save ho jayegi aur page reload ke baad bi rahay gi.
              </p>

              {/* Upload & Remove Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`bg-gradient-to-r ${themeConfig.primaryGradient} hover:${themeConfig.primaryHover} text-slate-950 px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose & Upload Photo</span>
                </button>

                {user.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Preset Avatars Picker */}
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <span className="block text-[11px] font-mono uppercase text-slate-400 mb-2">
              Or Choose Instant Verified Preset Avatar:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_AVATARS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPresetAvatar(preset.dataUrl)}
                  className={`w-10 h-10 rounded-xl overflow-hidden border-2 border-slate-800 hover:${themeConfig.accentBorder} hover:scale-105 transition-all p-0.5 bg-slate-900 cursor-pointer shadow-sm`}
                  title={preset.label}
                >
                  <img src={preset.dataUrl} alt={preset.label} className="w-full h-full rounded-lg" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: EDIT PROFILE FORM */}
        <form onSubmit={handleSaveDetails} className="space-y-4 mb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-750 focus:${themeConfig.accentBorder} rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none transition-colors`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Email (Account Identifier)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-400 focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Professional Role / Title
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Briefcase className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. SEO & GEO Consultant"
                  className={`w-full bg-slate-950 border border-slate-750 focus:${themeConfig.accentBorder} rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none transition-colors`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Website / Domain URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full bg-slate-950 border border-slate-750 focus:${themeConfig.accentBorder} rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none transition-colors`}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-2">
            {saveSuccess ? (
              <span className="text-emerald-400 font-mono text-xs flex items-center gap-1 font-bold">
                <Check className="w-4 h-4" /> Details Saved Successfully!
              </span>
            ) : (
              <span className="text-slate-500 font-mono text-[11px]">
                Connected via {user.authProvider.toUpperCase()}
              </span>
            )}

            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
            >
              Save Profile Changes
            </button>
          </div>
        </form>

        {/* SECTION 3: E-E-A-T CREDENTIALS DASHBOARD */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5 font-bold">
              <Award className={`w-4 h-4 ${themeConfig.accentText}`} />
              <span>E-E-A-T Trust Index Badges</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Active Member
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400">Trust Score</div>
              <div className={`text-xl font-black ${themeConfig.accentText} mt-0.5`}>{user.eeatTrustScore}%</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400">Audits Run</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{user.auditsCompleted}</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400">Member Since</div>
              <div className="text-xs font-bold text-white mt-1.5">{user.joinedDate}</div>
            </div>
          </div>
        </div>

        {/* SECTION 4: LOGOUT BUTTON */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500">
            User ID: {user.id}
          </span>

          <button
            type="button"
            onClick={logout}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
