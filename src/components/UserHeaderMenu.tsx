import React from 'react';
import { User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ColorTheme, THEMES } from '../types/theme';

interface UserHeaderMenuProps {
  theme?: ColorTheme;
}

export default function UserHeaderMenu({ theme = 'blue' }: UserHeaderMenuProps) {
  const { user, isAuthenticated, openAuthModal, openProfileModal } = useAuth();
  const themeConfig = THEMES[theme || 'blue'];

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={openAuthModal}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-slate-600 text-xs font-mono font-bold text-slate-200 transition-all shadow-sm cursor-pointer whitespace-nowrap"
        title="Sign In or Register"
      >
        <User className={`w-3.5 h-3.5 ${themeConfig.accentText}`} />
        <span>Sign In</span>
      </button>
    );
  }

  // Get initials for fallback avatar
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (fullName[0] || 'U').toUpperCase();
  };

  return (
    <button
      onClick={openProfileModal}
      className={`flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:${themeConfig.accentBorder} text-xs font-mono transition-all shadow-sm cursor-pointer backdrop-blur-md`}
      title="Open User Profile & Settings"
      aria-label="User Profile"
    >
      <div className="w-6 h-6 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center shrink-0 bg-slate-950">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${themeConfig.primaryGradient} text-slate-950 font-black text-[10px] flex items-center justify-center`}>
            {getInitials(user.name)}
          </div>
        )}
      </div>

      <div className="text-left hidden sm:block">
        <span className="font-bold text-white text-xs block truncate max-w-[110px] leading-tight">
          {user.name.split(' ')[0]}
        </span>
        <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5 leading-none">
          <ShieldCheck className="w-2.5 h-2.5" />
          <span>Profile</span>
        </span>
      </div>

      <span className="text-slate-400 text-[10px] hidden sm:inline">▾</span>
    </button>
  );
}
