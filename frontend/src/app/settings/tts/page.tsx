'use client';

import { useState } from 'react';
import { Speaker, Save, CheckCircle2 } from 'lucide-react';

export default function TtsSettingsPage() {
  const [azureKey, setAzureKey] = useState('********************************');
  const [azureRegion, setAzureRegion] = useState('southeastasia');
  const [frolaxKey, setFrolaxKey] = useState('frolax_live_token_sec_99182');
  const [defaultEngine, setDefaultEngine] = useState('azure');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Speaker className="w-6 h-6 text-brand-400" /> Text to Speech (TTS) Settings
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Configure API credentials for Azure Cognitive Speech & Frolax Neural Speech synthesis engines.
        </p>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-5">
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-gray-300 font-semibold block mb-1">Default Synthesis Engine</label>
            <select
              value={defaultEngine}
              onChange={(e) => setDefaultEngine(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500"
            >
              <option value="azure">Microsoft Azure Cognitive Speech</option>
              <option value="frolax">Frolax Neural Bangla Engine</option>
            </select>
          </div>

          <div>
            <label className="text-gray-300 font-semibold block mb-1">Azure Speech Subscription Key</label>
            <input
              type="password"
              value={azureKey}
              onChange={(e) => setAzureKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white font-mono focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-gray-300 font-semibold block mb-1">Azure Region / Endpoint</label>
            <input
              type="text"
              value={azureRegion}
              onChange={(e) => setAzureRegion(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="text-gray-300 font-semibold block mb-1">Frolax API Bearer Token</label>
            <input
              type="password"
              value={frolaxKey}
              onChange={(e) => setFrolaxKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white font-mono focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-gray-800 flex justify-end">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saved ? 'Credentials Saved!' : 'Save Credentials'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
