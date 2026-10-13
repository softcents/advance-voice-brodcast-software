'use client';

import { useState } from 'react';
import { Speaker, Mic, Languages, Play, Sparkles } from 'lucide-react';

export default function TTSStudioPage() {
  const [text, setText] = useState('সম্মানিত গ্রাহক, আপনার অ্যাকাউন্টে একটি বিশেষ অফার যুক্ত করা হয়েছে। বিস্তারিত জানতে ১ চাপুন।');
  const [language, setLanguage] = useState('bn-BD');
  const [artist, setArtist] = useState('bn-BD-PradeepNeural');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Speaker className="w-6 h-6 text-brand-400" /> Text to Speech (TTS) Studio
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Generate realistic natural Bangla and English voice audio directly from text using Azure Neural & Frolax TTS engines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Mic className="w-4 h-4 text-brand-400" /> Text Input
          </h3>

          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-4 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:border-brand-500 focus:outline-none"
            placeholder="Type your speech script in Bangla or English..."
          />

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-gray-400 font-semibold block mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="bn-BD">Bengali (Bangladesh) - bn-BD</option>
                <option value="en-US">English (US) - en-US</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 font-semibold block mb-1">Voice Artist</label>
              <select
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="bn-BD-PradeepNeural">Pradeep (Male - Azure Neural)</option>
                <option value="bn-BD-NabanitaNeural">Nabanita (Female - Azure Neural)</option>
                <option value="frolax-bangla-male">Frolax Ultra HD (Male)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{generating ? 'Synthesizing Audio via AI Engine...' : 'Generate 8kHz Asterisk Audio'}</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Languages className="w-4 h-4 text-brand-400" /> Supported TTS Engines
          </h3>
          <div className="space-y-3 text-xs text-gray-300">
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
              <strong className="text-white block">Microsoft Azure Cognitive</strong>
              <span className="text-gray-400">High-fidelity neural voices with natural Bangla prosody and tone.</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
              <strong className="text-white block">Frolax HD Engine</strong>
              <span className="text-gray-400">Low-latency regional dialect speech generation for bulk campaigns.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
