import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import type { AuditProject } from '../types.js';
import { ReportView } from './ReportView.js';
import { AuditHistoryView } from './AuditHistoryView.js';
import { AuditRunnerModal } from './AuditRunnerModal.js';
import { UserProfileModal } from './UserProfileModal.js';
import { SettingsModal } from './SettingsModal.js';
import {
  ShieldCheck, Search, History, LayoutDashboard, User, Settings,
  LogOut, Plus, Globe, Sparkles, AlertTriangle, CheckCircle2,
  ExternalLink, ArrowRight, BarChart3, Bot, Award, Compass
} from 'lucide-react';

export function Dashboard() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'report'>('overview');
  const [audits, setAudits] = useState<AuditProject[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditProject | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Fast launcher URL input on overview
  const [quickUrl, setQuickUrl] = useState('');

  // Fetch audits on mount
  const fetchAudits = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/audits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.audits)) {
          setAudits(data.audits);
        }
      }
    } catch (err) {
      console.warn('Failed to load audit history:', err);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [token]);

  const handleAuditCompleted = (newAudit: AuditProject) => {
    setAudits(prev => [newAudit, ...prev]);
    setSelectedAudit(newAudit);
    setActiveTab('report');
  };

  const handleDeleteAudit = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/audits/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAudits(prev => prev.filter(a => a.id !== id));
        if (selectedAudit?.id === id) {
          setSelectedAudit(null);
          setActiveTab('overview');
        }
      }
    } catch (err) {
      console.error('Delete audit failed:', err);
    }
  };

  const handleQuickLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickUrl.trim()) {
      setIsAuditModalOpen(true);
    }
  };

  // Compute KPI statistics
  const completedAudits = audits.filter(a => a.status === 'completed');
  const totalAuditsCount = audits.length;
  const averageScore = completedAudits.length > 0
    ? Math.round(completedAudits.reduce((acc, a) => acc + a.overallAverageScore, 0) / completedAudits.length)
    : 0;

  const totalCriticalIssues = completedAudits.reduce((acc, a) => {
    const pageCrits = a.pages.reduce((pAcc, p) => pAcc + p.findings.filter(f => f.status === 'CRITICAL' || f.status === 'NOT_FOUND').length, 0);
    return acc + pageCrits;
  }, 0);

  return (
    <div id="saas-dashboard-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top SaaS Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">SEO AEO AIO GEO E-E-A-T</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                  SaaS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Algorithmic Search & AI Auditor</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              id="nav-overview-btn"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview
            </button>
            <button
              id="nav-history-btn"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'history' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit History ({audits.length})
            </button>
            {selectedAudit && (
              <button
                id="nav-reports-btn"
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'report' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Active Report
              </button>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="new-audit-header-btn"
              onClick={() => setIsAuditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Audit</span>
            </button>

            {/* Profile trigger */}
            <button
              id="profile-dropdown-btn"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 p-1.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition"
              title="View Account Profile"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.slice(0, 2).toUpperCase() || 'U'
                )}
              </div>
              <span className="hidden lg:inline text-xs font-medium text-slate-200 max-w-[120px] truncate">
                {user?.name || user?.email}
              </span>
            </button>

            {/* Settings button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout button */}
            <button
              id="logout-btn"
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero Fast Launcher Bar */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800/90 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-2xl space-y-2 mb-6">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Deep Verifiable Search & AI Engine Audit
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Audit Any Website Across 5 Critical Search Dimensions
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Real HTTP crawling with SSRF protection, full DOM analysis, robots.txt & sitemap checks, and grounded algorithmic scoring for SEO, AEO, AIO, GEO & E-E-A-T.
                </p>
              </div>

              {/* URL Input Bar */}
              <form onSubmit={handleQuickLaunch} className="flex flex-col sm:flex-row items-center gap-2 max-w-3xl">
                <div className="relative flex-1 w-full">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    id="quick-audit-url-input"
                    placeholder="Enter website URL (e.g. https://example.com)"
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  id="quick-run-audit-btn"
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Run Full Audit</span>
                </button>
              </form>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl space-y-1 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Audits Run</span>
                <div className="text-2xl font-black text-white">{totalAuditsCount}</div>
                <p className="text-[11px] text-slate-500">Persistent user history</p>
              </div>

              <div className="p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl space-y-1 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Compliance Index</span>
                <div className={`text-2xl font-black ${averageScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {averageScore > 0 ? `${averageScore} / 100` : 'N/A'}
                </div>
                <p className="text-[11px] text-slate-500">Cross-pillar audit mean</p>
              </div>

              <div className="p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl space-y-1 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Critical Remediations</span>
                <div className="text-2xl font-black text-rose-400">{totalCriticalIssues}</div>
                <p className="text-[11px] text-slate-500">Requires immediate attention</p>
              </div>

              <div className="p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl space-y-1 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Engine</span>
                <div className="text-2xl font-black text-blue-400">v2.4 Pro</div>
                <p className="text-[11px] text-slate-500">Full 5-Pillar Matrix</p>
              </div>
            </div>

            {/* Five Pillars Explanation Grid */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white">The 5 Core Audit Pillars Evaluated</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800/80 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                    <Search className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. SEO</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Search Engine Optimization: Meta tags, H1-H3, status code, indexability, canonicals, robots.txt, sitemaps.
                  </p>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800/80 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. AEO</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Answer Engine Optimization: Voice search queries, direct answers, FAQ schema, snippet lists, clarity.
                  </p>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800/80 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
                    <Bot className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. AIO</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    AI Readability: LLM tokenization, machine-readable JSON-LD schemas, text depth, and topic chunking.
                  </p>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800/80 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">4. GEO</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Generative Engine Optimization: Entity grounding, citations, About details, verifiable factual clarity.
                  </p>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800/80 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                    <Award className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">5. E-E-A-T</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Experience, Expertise, Authoritativeness, Trust: Author bylines, contact info, privacy policies, terms.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Audits Quick List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Recent Audits</h3>
                {audits.length > 0 && (
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    View all ({audits.length}) →
                  </button>
                )}
              </div>

              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl divide-y divide-slate-800/60 overflow-hidden shadow-sm">
                {audits.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{a.baseDomain}</span>
                        <span className="text-[11px] text-slate-500 truncate max-w-xs">{a.rootUrl}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {new Date(a.createdAt).toLocaleDateString()} • {a.pages.length} page(s) audited
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                        a.overallAverageScore >= 75 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                        a.overallAverageScore >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                      }`}>
                        {a.status === 'failed' ? 'FAILED' : `${a.overallAverageScore} / 100`}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedAudit(a);
                          setActiveTab('report');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition"
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                ))}

                {audits.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No audits performed yet. Enter a website URL above to start your first analysis.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <AuditHistoryView
            audits={audits}
            onSelectAudit={(audit) => {
              setSelectedAudit(audit);
              setActiveTab('report');
            }}
            onDeleteAudit={handleDeleteAudit}
            onNewAudit={() => setIsAuditModalOpen(true)}
          />
        )}

        {activeTab === 'report' && selectedAudit && (
          <ReportView
            audit={selectedAudit}
            onBack={() => setActiveTab('overview')}
            onDelete={handleDeleteAudit}
          />
        )}
      </main>

      {/* Modals */}
      <AuditRunnerModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onAuditCompleted={handleAuditCompleted}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
