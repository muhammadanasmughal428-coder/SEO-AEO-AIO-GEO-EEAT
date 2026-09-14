import React, { useState } from 'react';
import type { AuditProject, PageAuditReport, AuditFinding } from '../types.js';
import {
  ArrowLeft, Printer, Download, ExternalLink, CheckCircle2,
  AlertTriangle, XCircle, Sparkles, Globe, Shield, Search,
  Bot, Award, Compass, FileText, Check, ChevronDown, ChevronUp
} from 'lucide-react';

interface ReportViewProps {
  audit: AuditProject;
  onBack: () => void;
  onDelete?: (id: string) => void;
}

export function ReportView({ audit, onBack, onDelete }: ReportViewProps) {
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedTechnical, setExpandedTechnical] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentPage: PageAuditReport | undefined = audit.pages[selectedPageIndex] || audit.pages[0];

  if (!currentPage) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Audit Failed or Has No Page Data</h2>
        <p className="text-sm text-slate-400 mb-4">{audit.errorMessage || 'Target URL could not be crawled.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Filter findings
  const filteredFindings = currentPage.findings.filter((f) => {
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
    if (statusFilter === 'PASS' && !(f.status === 'PASS' || f.status === 'FOUND')) return false;
    if (statusFilter === 'WARNING' && f.status !== 'WARNING') return false;
    if (statusFilter === 'CRITICAL' && !(f.status === 'CRITICAL' || f.status === 'NOT_FOUND')) return false;
    return true;
  });

  const criticalIssues = currentPage.findings.filter(f => f.status === 'CRITICAL' || f.status === 'NOT_FOUND');
  const warningIssues = currentPage.findings.filter(f => f.status === 'WARNING');
  const passedIssues = currentPage.findings.filter(f => f.status === 'PASS' || f.status === 'FOUND');

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('saas_auth_token') || '';
    window.open(`/api/audits/${audit.id}/export-csv?token=${encodeURIComponent(token)}`, '_blank');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(audit, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit-report-${audit.baseDomain}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'FOUND':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'WARNING':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'CRITICAL':
      case 'NOT_FOUND':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div id="audit-report-container" className="space-y-6 animate-fadeIn pb-12 print:bg-white print:text-black">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-800 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-800 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <FileText className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Main Header / Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl print:border-none print:shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium">
              <Globe className="w-3.5 h-3.5" />
              <span>Domain: {audit.baseDomain}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{currentPage.url}</span>
              <a
                href={currentPage.finalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-500 hover:text-blue-400 transition"
                title="Visit website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </h1>
            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-4">
              <span>Audited on {new Date(currentPage.timestamp).toLocaleString()}</span>
              <span>•</span>
              <span>HTTP Status: <strong className="text-slate-200">{currentPage.httpStatus}</strong></span>
              <span>•</span>
              <span>Response Time: <strong className="text-slate-200">{currentPage.responseTimeMs}ms</strong></span>
              <span>•</span>
              <span>Word Count: <strong className="text-slate-200">{currentPage.technicalData.contentWordCount}</strong></span>
            </p>
          </div>

          {/* Overall Score Dial */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 self-start lg:self-auto">
            <div className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center font-bold ${getScoreColor(currentPage.overallScore)}`}>
              <span className="text-3xl font-extrabold tracking-tight">{currentPage.overallScore}</span>
              <span className="text-[10px] uppercase font-semibold text-slate-400">/ 100</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Audit Index</p>
              <h3 className="text-base font-bold text-white">
                {currentPage.overallScore >= 80 ? 'Grade A: Highly Optimized' :
                 currentPage.overallScore >= 60 ? 'Grade B: Moderate Standing' : 'Grade C: Remediation Required'}
              </h3>
              <p className="text-xs text-slate-400">Weighted cross-pillar SEO & AI compliance</p>
            </div>
          </div>
        </div>

        {/* Multi-Page Tab Switcher (When multiple URLs were audited) */}
        {audit.pages.length > 1 && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Audited URLs ({audit.pages.length} Pages Crawled Separately):
              </span>
              <span className="text-xs text-blue-400">Select page to view individual report:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {audit.pages.map((p, idx) => (
                <button
                  key={p.id || idx}
                  onClick={() => setSelectedPageIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 border ${
                    selectedPageIndex === idx
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="truncate max-w-xs">{p.url.replace(/^https?:\/\//, '')}</span>
                  <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px] font-bold">
                    {p.overallScore}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5 Pillar Score Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* SEO */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400">
              <Search className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">SEO</span>
            </div>
            <span className={`text-base font-extrabold ${currentPage.seo.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {currentPage.seo.score}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${currentPage.seo.score}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed truncate" title={currentPage.seo.statusSummary}>
            {currentPage.seo.statusSummary}
          </p>
          <div className="flex gap-2 text-[10px] text-slate-400 pt-1">
            <span className="text-emerald-400">{currentPage.seo.passedCount} Pass</span>
            <span>•</span>
            <span className="text-amber-400">{currentPage.seo.warningCount} Warn</span>
            <span>•</span>
            <span className="text-rose-400">{currentPage.seo.criticalCount} Crit</span>
          </div>
        </div>

        {/* AEO */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400">
              <Compass className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">AEO</span>
            </div>
            <span className={`text-base font-extrabold ${currentPage.aeo.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {currentPage.aeo.score}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${currentPage.aeo.score}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed truncate" title={currentPage.aeo.statusSummary}>
            {currentPage.aeo.statusSummary}
          </p>
          <div className="flex gap-2 text-[10px] text-slate-400 pt-1">
            <span className="text-emerald-400">{currentPage.aeo.passedCount} Pass</span>
            <span>•</span>
            <span className="text-amber-400">{currentPage.aeo.warningCount} Warn</span>
            <span>•</span>
            <span className="text-rose-400">{currentPage.aeo.criticalCount} Crit</span>
          </div>
        </div>

        {/* AIO */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400">
              <Bot className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">AIO</span>
            </div>
            <span className={`text-base font-extrabold ${currentPage.aio.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {currentPage.aio.score}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${currentPage.aio.score}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed truncate" title={currentPage.aio.statusSummary}>
            {currentPage.aio.statusSummary}
          </p>
          <div className="flex gap-2 text-[10px] text-slate-400 pt-1">
            <span className="text-emerald-400">{currentPage.aio.passedCount} Pass</span>
            <span>•</span>
            <span className="text-amber-400">{currentPage.aio.warningCount} Warn</span>
            <span>•</span>
            <span className="text-rose-400">{currentPage.aio.criticalCount} Crit</span>
          </div>
        </div>

        {/* GEO */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">GEO</span>
            </div>
            <span className={`text-base font-extrabold ${currentPage.geo.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {currentPage.geo.score}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${currentPage.geo.score}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed truncate" title={currentPage.geo.statusSummary}>
            {currentPage.geo.statusSummary}
          </p>
          <div className="flex gap-2 text-[10px] text-slate-400 pt-1">
            <span className="text-emerald-400">{currentPage.geo.passedCount} Pass</span>
            <span>•</span>
            <span className="text-amber-400">{currentPage.geo.warningCount} Warn</span>
            <span>•</span>
            <span className="text-rose-400">{currentPage.geo.criticalCount} Crit</span>
          </div>
        </div>

        {/* E-E-A-T */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <Award className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">E-E-A-T</span>
            </div>
            <span className={`text-base font-extrabold ${currentPage.eeat.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {currentPage.eeat.score}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${currentPage.eeat.score}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed truncate" title={currentPage.eeat.statusSummary}>
            {currentPage.eeat.statusSummary}
          </p>
          <div className="flex gap-2 text-[10px] text-slate-400 pt-1">
            <span className="text-emerald-400">{currentPage.eeat.passedCount} Pass</span>
            <span>•</span>
            <span className="text-amber-400">{currentPage.eeat.warningCount} Warn</span>
            <span>•</span>
            <span className="text-rose-400">{currentPage.eeat.criticalCount} Crit</span>
          </div>
        </div>
      </div>

      {/* AI Executive Intelligence Analysis */}
      {currentPage.aiInsights && (
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-800/50 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 text-blue-400 font-semibold text-sm">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">AI Agent Strategic Grounded Assessment</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {currentPage.aiInsights.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80">
              <h4 className="text-xs font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> AEO (Answer Engines & Voice Search)
              </h4>
              <p className="text-xs text-slate-400 leading-normal">{currentPage.aiInsights.aeoDirectAnswerAssessment}</p>
            </div>

            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80">
              <h4 className="text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" /> AIO (LLM Crawling & Vector Chunking)
              </h4>
              <p className="text-xs text-slate-400 leading-normal">{currentPage.aiInsights.aioDiscoverabilityAssessment}</p>
            </div>

            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80">
              <h4 className="text-xs font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> GEO (Generative Engine Citation Signals)
              </h4>
              <p className="text-xs text-slate-400 leading-normal">{currentPage.aiInsights.geoGenerativeEngineAssessment}</p>
            </div>

            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80">
              <h4 className="text-xs font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> E-E-A-T (Trust & Publisher Authority)
              </h4>
              <p className="text-xs text-slate-400 leading-normal">{currentPage.aiInsights.eeatAssessment}</p>
            </div>
          </div>

          {currentPage.aiInsights.keyActionItems.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60">
              <h4 className="text-xs font-semibold text-white mb-2">Priority Remediation Roadmap:</h4>
              <ul className="space-y-1.5">
                {currentPage.aiInsights.keyActionItems.map((item, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Technical Data Inspection Drawer */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <button
          onClick={() => setExpandedTechnical(!expandedTechnical)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Crawled Technical Payload & Verified DOM Evidence</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{expandedTechnical ? 'Hide Data' : 'View Full Details'}</span>
            {expandedTechnical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {expandedTechnical && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl space-y-1">
              <span className="text-slate-500 font-mono text-[10px]">DOCUMENT TITLE</span>
              <p className="text-slate-200 font-medium">{currentPage.technicalData.title || 'None declared'}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl space-y-1">
              <span className="text-slate-500 font-mono text-[10px]">CANONICAL URL</span>
              <p className="text-slate-200 font-medium truncate">{currentPage.technicalData.canonical || 'None declared'}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl space-y-1">
              <span className="text-slate-500 font-mono text-[10px]">HEADINGS MATRIX</span>
              <p className="text-slate-200 font-medium">
                H1: {currentPage.technicalData.h1Count} | H2: {currentPage.technicalData.h2Count} | H3: {currentPage.technicalData.h3Count}
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl space-y-1">
              <span className="text-slate-500 font-mono text-[10px]">MEDIA SIGNALS</span>
              <p className="text-slate-200 font-medium">
                Total Images: {currentPage.technicalData.imagesCount} | Missing Alt: {currentPage.technicalData.imagesMissingAlt}
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl space-y-1">
              <span className="text-slate-500 font-mono text-[10px]">LINK GRAPH</span>
              <p className="text-slate-200 font-medium">
                Internal: {currentPage.technicalData.internalLinksCount} | External Outbound: {currentPage.technicalData.externalLinksCount}
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl space-y-1">
              <span className="text-slate-500 font-mono text-[10px]">SECURITY HEADERS</span>
              <p className="text-slate-200 font-medium">
                HSTS: {currentPage.technicalData.securityHeaders.hsts ? 'Active' : 'No'} | CSP: {currentPage.technicalData.securityHeaders.contentSecurityPolicy ? 'Active' : 'No'}
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl space-y-1 col-span-full">
              <span className="text-slate-500 font-mono text-[10px]">DETECTED JSON-LD SCHEMAS ({currentPage.technicalData.jsonLdSchemas.length})</span>
              <p className="text-slate-200 font-mono text-[11px]">
                {currentPage.technicalData.jsonLdSchemas.length > 0
                  ? currentPage.technicalData.jsonLdSchemas.map(s => s.type).join(', ')
                  : 'No JSON-LD blocks detected'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Findings Section */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Itemized Audit Checks & Evidence</h3>
            <p className="text-xs text-slate-400">
              Showing {filteredFindings.length} of {currentPage.findings.length} findings
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category pills */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {['ALL', 'SEO', 'AEO', 'AIO', 'GEO', 'EEAT'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    categoryFilter === cat ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Status pills */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'CRITICAL', label: `Critical (${criticalIssues.length})` },
                { id: 'WARNING', label: `Warnings (${warningIssues.length})` },
                { id: 'PASS', label: `Passed (${passedIssues.length})` }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    statusFilter === st.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Findings List */}
        <div className="space-y-3">
          {filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-750 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                    {finding.category}
                  </span>
                  <h4 className="text-sm font-semibold text-white">{finding.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeStyle(finding.status)}`}>
                    {finding.status}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    finding.priority === 'high' ? 'bg-rose-500/20 text-rose-400' :
                    finding.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {finding.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>

              {/* Evidence & Recommendation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/70">
                  <span className="text-slate-500 font-semibold block mb-1">FOUND EVIDENCE:</span>
                  <p className="text-slate-300 font-mono text-[11px] leading-relaxed">{finding.evidence}</p>
                </div>

                <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/70">
                  <span className="text-blue-400 font-semibold block mb-1">RECOMMENDATION:</span>
                  <p className="text-slate-300 leading-relaxed">{finding.recommendation}</p>
                </div>
              </div>
            </div>
          ))}

          {filteredFindings.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No audit findings match your selected filter criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
