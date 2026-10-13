'use client';

import { useState } from 'react';
import { Code2, PlusCircle, Key, Copy, Trash2, CheckCircle2 } from 'lucide-react';

const mockTokens = [
  { id: '1', name: 'Mobile App OTP Gateway', token: 'vpro_sec_991823901a88b9c0d1e2', abilities: ['otp:dispatch', 'calls:read'], created: '2026-10-10' },
  { id: '2', name: 'CRM Automated Broadcast Trigger', token: 'vpro_sec_4412098811f0a1b2c3d4', abilities: ['campaigns:write', 'reports:read'], created: '2026-10-11' },
];

export default function ApiTokensPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopied(t);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Code2 className="w-6 h-6 text-brand-400" /> Developer API Tokens
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Generate Bearer tokens for external REST API integration (Voice OTP dispatch, Campaign trigger, Webhooks).
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20">
          <PlusCircle className="w-4 h-4" /> Generate New API Token
        </button>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-brand-400" /> Active API Access Tokens
        </h3>

        <div className="space-y-3">
          {mockTokens.map((t) => (
            <div key={t.id} className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-bold text-white text-sm">{t.name}</div>
                <div className="text-gray-400 font-mono mt-1 text-[11px] bg-gray-950 px-2.5 py-1 rounded inline-block border border-gray-800">
                  {t.token}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {t.abilities.map((a) => (
                    <span key={a} className="text-[10px] font-semibold bg-brand-500/10 text-brand-300 px-2 py-0.5 rounded border border-brand-500/20">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCopy(t.token)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied === t.token ? 'Copied!' : 'Copy Token'}</span>
                </button>
                <button className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-gray-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
