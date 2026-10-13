'use client';

import { useState, useEffect } from 'react';
import {
  Radio,
  PlusCircle,
  CheckCircle2,
  Server,
  RefreshCw,
  PhoneCall,
  Trash2,
  Edit2,
  Layers,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react';

interface TrunkItem {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  transport: string;
  username?: string;
  password?: string;
  outboundCid?: string;
  codecs: string;
  context: string;
  maxConcurrency: number;
  activeCalls: number;
  enabled: boolean;
  isOnline: boolean;
  notes?: string;
  server?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface CallerItem {
  id: string;
  callerName: string;
  callerNumber: string;
  trunkName: string;
  maxConcurrency: number;
  isOnline: boolean;
  enabled: boolean;
  server?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  sipTrunk?: {
    id: string;
    name: string;
    type: string;
    host: string;
  };
}

interface ServerOption {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export default function CallersTrunksPage() {
  const [activeTab, setActiveTab] = useState<'trunks' | 'callers'>('trunks');
  const [trunks, setTrunks] = useState<TrunkItem[]>([]);
  const [callers, setCallers] = useState<CallerItem[]>([]);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingPjsip, setSyncingPjsip] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Trunk Modal
  const [showTrunkModal, setShowTrunkModal] = useState(false);
  const [editingTrunkId, setEditingTrunkId] = useState<string | null>(null);
  const [trunkName, setTrunkName] = useState('telco-trunk-01');
  const [serverId, setServerId] = useState('');
  const [userId, setUserId] = useState('');
  const [authType, setAuthType] = useState<'ip' | 'registration'>('ip');
  const [host, setHost] = useState('103.234.119.204');
  const [port, setPort] = useState('5060');
  const [transport, setTransport] = useState('transport-udp');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [outboundCid, setOutboundCid] = useState('09612345678');
  const [codecs, setCodecs] = useState('alaw,ulaw,g729');
  const [context, setContext] = useState('from-pstn');
  const [maxConcurrency, setMaxConcurrency] = useState('30');
  const [notes, setNotes] = useState('');
  const [submittingTrunk, setSubmittingTrunk] = useState(false);

  // Caller Modal
  const [showCallerModal, setShowCallerModal] = useState(false);
  const [callerName, setCallerName] = useState('999');
  const [callerNumber, setCallerNumber] = useState('999');
  const [callerTrunkId, setCallerTrunkId] = useState('');
  const [callerServerId, setCallerServerId] = useState('');
  const [callerUserId, setCallerUserId] = useState('');
  const [callerMaxConcurrency, setCallerMaxConcurrency] = useState('10');
  const [submittingCaller, setSubmittingCaller] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trunkRes, callerRes, serverRes, userRes] = await Promise.all([
        fetch('/api/telephony/trunks'),
        fetch('/api/telephony/callers'),
        fetch('/api/telephony/servers'),
        fetch('/api/resellers/customers'),
      ]);

      if (trunkRes.ok) {
        const data = await trunkRes.json();
        setTrunks(data);
      }
      if (callerRes.ok) {
        const cData = await callerRes.json();
        setCallers(cData);
      }
      if (serverRes.ok) {
        const sData = await serverRes.json();
        setServers(sData);
        if (sData.length > 0) {
          setServerId(sData[0].id);
          setCallerServerId(sData[0].id);
        }
      }
      if (userRes.ok) {
        const uData = await userRes.json();
        setUsers(uData);
      }
    } catch (err) {
      console.error('Failed to load telephony data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncPjsip = async () => {
    setSyncingPjsip(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/telephony/sync-pjsip', { method: 'POST' });
      const data = await res.json();
      setSyncMessage(data.message || 'PJSIP Synced successfully!');
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err) {
      setSyncMessage('Failed to sync PJSIP.');
    } finally {
      setSyncingPjsip(false);
    }
  };

  const handleSaveTrunk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trunkName || !host || !serverId) return;

    setSubmittingTrunk(true);
    try {
      const payload = {
        name: trunkName,
        serverId,
        userId: userId || undefined,
        type: authType,
        host,
        port: parseInt(port, 10) || 5060,
        transport,
        username: authType === 'registration' ? username : undefined,
        password: authType === 'registration' ? password : undefined,
        outboundCid: outboundCid || undefined,
        codecs,
        context,
        maxConcurrency: parseInt(maxConcurrency, 10) || 30,
        notes: notes || undefined,
      };

      const url = editingTrunkId ? `/api/telephony/trunks/${editingTrunkId}` : '/api/telephony/trunks';
      const method = editingTrunkId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowTrunkModal(false);
        setEditingTrunkId(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error saving SIP trunk:', err);
    } finally {
      setSubmittingTrunk(false);
    }
  };

  const handleDeleteTrunk = async (id: string) => {
    if (!confirm('Are you sure you want to remove this SIP Trunk? Asterisk PJSIP will be reloaded.')) return;
    try {
      const res = await fetch(`/api/telephony/trunks/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to delete trunk:', err);
    }
  };

  const handleSaveCaller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callerName || !callerNumber || !callerServerId) return;

    setSubmittingCaller(true);
    try {
      const selectedTrunk = trunks.find((t) => t.id === callerTrunkId);
      const res = await fetch('/api/telephony/callers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: callerServerId,
          userId: callerUserId || undefined,
          sipTrunkId: callerTrunkId || undefined,
          callerName,
          callerNumber,
          trunkName: selectedTrunk?.name || callerName,
          maxConcurrency: parseInt(callerMaxConcurrency, 10) || 10,
        }),
      });

      if (res.ok) {
        setShowCallerModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error saving caller:', err);
    } finally {
      setSubmittingCaller(false);
    }
  };

  const handleDeleteCaller = async (id: string) => {
    if (!confirm('Are you sure you want to remove this Caller ID?')) return;
    try {
      const res = await fetch(`/api/telephony/callers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to delete caller:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-brand-400" /> SIP Trunks & Caller IDs (টেলিকম গেটওয়ে ও কলার)
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Configure PJSIP telecom trunks, IP whitelist/Registration gateways, and client-assigned caller CLI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          <button
            onClick={handleSyncPjsip}
            disabled={syncingPjsip}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold border border-gray-700"
            title="Regenerate Asterisk pjsip.conf and run 'pjsip reload'"
          >
            <Zap className={`w-3.5 h-3.5 ${syncingPjsip ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
            Sync PJSIP
          </button>

          {activeTab === 'trunks' ? (
            <button
              onClick={() => {
                setEditingTrunkId(null);
                setTrunkName('');
                setShowTrunkModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
            >
              <PlusCircle className="w-4 h-4" /> Add SIP Trunk
            </button>
          ) : (
            <button
              onClick={() => setShowCallerModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
            >
              <PlusCircle className="w-4 h-4" /> Add Caller ID
            </button>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {syncMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-800 space-x-6">
        <button
          onClick={() => setActiveTab('trunks')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'trunks'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Layers className="w-4 h-4" /> SIP Trunks / Gateways ({trunks.length})
        </button>
        <button
          onClick={() => setActiveTab('callers')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'callers'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <PhoneCall className="w-4 h-4" /> Caller IDs & Numbers ({callers.length})
        </button>
      </div>

      {/* TAB 1: SIP TRUNKS TABLE */}
      {activeTab === 'trunks' && (
        <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-400" /> Configured Asterisk PJSIP Trunks
            </h3>
            <span className="text-xs text-gray-400">Total {trunks.length} Active Telecom Trunks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="p-3.5 font-semibold">Trunk Identifier</th>
                  <th className="p-3.5 font-semibold">Auth Type</th>
                  <th className="p-3.5 font-semibold">Host / IP Endpoint</th>
                  <th className="p-3.5 font-semibold">Assigned Client</th>
                  <th className="p-3.5 font-semibold">Default CLI</th>
                  <th className="p-3.5 font-semibold">Concurrency</th>
                  <th className="p-3.5 font-semibold">Codecs & Context</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {trunks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      {loading ? 'Loading SIP trunks...' : 'No SIP trunks configured yet.'}
                    </td>
                  </tr>
                ) : (
                  trunks.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-800/30 transition">
                      <td className="p-3.5 font-mono text-white font-bold">
                        <div className="flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-brand-400" />
                          {t.name}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.type === 'registration'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-gray-300">
                        {t.host}:{t.port}
                      </td>
                      <td className="p-3.5">
                        {t.user ? (
                          <div className="text-gray-200 font-semibold flex items-center gap-1">
                            <User className="w-3 h-3 text-indigo-400" /> {t.user.name}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">Shared / System</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-brand-300 font-bold">{t.outboundCid || '-'}</td>
                      <td className="p-3.5 text-gray-300 font-semibold">{t.maxConcurrency} channels</td>
                      <td className="p-3.5 text-gray-400">
                        <span className="font-mono text-[11px] text-gray-300">{t.codecs}</span>
                        <div className="text-[10px] text-gray-500 font-mono">[{t.context}]</div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> ONLINE
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingTrunkId(t.id);
                            setTrunkName(t.name);
                            setServerId(t.server?.id || '');
                            setUserId(t.user?.id || '');
                            setAuthType(t.type === 'registration' ? 'registration' : 'ip');
                            setHost(t.host);
                            setPort(String(t.port || 5060));
                            setTransport(t.transport || 'transport-udp');
                            setUsername(t.username || '');
                            setPassword(t.password || '');
                            setOutboundCid(t.outboundCid || '');
                            setCodecs(t.codecs || 'alaw,ulaw,g729');
                            setContext(t.context || 'from-pstn');
                            setMaxConcurrency(String(t.maxConcurrency || 30));
                            setNotes(t.notes || '');
                            setShowTrunkModal(true);
                          }}
                          className="p-1 rounded bg-gray-800 text-gray-400 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrunk(t.id)}
                          className="p-1 rounded bg-red-950/40 text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CALLER IDS TABLE */}
      {activeTab === 'callers' && (
        <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-brand-400" /> Dedicated Caller IDs & CLI
            </h3>
            <span className="text-xs text-gray-400">Total {callers.length} Registered Callers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="p-3.5 font-semibold">Caller Name</th>
                  <th className="p-3.5 font-semibold">Caller Number (CLI)</th>
                  <th className="p-3.5 font-semibold">SIP Trunk Route</th>
                  <th className="p-3.5 font-semibold">Assigned Client</th>
                  <th className="p-3.5 font-semibold">Max Concurrency</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {callers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      {loading ? 'Loading callers...' : 'No Caller IDs created yet.'}
                    </td>
                  </tr>
                ) : (
                  callers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-800/30 transition">
                      <td className="p-3.5 font-bold text-white">{c.callerName}</td>
                      <td className="p-3.5 font-mono text-brand-300 font-bold">{c.callerNumber}</td>
                      <td className="p-3.5 font-mono text-gray-300">
                        {c.sipTrunk?.name || c.trunkName}
                      </td>
                      <td className="p-3.5">
                        {c.user ? (
                          <div className="text-gray-200 font-semibold flex items-center gap-1">
                            <User className="w-3 h-3 text-indigo-400" /> {c.user.name}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3.5 text-gray-300 font-bold">{c.maxConcurrency} channels</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteCaller(c.id)}
                          className="p-1 rounded bg-red-950/40 text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SIP TRUNK */}
      {showTrunkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl p-6 space-y-4 my-8">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-brand-400" />
              {editingTrunkId ? 'Edit SIP Trunk' : 'Add New SIP Trunk (টেলিকম গেটওয়ে)'}
            </h3>

            <form onSubmit={handleSaveTrunk} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Trunk Identifier Name</label>
                  <input
                    type="text"
                    value={trunkName}
                    onChange={(e) => setTrunkName(e.target.value)}
                    placeholder="e.g. telco-trunk-01"
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Target PBX Node</label>
                  <select
                    value={serverId}
                    onChange={(e) => setServerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                    required
                  >
                    {servers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Assigned Client (গ্রাহক)</label>
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                  >
                    <option value="">Shared / System Trunk</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Authentication Type</label>
                  <select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                    required
                  >
                    <option value="ip">IP-Based (Whitelisted IP)</option>
                    <option value="registration">Registration (Username & Password)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-gray-400 font-semibold block mb-1">SIP Host / IP</label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="103.234.119.204 or sip.provider.com"
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                    required
                  />
                </div>
              </div>

              {authType === 'registration' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-950/60 border border-amber-500/20">
                  <div>
                    <label className="text-gray-400 font-semibold block mb-1">SIP Username / Account</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="999"
                      className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 font-semibold block mb-1">SIP Password / Secret</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Default Outbound Caller ID</label>
                  <input
                    type="text"
                    value={outboundCid}
                    onChange={(e) => setOutboundCid(e.target.value)}
                    placeholder="+88096xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Max Concurrency (Channels)</label>
                  <input
                    type="number"
                    value={maxConcurrency}
                    onChange={(e) => setMaxConcurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Allowed Audio Codecs</label>
                  <input
                    type="text"
                    value={codecs}
                    onChange={(e) => setCodecs(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Dialplan Context</label>
                  <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Trunk Notes / Description</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowTrunkModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTrunk}
                  className="px-5 py-2 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white"
                >
                  {submittingTrunk ? 'Saving...' : 'Save & Reload PJSIP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CALLER ID */}
      {showCallerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-brand-400" /> Add Dedicated Caller ID
            </h3>

            <form onSubmit={handleSaveCaller} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Caller Name</label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    placeholder="e.g. 999 or BrandName"
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Caller Number (CLI)</label>
                  <input
                    type="text"
                    value={callerNumber}
                    onChange={(e) => setCallerNumber(e.target.value)}
                    placeholder="e.g. 999 or 09612345678"
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">SIP Trunk Gateway</label>
                <select
                  value={callerTrunkId}
                  onChange={(e) => setCallerTrunkId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                >
                  <option value="">Select SIP Trunk</option>
                  {trunks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.type.toUpperCase()} - {t.host})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Assign to Client (গ্রাহক)</label>
                <select
                  value={callerUserId}
                  onChange={(e) => setCallerUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Max Concurrency</label>
                <input
                  type="number"
                  value={callerMaxConcurrency}
                  onChange={(e) => setCallerMaxConcurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCallerModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCaller}
                  className="px-5 py-2 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white"
                >
                  {submittingCaller ? 'Saving...' : 'Save Caller ID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
