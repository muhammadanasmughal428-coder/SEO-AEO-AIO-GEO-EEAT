export type ColorTheme = 'gold' | 'neon' | 'emerald' | 'amethyst' | 'blue';

export interface ThemeConfig {
  id: ColorTheme;
  name: string;
  tagline: string;
  primaryGradient: string;
  primaryHover: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  glowColor: string;
  cardBorderHover: string;
  badgeBg: string;
  badgeText: string;
}

export const THEMES: Record<ColorTheme, ThemeConfig> = {
  blue: {
    id: 'blue',
    name: 'Electric Blue',
    tagline: 'Deep Ocean & Azure',
    primaryGradient: 'from-blue-600 via-blue-500 to-sky-400',
    primaryHover: 'from-blue-500 via-blue-400 to-sky-300',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    glowColor: 'from-blue-600/15 via-sky-500/5 to-transparent',
    cardBorderHover: 'hover:border-blue-500/40',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
  },
  gold: {
    id: 'gold',
    name: 'Obsidian Gold',
    tagline: 'Luxe Amber & Midnight',
    primaryGradient: 'from-amber-400 via-amber-300 to-amber-500',
    primaryHover: 'from-amber-300 via-amber-200 to-amber-400',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/30',
    glowColor: 'from-amber-500/15 via-orange-500/5 to-transparent',
    cardBorderHover: 'hover:border-amber-500/40',
    badgeBg: 'bg-amber-400',
    badgeText: 'text-slate-950',
  },
  neon: {
    id: 'neon',
    name: 'Cosmic Cyan',
    tagline: 'Electric Sky & Indigo',
    primaryGradient: 'from-cyan-400 via-sky-300 to-indigo-500',
    primaryHover: 'from-cyan-300 via-sky-200 to-indigo-400',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/30',
    glowColor: 'from-cyan-500/15 via-indigo-500/5 to-transparent',
    cardBorderHover: 'hover:border-cyan-500/40',
    badgeBg: 'bg-cyan-400',
    badgeText: 'text-slate-950',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Mint',
    tagline: 'Growth Sage & Jade',
    primaryGradient: 'from-emerald-400 via-teal-300 to-emerald-500',
    primaryHover: 'from-emerald-300 via-teal-200 to-emerald-400',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/30',
    glowColor: 'from-emerald-500/15 via-teal-500/5 to-transparent',
    cardBorderHover: 'hover:border-emerald-500/40',
    badgeBg: 'bg-emerald-400',
    badgeText: 'text-slate-950',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Royal Violet',
    tagline: 'Deep Amethyst & Purple',
    primaryGradient: 'from-violet-400 via-purple-300 to-fuchsia-500',
    primaryHover: 'from-violet-300 via-purple-200 to-fuchsia-400',
    accentText: 'text-violet-400',
    accentBg: 'bg-violet-500/10',
    accentBorder: 'border-violet-500/30',
    glowColor: 'from-violet-500/15 via-fuchsia-500/5 to-transparent',
    cardBorderHover: 'hover:border-violet-500/40',
    badgeBg: 'bg-violet-400',
    badgeText: 'text-slate-950',
  },
};
