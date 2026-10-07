import React from 'react';
import { Palette, Check } from 'lucide-react';
import { ColorTheme, THEMES } from '../types/theme';

interface ThemeSelectorProps {
  currentTheme: ColorTheme;
  onSelectTheme: (theme: ColorTheme) => void;
  compact?: boolean;
}

export default function ThemeSelector({ currentTheme, onSelectTheme, compact = false }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const active = THEMES[currentTheme];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-slate-600 text-xs font-mono font-medium text-slate-200 transition-all shadow-sm cursor-pointer backdrop-blur-md"
        title="Change Website Color Scheme"
        aria-label="Color Theme Switcher"
      >
        <Palette className={`w-3.5 h-3.5 ${active.accentText}`} />
        <span className="hidden sm:inline text-slate-300 font-semibold">{active.name}</span>
        <span className="sm:hidden text-slate-300 font-semibold">Theme</span>
        <span className="w-2 h-2 rounded-full bg-gradient-to-r shadow-xs animate-pulse" style={{
          background: currentTheme === 'gold' ? '#f59e0b' : currentTheme === 'neon' ? '#06b6d4' : currentTheme === 'emerald' ? '#10b981' : currentTheme === 'blue' ? '#3b82f6' : '#a855f7'
        }} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 border border-slate-800 p-2 shadow-2xl backdrop-blur-xl z-50 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Select Color Palette
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Instant modern theme transformation
              </span>
            </div>

            <div className="space-y-1">
              {(Object.keys(THEMES) as ColorTheme[]).map((themeKey) => {
                const item = THEMES[themeKey];
                const isSelected = currentTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    onClick={() => {
                      onSelectTheme(themeKey);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 text-white font-bold border border-slate-700'
                        : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full border border-white/20 shadow-xs" style={{
                        background: themeKey === 'gold' 
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                          : themeKey === 'neon' 
                          ? 'linear-gradient(135deg, #06b6d4, #6366f1)' 
                          : themeKey === 'emerald' 
                          ? 'linear-gradient(135deg, #10b981, #059669)' 
                          : themeKey === 'blue'
                          ? 'linear-gradient(135deg, #2563eb, #38bdf8)'
                          : 'linear-gradient(135deg, #a855f7, #d946ef)'
                      }} />
                      <div className="text-left">
                        <div className="text-xs font-semibold">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.tagline}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className={`w-3.5 h-3.5 ${item.accentText}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
