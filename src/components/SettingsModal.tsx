import React from 'react';
import { Shield, Server, Bot, CheckCircle2, Lock, X, Cpu, Globe } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Platform Settings & Security Status</h2>
            <p className="text-xs text-slate-400">Engine parameters, protection layers & AI integrations</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* Engine Parameters */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" /> Crawler Engine
              </span>
              <span className="text-emerald-400 text-[10px] px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">Operational</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
              <div>Timeout: <strong className="text-slate-200">12,000 ms</strong></div>
              <div>Max Redirects: <strong className="text-slate-200">5 Hops</strong></div>
              <div>User-Agent: <strong className="text-slate-200">SEO-Auditor-Bot/1.0</strong></div>
              <div>Robots.txt: <strong className="text-slate-200">Strict Compliance</strong></div>
            </div>
          </div>

          {/* Security & SSRF Defense */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> SSRF & Network Security Defense
              </span>
              <span className="text-emerald-400 text-[10px] px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">Enforced</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Loopback & Localhost blocks (127.0.0.1, ::1)
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Private IPv4 ranges blocked (10.0.0.0/8, 172.16/12, 192.168/16)
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cloud metadata IP blocked (169.254.169.254)
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Pre-flight DNS resolution validation on every redirect
              </li>
            </ul>
          </div>

          {/* AI Reasoning Service */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-purple-400" /> Server-Side Gemini Intelligence
              </span>
              <span className="text-blue-400 text-[10px] px-1.5 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">Active</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Model: <strong className="text-slate-200">gemini-3.8-flash</strong> (via @google/genai SDK). Secret keys remain server-side only.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
        >
          Close Settings
        </button>
      </div>
    </div>
  );
}
