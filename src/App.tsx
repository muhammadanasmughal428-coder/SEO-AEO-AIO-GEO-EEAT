/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import SeoAeoAioGeoLiveDemo from "./components/SeoAeoAioGeoLiveDemo";
import SeoAeoAioGeoPage from "./components/SeoAeoAioGeoPage";
import ProfessionalSiteAuditor from "./components/ProfessionalSiteAuditor";
import ThemeSelector from "./components/ThemeSelector";
import UserHeaderMenu from "./components/UserHeaderMenu";
import AuthModal from "./components/AuthModal";
import ProfileModal from "./components/ProfileModal";
import { AuthProvider } from "./context/AuthContext";
import { ColorTheme, THEMES } from "./types/theme";

export default function App() {
  const [activeView, setActiveView] = useState<'demo' | 'auditor' | 'full'>('demo');
  const [theme, setTheme] = useState<ColorTheme>('blue');
  const themeConfig = THEMES[theme];

  // Self-referential canonical tag sync to prevent cross-domain audit errors
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const fullUrl = window.location.origin + window.location.pathname;
        let canonicalTag = document.querySelector('link[rel="canonical"]');
        if (!canonicalTag) {
          canonicalTag = document.createElement('link');
          canonicalTag.setAttribute('rel', 'canonical');
          document.head.appendChild(canonicalTag);
        }
        canonicalTag.setAttribute('href', fullUrl);

        let ogUrlTag = document.querySelector('meta[property="og:url"]');
        if (ogUrlTag) {
          ogUrlTag.setAttribute('content', fullUrl);
        }
      }
    } catch (e) {
      console.warn('Canonical sync error:', e);
    }
  }, []);

  return (
    <AuthProvider>
      <div className="relative selection:bg-blue-500 selection:text-white">
        {/* Global Auth & Profile Modals */}
        <AuthModal theme={theme} />
        <ProfileModal theme={theme} />

        {activeView === 'auditor' && (
          <div className="min-h-screen bg-[#070b14] p-4 md:p-10 font-sans text-slate-100">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-xl">
                <span className={`font-mono font-bold text-xs md:text-sm ${themeConfig.accentText} flex items-center gap-1.5`}>
                  <span>⚡</span> STANDALONE PROFESSIONAL SITE AUDITOR
                </span>
                <div className="flex items-center gap-2">
                  {/* ThemeSelector is hidden but logic is preserved in code as requested */}
                  <div className="hidden">
                    <ThemeSelector currentTheme={theme} onSelectTheme={setTheme} />
                  </div>
                  <UserHeaderMenu theme={theme} />
                  <button
                    onClick={() => setActiveView('demo')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-colors cursor-pointer"
                  >
                    🔴 Live Action Demo
                  </button>
                  <button
                    onClick={() => setActiveView('full')}
                    className={`bg-gradient-to-r ${themeConfig.primaryGradient} hover:${themeConfig.primaryHover} text-slate-950 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-sm`}
                  >
                    ★ Full Platform
                  </button>
                </div>
              </div>

              <ProfessionalSiteAuditor theme={theme} />
            </div>
          </div>
        )}

        {activeView === 'full' && (
          <div className="relative">
            <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
              <button
                onClick={() => setActiveView('auditor')}
                className={`bg-slate-900/95 hover:bg-slate-850 ${themeConfig.accentText} border border-slate-700 px-4 py-2.5 rounded-full font-mono font-bold text-xs shadow-2xl cursor-pointer transition-all active:scale-95 backdrop-blur-md`}
              >
                ⚡ Site Auditor
              </button>
              <button
                onClick={() => setActiveView('demo')}
                className={`bg-gradient-to-r ${themeConfig.primaryGradient} hover:${themeConfig.primaryHover} text-slate-950 px-5 py-2.5 rounded-full font-mono font-black text-xs shadow-2xl cursor-pointer transition-all active:scale-95 flex items-center gap-2`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                <span>Live Action Demo</span>
              </button>
            </div>
            <SeoAeoAioGeoPage theme={theme} onThemeChange={setTheme} />
          </div>
        )}

        {activeView === 'demo' && (
          <SeoAeoAioGeoLiveDemo 
            onSwitchToFullSite={() => setActiveView('full')} 
            onSwitchToAuditor={() => setActiveView('auditor')}
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
      </div>
    </AuthProvider>
  );
}
