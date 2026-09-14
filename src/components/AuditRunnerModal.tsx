import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import type { AuditProject } from '../types.js';
import { Search, Globe, Shield, Sparkles, Layers, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

interface AuditRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuditCompleted: (audit: AuditProject) => void;
}

export function AuditRunnerModal({ isOpen, onClose, onAuditCompleted }: AuditRunnerModalProps) {
  const { token } = useAuth();
  const [url, setUrl] = useState('');
  const [multiPage, setMultiPage] = useState(false);
  const [maxPages, setMaxPages] = useState(3);
  const [isAuditing, setIsAuditing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [auditError, setAuditError] = useState<string | null>(null);

  if (!isOpen) return null;

  const auditSteps = [
    'Validating URL syntax & SSRF Security Check',
    'Executing DNS resolution & TLS handshake',
    'Fetching live HTML payload & response headers',
    'Auditing robots.txt & sitemap.xml directives',
    'Analyzing SEO, AEO, AIO, GEO & E-E-A-T parameters',
    'Grounding AI Insights & compiling report scores'
  ];

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setAuditError(null);
    setIsAuditing(true);
    setCurrentStep(0);

    // Progress animation interval
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < auditSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const res = await fetch('/api/audits/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: url.trim(),
          multiPage,
          maxPages
        })
      });

      clearInterval(stepInterval);
      setCurrentStep(auditSteps.length - 1);

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuditError(data.error || 'The target website could not be analyzed.');
        setIsAuditing(false);
        return;
      }

      setIsAuditing(false);
      onAuditCompleted(data.audit);
      onClose();
    } catch (err: any) {
      clearInterval(stepInterval);
      setAuditError(err.message || 'Connection failure while contacting audit service.');
      setIsAuditing(false);
    }
  };

  const setSampleUrl = (sample: string) => {
    setUrl(sample);
    setAuditError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative">
        {/* Close Button */}
        {!isAuditing && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Launch Comprehensive Website Audit</h2>
            <p className="text-xs text-slate-400">Real-time HTTP fetch & deep algorithmic analysis</p>
          </div>
        </div>

        {/* Quick Sample URLs */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Quick Test URLs:</span>
          {['https://en.wikipedia.org', 'https://stripe.com', 'https://github.com'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setSampleUrl(sample)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
            >
              {sample.replace('https://', '')}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleRunAudit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Public Website URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                id="audit-url-input"
                required
                disabled={isAuditing}
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports any publicly accessible HTTP/HTTPS domain. SSRF protected.
            </p>
          </div>

          {/* Deep Multi-URL Crawl Option */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-slate-200">Multi-URL Deep Page Crawling</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="multi-page-toggle"
                  checked={multiPage}
                  onChange={(e) => setMultiPage(e.target.checked)}
                  disabled={isAuditing}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {multiPage && (
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Pages to Crawl & Audit Separately:</span>
                <select
                  value={maxPages}
                  onChange={(e) => setMaxPages(Number(e.target.value))}
                  disabled={isAuditing}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                >
                  <option value={2}>2 URLs</option>
                  <option value={3}>3 URLs</option>
                  <option value={5}>5 URLs (Deep)</option>
                </select>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {auditError && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Audit Execution Error</span>
                <p>{auditError}</p>
              </div>
            </div>
          )}

          {/* Progress Tracker (Active while auditing) */}
          {isAuditing && (
            <div className="p-4 bg-slate-950 rounded-xl border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auditing Target System...
                </span>
                <span>Step {currentStep + 1} of {auditSteps.length}</span>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${((currentStep + 1) / auditSteps.length) * 100}%` }}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                {auditSteps.map((step, idx) => (
                  <div
                    key={step}
                    className={`text-xs flex items-center gap-2 transition ${
                      idx < currentStep ? 'text-emerald-400' :
                      idx === currentStep ? 'text-blue-300 font-medium' : 'text-slate-600'
                    }`}
                  >
                    {idx < currentStep ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : idx === currentStep ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span className="truncate">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            id="run-full-audit-submit-btn"
            disabled={isAuditing || !url.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Algorithmic Audit...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Full Audit</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
