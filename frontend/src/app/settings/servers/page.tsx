'use client';

import { useState, useEffect } from 'react';
import { Server, PlusCircle, Radio, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface AsteriskServerItem {
  id: string;
  name: string;
  ariBaseUrl: string;
  ariUsername: string;
  maxConcurrency: number;
  activeChannels: number;
  isOnline: boolean;
  trunks?: { id: string; trunkName: string }[];
}

export default function AsteriskServersPage() {
  const [servers, setServers] = useState<AsteriskServerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [ariBaseUrl, setAriBaseUrl] = useState('http://127.0.0.1:8088');
  const [ariUsername, setAriUsername] = useState('asterisk');
  const [ariPassword, setAriPassword] = useState('StrongPass123');
  const [maxConcurrency, setMaxConcurrency] = useState('100');
  const [submitting, setSubmitting] = useState(false);

  const fetchServers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telephony/servers');
      if (res.ok) {
        const data = await res.json();
        setServers(data);
      }
    } catch (err) {
      console.error('Failed to fetch servers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ariBaseUrl) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/telephony/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          ariBaseUrl,
          ariUsername,
          ariPassword,
          maxConcurrency: parseInt(maxConcurrency, 10) || 100,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setName('');
        fetchServers();
      }
    } catch (err) {
      console.error('Failed to create server:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Server className="w-6 h-6 text-brand-400" /> Asterisk Servers
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage Asterisk ARI nodes, WebSocket connections, host credentials, and cluster concurrency limits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchServers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
          >
            <PlusCircle className="w-4 h-4" /> Add Asterisk Server
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Radio className="w-4 h-4 text-brand-400" /> Clustered Asterisk PBX Nodes
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3.5 font-semibold">Server Name</th>
                <th className="p-3.5 font-semibold">ARI Base URL</th>
                <th className="p-3.5 font-semibold">ARI Username</th>
                <th className="p-3.5 font-semibold">Max Concurrency</th>
                <th className="p-3.5 font-semibold">Active Channels</th>
                <th className="p-3.5 font-semibold">SIP Trunks</th>
                <th className="p-3.5 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {servers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    {loading ? 'Loading servers...' : 'No Asterisk servers registered yet.'}
                  </td>
                </tr>
              ) : (
                servers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-800/30 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-white flex items-center gap-2">
                        {s.name}
                        {s.ariBaseUrl.includes('127.0.0.1') && (
                          <span className="text-[9px] bg-brand-500/20 text-brand-300 font-bold px-1.5 py-0.5 rounded border border-brand-500/30">
                            Docker
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-gray-300">{s.ariBaseUrl}</td>
                    <td className="p-3.5 font-mono text-gray-400">{s.ariUsername}</td>
                    <td className="p-3.5 font-bold text-white">{s.maxConcurrency} Channels</td>
                    <td className="p-3.5 font-mono text-brand-300 font-bold">{s.activeChannels} Active</td>
                    <td className="p-3.5 text-gray-300">{s.trunks?.length || 0} Trunks</td>
                    <td className="p-3.5 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> ONLINE
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Server Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-400" /> Register Asterisk Node
            </h3>
            <form onSubmit={handleCreateServer} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Server Name</label>
                <input
                  type="text"
                  placeholder="e.g. Asterisk Cloud PBX-02"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">ARI Base URL</label>
                <input
                  type="text"
                  value={ariBaseUrl}
                  onChange={(e) => setAriBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">ARI User</label>
                  <input
                    type="text"
                    value={ariUsername}
                    onChange={(e) => setAriUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">ARI Password</label>
                  <input
                    type="password"
                    value={ariPassword}
                    onChange={(e) => setAriPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Max Concurrency (Channels)</label>
                <input
                  type="number"
                  value={maxConcurrency}
                  onChange={(e) => setMaxConcurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white"
                >
                  {submitting ? 'Registering...' : 'Save Server'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
