'use client';

import { Mic, PlusCircle, Play } from 'lucide-react';

const mockArtists = [
  { id: '1', name: 'Pradeep Neural', engine: 'Azure Neural', lang: 'bn-BD (Bengali)', gender: 'Male', identifier: 'bn-BD-PradeepNeural' },
  { id: '2', name: 'Nabanita Neural', engine: 'Azure Neural', lang: 'bn-BD (Bengali)', gender: 'Female', identifier: 'bn-BD-NabanitaNeural' },
  { id: '3', name: 'Frolax Ultra HD Male', engine: 'Frolax TTS', lang: 'bn-BD (Bengali)', gender: 'Male', identifier: 'frolax-bn-male-1' },
  { id: '4', name: 'Jenny Multilingual', engine: 'Azure Neural', lang: 'en-US (English)', gender: 'Female', identifier: 'en-US-JennyNeural' },
];

export default function TtsArtistsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Mic className="w-6 h-6 text-brand-400" /> TTS Voice Artists
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Voice actors and neural synthesis models configured in system for Text-to-Speech generation.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20">
          <PlusCircle className="w-4 h-4" /> Add Voice Artist
        </button>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3.5 font-semibold">Artist Name</th>
                <th className="p-3.5 font-semibold">TTS Engine</th>
                <th className="p-3.5 font-semibold">Language</th>
                <th className="p-3.5 font-semibold">Gender</th>
                <th className="p-3.5 font-semibold">API Model ID</th>
                <th className="p-3.5 font-semibold text-right">Voice Sample</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {mockArtists.map((a) => (
                <tr key={a.id} className="hover:bg-gray-800/30 transition">
                  <td className="p-3.5 font-bold text-white">{a.name}</td>
                  <td className="p-3.5 text-brand-300 font-semibold">{a.engine}</td>
                  <td className="p-3.5 text-gray-300">{a.lang}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700">
                      {a.gender}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-gray-400 text-[11px]">{a.identifier}</td>
                  <td className="p-3.5 text-right">
                    <button className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500 hover:text-white inline-flex items-center justify-center transition">
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                    </button>
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
