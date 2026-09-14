import React, { useState } from 'react';
import type { AuditProject } from '../types.js';
import { Search, Trash2, ExternalLink, Calendar, Layers, FileText, Download, CheckCircle2, XCircle } from 'lucide-react';

interface AuditHistoryViewProps {
  audits: AuditProject[];
  onSelectAudit: (audit: AuditProject) => void;
  onDeleteAudit: (id: string) => void;
  onNewAudit: () => void;
}

export function AuditHistoryView({ audits, onSelectAudit, onDeleteAudit, onNewAudit }: AuditHistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredAudits = audits.filter(a =>
    a.rootUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.baseDomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreBadge = (score: number, status: string) => {
    if (status === 'failed') {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (score >= 60) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  };

  return (
    <div id="audit-history-page" className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Audit History & Saved Reports</h1>
          <p className="text-xs text-slate-400">
            Access previous scans, download data extracts, or compare compliance trends
          </p>
        </div>
        <button
          onClick={onNewAudit}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition self-start sm:self-auto"
        >
          + Run New Audit
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Filter by domain or URL (e.g. example.com)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Audits Table / List */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Target Website</th>
                <th className="py-3 px-4">Overall Score</th>
                <th className="py-3 px-4">Pillars Breakdown</th>
                <th className="py-3 px-4">Pages Crawled</th>
                <th className="py-3 px-4">Date Audited</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAudits.map((audit) => {
                const primaryPage = audit.pages[0];
                return (
                  <tr key={audit.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white truncate max-w-xs">{audit.baseDomain}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{audit.rootUrl}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {audit.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-500/10 text-rose-400 border-rose-500/30">
                          <XCircle className="w-3 h-3" /> FAILED
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border ${getScoreBadge(audit.overallAverageScore, audit.status)}`}>
                          {audit.overallAverageScore} / 100
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {primaryPage ? (
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span title="SEO" className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">SEO {primaryPage.seo.score}</span>
                          <span title="AEO" className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">AEO {primaryPage.aeo.score}</span>
                          <span title="AIO" className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">AIO {primaryPage.aio.score}</span>
                          <span title="GEO" className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">GEO {primaryPage.geo.score}</span>
                          <span title="E-E-A-T" className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">EEAT {primaryPage.eeat.score}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No score available</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Layers className="w-3.5 h-3.5" />
                        {audit.pages.length} URL{audit.pages.length > 1 ? 's' : ''}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(audit.createdAt).toLocaleDateString()} at {new Date(audit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => onSelectAudit(audit)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition"
                        >
                          View Report
                        </button>
                        <button
                          onClick={() => {
                            const tok = localStorage.getItem('saas_auth_token') || '';
                            window.open(`/api/audits/${audit.id}/export-csv?token=${encodeURIComponent(tok)}`, '_blank');
                          }}
                          title="Export CSV"
                          className="p-1 text-slate-400 hover:text-slate-200 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {deleteConfirmId === audit.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { onDeleteAudit(audit.id); setDeleteConfirmId(null); }}
                              className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 bg-slate-750 text-slate-300 rounded text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(audit.id)}
                            title="Delete Audit"
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAudits.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {searchTerm ? 'No audits found matching search.' : 'No website audits recorded yet. Run your first audit!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
