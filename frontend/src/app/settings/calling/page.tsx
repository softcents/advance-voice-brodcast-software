'use client';

import { useState } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

export default function CallingSettingsPage() {
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryInterval, setRetryInterval] = useState(30);
  const [callTimeout, setCallTimeout] = useState(120);
  const [successThreshold, setSuccessThreshold] = useState(5);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-brand-400" /> Calling Settings
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Global call dispatch parameters, retry limits, ring timeout, and campaign success criteria.
        </p>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-5">
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-gray-300 font-semibold block mb-1">Max Retry Attempts for Failed Calls</label>
            <input
              type="number"
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500"
            />
            <span className="text-[11px] text-gray-500 mt-0.5 block">How many times a busy or un-answered call will be automatically retried.</span>
          </div>

          <div>
            <label className="text-gray-300 font-semibold block mb-1">Retry Interval (Minutes)</label>
            <input
              type="number"
              value={retryInterval}
              onChange={(e) => setRetryInterval(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500"
            />
            <span className="text-[11px] text-gray-500 mt-0.5 block">Time delay before re-initiating a failed call in campaign queue.</span>
          </div>

          <div>
            <label className="text-gray-300 font-semibold block mb-1">Channel Ring Timeout (Seconds)</label>
            <input
              type="number"
              value={callTimeout}
              onChange={(e) => setCallTimeout(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500"
            />
            <span className="text-[11px] text-gray-500 mt-0.5 block">Maximum seconds Asterisk will ring before triggering NO_ANSWER hangup.</span>
          </div>

          <div>
            <label className="text-gray-300 font-semibold block mb-1">Campaign Success Minimum Duration (Seconds)</label>
            <input
              type="number"
              value={successThreshold}
              onChange={(e) => setSuccessThreshold(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500"
            />
            <span className="text-[11px] text-gray-500 mt-0.5 block">Minimum talk time required for a call to count toward campaign success.</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-800 flex justify-end">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saved ? 'Saved Successfully!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
