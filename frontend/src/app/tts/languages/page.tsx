'use client';

import { Languages, PlusCircle, CheckCircle2 } from 'lucide-react';

const mockLanguages = [
  { id: '1', code: 'bn-BD', name: 'Bengali (Bangladesh)', artistsCount: 4, isDefault: true },
  { id: '2', code: 'en-US', name: 'English (United States)', artistsCount: 8, isDefault: false },
  { id: '3', code: 'en-GB', name: 'English (United Kingdom)', artistsCount: 4, isDefault: false },
  { id: '4', code: 'ar-SA', name: 'Arabic (Saudi Arabia)', artistsCount: 2, isDefault: false },
];

export default function TtsLanguagesPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Languages className="w-6 h-6 text-brand-400" /> TTS Languages
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Configure supported languages and regional voice locales for Text-to-Speech synthesis.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20">
          <PlusCircle className="w-4 h-4" /> Add Language
        </button>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3.5 font-semibold">Locale Code</th>
                <th className="p-3.5 font-semibold">Language Name</th>
                <th className="p-3.5 font-semibold text-right">Available Voice Artists</th>
                <th className="p-3.5 font-semibold">Default</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {mockLanguages.map((l) => (
                <tr key={l.id} className="hover:bg-gray-800/30 transition">
                  <td className="p-3.5 font-mono text-brand-300 font-bold">{l.code}</td>
                  <td className="p-3.5 font-bold text-white">{l.name}</td>
                  <td className="p-3.5 text-right font-mono text-gray-200">{l.artistsCount} Artists</td>
                  <td className="p-3.5">
                    {l.isDefault ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Default
                      </span>
                    ) : (
                      <span className="text-gray-500 text-[11px]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
