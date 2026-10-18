'use client';

import { useState, useEffect } from 'react';
import { History, Search, PhoneCall, CheckCircle2, XCircle, RefreshCw, Send, Radio } from 'lucide-react';

interface CallItem {
  id: string;
  phoneNumber: string;
  callerId: string;
  duration: number;
  billableSeconds: number;
  sellingPrice: number;
  status: string;
  hangupCause?: string;
  initiatedAt?: string;
  createdAt: string;
  contact?: {
    id: string;
    name: string | null;
  };
  audio?: {
    id: string;
    title: string;
  };
  user?: {
    name: string;
    email: string;
  };
  trunk?: {
    name: string;
  };
}

import { useAuth } from '@/context/AuthContext';
import { getAuthHeaders, getActiveUserId, getActiveUserRole } from '@/lib/api';

export default function CallsHistoryPage() {
  const { activeUser } = useAuth();
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Instant Test Call Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhone, setTestPhone] = useState('+8801713252758');
  const [testAudioId, setTestAudioId] = useState('');
  const [testTrunkId, setTestTrunkId] = useState('');
  const [audios, setAudios] = useState<{ id: string; title: string }[]>([]);
  const [trunks, setTrunks] = useState<{ id: string; name: string }[]>([]);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const uid = activeUser?.id || getActiveUserId();
      const role = activeUser?.role || getActiveUserRole();
      const query = new URLSearchParams({
        page: '1',
        limit: '50',
      });
      if (search) query.append('search', search);
      if (uid && role === 'CUSTOMER') query.append('userId', uid);

      const res = await fetch(`/api/reports/cdr?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCalls(data.records || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load call history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const uid = activeUser?.id || getActiveUserId();
      const role = activeUser?.role || getActiveUserRole();
      const query = uid && role === 'CUSTOMER' ? `?userId=${uid}` : '';
      const [audioRes, trunkRes] = await Promise.all([
        fetch(`/api/audio${query}`, { headers: getAuthHeaders() }),
        fetch('/api/telephony/trunks', { headers: getAuthHeaders() }),
      ]);
      if (audioRes.ok) {
        const aData = await audioRes.json();
        setAudios(aData);
        if (aData.length > 0) setTestAudioId(aData[0].id);
        else setTestAudioId('');
      }
      if (trunkRes.ok) {
        const tData = await trunkRes.json();
        setTrunks(tData);
        if (tData.length > 0) {
          const preferred = tData.find((t: any) => t.name === 'bdpbx-999' || t.type === 'registration') || tData[0];
          setTestTrunkId(preferred.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch call options:', err);
    }
  };

  useEffect(() => {
    fetchCalls();
    fetchOptions();
  }, [activeUser?.id]);

  const handleTriggerTestCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) return;

    setSubmittingTest(true);
    setTestMessage(null);
    try {
      const uid = activeUser?.id || getActiveUserId();
      const res = await fetch('/api/campaigns/otp', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phoneNumber: testPhone,
          otpCode: '123456',
          audioId: testAudioId || undefined,
          trunkId: testTrunkId || undefined,
          userId: uid,
        }),
      });

      if (res.ok) {
        setTestMessage('Call successfully initiated via Asterisk PBX!');
        setTimeout(() => {
          setShowTestModal(false);
          setTestMessage(null);
          fetchCalls();
        }, 1500);
      } else {
        const errData = await res.json();
        setTestMessage(errData.message || 'Call initiation failed.');
      }
    } catch (err) {
      setTestMessage('Failed to trigger call.');
    } finally {
      setSubmittingTest(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200/80 flex-shrink-0">
            <img src="/icons/cdr.svg" alt="CDR" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              Calls History & CDR (কল বিবরণী)
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Real Asterisk CDR records, connected talk durations, telecom trunk routes, and billing settlements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCalls}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>

          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white keep-white text-xs font-bold shadow-md shadow-brand-500/20"
          >
            <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0">
              <img src="/icons/cdr.svg" alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-white keep-white">Single Voice Test Call</span>
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCalls()}
              className="pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 w-full"
            />
          </div>
          <span className="text-xs text-gray-400">
            Total Calls Logged: <strong className="text-white">{total.toLocaleString()}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3.5 font-semibold">Caller ID / Trunk</th>
                <th className="p-3.5 font-semibold">Dialed Destination</th>
                <th className="p-3.5 font-semibold">Client / Account</th>
                <th className="p-3.5 font-semibold">Duration (Sec)</th>
                <th className="p-3.5 font-semibold">Billable Talk</th>
                <th className="p-3.5 font-semibold text-right">Cost (BDT)</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    {loading ? 'Loading call records...' : 'No call records found.'}
                  </td>
                </tr>
              ) : (
                calls.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-800/30 transition">
                    <td className="p-3.5">
                      <div className="font-mono text-white font-bold">{c.callerId || '999'}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{c.trunk?.name || 'Default Trunk'}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-mono text-brand-300 font-bold">{c.phoneNumber}</div>
                      {c.contact?.name && (
                        <div className="text-[11px] text-gray-400 font-medium">{c.contact.name}</div>
                      )}
                    </td>
                    <td className="p-3.5 text-gray-300 font-semibold">{c.user?.name || 'System User'}</td>
                    <td className="p-3.5 font-mono text-gray-300">{c.duration}s</td>
                    <td className="p-3.5 font-bold text-gray-200">{c.billableSeconds}s</td>
                    <td className="p-3.5 text-right font-black text-brand-400">
                      ৳ {Number(c.sellingPrice || 0).toFixed(2)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-gray-400 font-mono text-[11px]">
                      {new Date(c.createdAt).toLocaleTimeString()} {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Call Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-brand-400" /> Dispatch Instant Voice Call Test
            </h3>

            {testMessage && (
              <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
                {testMessage}
              </div>
            )}

            <form onSubmit={handleTriggerTestCall} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-400 font-semibold block mb-1">Destination Phone Number</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+88017xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Voice Audio Asset</label>
                <select
                  value={testAudioId}
                  onChange={(e) => setTestAudioId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                >
                  {audios.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Outbound SIP Trunk</label>
                <select
                  value={testTrunkId}
                  onChange={(e) => setTestTrunkId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                >
                  {trunks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTest}
                  className="px-5 py-2 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingTest ? 'Calling...' : 'Dial Number Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
