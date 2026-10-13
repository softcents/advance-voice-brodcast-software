'use client';

import { useState, useEffect } from 'react';
import {
  Megaphone,
  PlusCircle,
  Play,
  Pause,
  KeyRound,
  FileAudio,
  Users,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface CampaignItem {
  id: string;
  name: string;
  status: string;
  totalContacts: number;
  processedCalls: number;
  answeredCalls: number;
  failedCalls: number;
  actualCost: number | string;
  audio?: { id: string; title: string; durationSeconds: number };
  group?: { id: string; name: string; totalContacts: number };
}

interface AudioOption {
  id: string;
  title: string;
}

interface GroupOption {
  id: string;
  name: string;
  _count?: { contacts: number };
}

import { useAuth } from '@/context/AuthContext';
import { getAuthHeaders, getActiveUserId, getActiveUserRole } from '@/lib/api';

export default function CampaignsPage() {
  const { activeUser } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [audioOptions, setAudioOptions] = useState<AudioOption[]>([]);
  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  // New Campaign form
  const [newCampName, setNewCampName] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [submittingCampaign, setSubmittingCampaign] = useState(false);

  // Voice OTP form
  const [otpPhone, setOtpPhone] = useState('+8801712345678');
  const [otpCode, setOtpCode] = useState('839210');
  const [otpSent, setOtpSent] = useState(false);
  const [submittingOtp, setSubmittingOtp] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const uid = activeUser?.id || getActiveUserId();
      const role = activeUser?.role || getActiveUserRole();
      const query = uid && role === 'CUSTOMER' ? `?userId=${uid}` : '';
      const res = await fetch(`/api/campaigns${query}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const uid = activeUser?.id || getActiveUserId();
      const role = activeUser?.role || getActiveUserRole();
      const query = uid && role === 'CUSTOMER' ? `?userId=${uid}` : '';
      const [audioRes, groupRes] = await Promise.all([
        fetch(`/api/audio${query}`, { headers: getAuthHeaders() }),
        fetch(`/api/audience/groups${query}`, { headers: getAuthHeaders() }),
      ]);
      if (audioRes.ok) {
        const audios = await audioRes.json();
        setAudioOptions(audios);
        if (audios.length > 0) setSelectedAudioId(audios[0].id);
        else setSelectedAudioId('');
      }
      if (groupRes.ok) {
        const groups = await groupRes.json();
        setGroupOptions(groups);
        if (groups.length > 0) setSelectedGroupId(groups[0].id);
        else setSelectedGroupId('');
      }
    } catch (err) {
      console.error('Failed to load dropdown options:', err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchDropdowns();
  }, [activeUser?.id]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName || !selectedAudioId || !selectedGroupId) return;

    setSubmittingCampaign(true);
    try {
      const uid = activeUser?.id || getActiveUserId();
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newCampName,
          audioId: selectedAudioId,
          groupId: selectedGroupId,
          userId: uid,
        }),
      });
      if (res.ok) {
        setShowCampaignModal(false);
        setNewCampName('');
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create campaign');
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOtp(true);
    try {
      const uid = activeUser?.id || getActiveUserId();
      const res = await fetch('/api/campaigns/otp', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phoneNumber: otpPhone,
          otpCode,
          audioId: selectedAudioId || undefined,
          userId: uid,
        }),
      });
      if (res.ok) {
        setOtpSent(true);
        setTimeout(() => {
          setOtpSent(false);
          setShowOtpModal(false);
        }, 1500);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Failed to send OTP:', err);
    } finally {
      setSubmittingOtp(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const action = currentStatus === 'PROCESSING' ? 'pause' : 'resume';
    try {
      await fetch(`/api/campaigns/${id}/${action}`, { method: 'PATCH' });
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to update campaign state:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-brand-400" /> Voice Campaign Studio & Voice OTP
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Broadcast promotional voice campaigns to bulk contact lists, or trigger low-latency voice OTPs via Asterisk PBX.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCampaigns}
            disabled={loading}
            className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowOtpModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-200 font-semibold text-xs transition"
          >
            <KeyRound className="w-4 h-4 text-brand-400" />
            <span>Send Voice OTP</span>
          </button>
          <button
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Voice Broadcast</span>
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-5">
        <h3 className="text-base font-bold text-white">Broadcast Campaigns</h3>
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              {loading ? 'Loading campaigns...' : 'No campaigns launched yet. Click "New Voice Broadcast" to create one.'}
            </div>
          ) : (
            campaigns.map((camp) => {
              const total = camp.totalContacts || 1;
              const processed = camp.processedCalls || 0;
              const progress = Math.min(100, Math.round((processed / total) * 100));

              return (
                <div
                  key={camp.id}
                  className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{camp.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            camp.status === 'PROCESSING'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : camp.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <FileAudio className="w-3.5 h-3.5 text-gray-500" /> {camp.audio?.title || 'Audio File'} ({camp.audio?.durationSeconds || 10}s)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-500" /> {camp.group?.name || 'Contact List'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {camp.status === 'PROCESSING' ? (
                        <button
                          onClick={() => handleToggleStatus(camp.id, camp.status)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-amber-300 text-xs font-semibold"
                        >
                          <Pause className="w-3.5 h-3.5" /> Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(camp.id, camp.status)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-emerald-300 text-xs font-semibold"
                        >
                          <Play className="w-3.5 h-3.5" /> Resume
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Stats */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>
                        Dialed {processed.toLocaleString()} of {total.toLocaleString()} contacts
                      </span>
                      <span className="font-bold text-gray-200">{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-800/60 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-gray-400">Answered:</span>{' '}
                        <strong className="text-white">{camp.answeredCalls}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <div>
                        <span className="text-gray-400">Failed:</span>{' '}
                        <strong className="text-white">{camp.failedCalls}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span className="text-gray-400">Billed:</span>{' '}
                        <strong className="text-emerald-400 font-mono">৳ {Number(camp.actualCost || 0).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-brand-400" /> Launch Voice Broadcast
            </h3>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Eid Discount Alert 2026"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Audio Recording</label>
                <select
                  value={selectedAudioId}
                  onChange={(e) => setSelectedAudioId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-brand-500"
                  required
                >
                  {audioOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Audience Group</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-brand-500"
                  required
                >
                  {groupOptions.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g._count?.contacts || 0} contacts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCampaign}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                >
                  {submittingCampaign ? 'Dispatching...' : 'Dispatch Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-brand-400" /> Trigger Instant Voice OTP
            </h3>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Phone Number (E.164)</label>
                <input
                  type="text"
                  value={otpPhone}
                  onChange={(e) => setOtpPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">OTP Code (4-6 Digits)</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              {otpSent && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Voice OTP queued in Asterisk PBX successfully!
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOtp}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingOtp ? 'Dialing...' : 'Send Voice Call'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
