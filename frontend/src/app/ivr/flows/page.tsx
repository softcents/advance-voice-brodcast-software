'use client';

import { useState, useEffect } from 'react';
import {
  GitFork,
  Plus,
  Play,
  Settings,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  HelpCircle,
  PhoneForwarded,
  Volume2,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/api';

export default function IvrFlowsPage() {
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: 'Live Agent Forwarding Flow (1: Forward to 01713252758, 2: Hangup)',
    description: '১ চাপলে কল ফরওয়ার্ড হবে ০১৭১৩২৫২৭৫৮ নম্বরে, ২ চাপলে কল কেটে যাবে',
    welcomeTtsText: 'আসসালামু আলাইকুম। আমাদের প্রতিনিধির সাথে সরাসরি কথা বলতে ১ চাপুন, অথবা কলটি কেটে দিতে ২ চাপুন।',
    confirmTtsText: 'আপনার অনুরোধ সফলভাবে গ্রহণ করা হয়েছে। ধন্যবাদ।',
    cancelTtsText: 'কলটি সমাপ্ত করা হয়েছে।',
    callbackTtsText: 'আপনার কলব্যাক অনুরোধ রেকর্ড করা হয়েছে।',
    confirmKey: '9',
    cancelKey: '2',
    callbackKey: '3',
    transferKey: '1',
    transferDestination: '01713252758',
    maxRepeats: 2,
    timeoutSeconds: 6,
    autoCancelPolicy: true,
  });

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ivr/flows', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setFlows(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/ivr/flows', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchFlows();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save IVR flow');
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this IVR Flow?')) return;
    try {
      const res = await fetch(`/api/ivr/flows/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchFlows();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <GitFork className="w-7 h-7 text-indigo-400" />
            Outbound IVR Flow Builder
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure automated voice menus, keypad button behaviors, Bangla TTS prompts, and agent transfer routing.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              id: '',
              name: 'Live Agent Forwarding (1: Forward to 01713252758, 2: Hangup)',
              description: '১ চাপলে কল ফরওয়ার্ড হবে ০১৭১৩২৫২৭৫৮ নম্বরে, ২ চাপলে কল কেটে যাবে',
              welcomeTtsText: 'আসসালামু আলাইকুম। আমাদের প্রতিনিধির সাথে সরাসরি কথা বলতে ১ চাপুন, অথবা কলটি কেটে দিতে ২ চাপুন।',
              confirmTtsText: 'আপনার অনুরোধ সফলভাবে গ্রহণ করা হয়েছে। ধন্যবাদ।',
              cancelTtsText: 'কলটি সমাপ্ত করা হয়েছে।',
              callbackTtsText: 'আপনার কলব্যাক অনুরোধ রেকর্ড করা হয়েছে।',
              confirmKey: '9',
              cancelKey: '2',
              callbackKey: '3',
              transferKey: '1',
              transferDestination: '01713252758',
              maxRepeats: 2,
              timeoutSeconds: 6,
              autoCancelPolicy: true,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create New IVR Flow
        </button>
      </div>

      {/* Flow Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading IVR Flows...
          </div>
        ) : flows.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl">
            No custom IVR Flows configured yet. Click "Create New IVR Flow" to start.
          </div>
        ) : (
          flows.map((flow) => (
            <div
              key={flow.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm hover:border-gray-700 transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {flow.name}
                    {flow.isDefault && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Default
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{flow.description || 'No description provided.'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setFormData({
                        id: flow.id,
                        name: flow.name,
                        description: flow.description || '',
                        welcomeTtsText: flow.welcomeTtsText || '',
                        confirmTtsText: flow.confirmTtsText || '',
                        cancelTtsText: flow.cancelTtsText || '',
                        callbackTtsText: flow.callbackTtsText || '',
                        confirmKey: flow.confirmKey || '1',
                        cancelKey: flow.cancelKey || '2',
                        callbackKey: flow.callbackKey || '3',
                        transferKey: flow.transferKey || '0',
                        transferDestination: flow.transferDestination || '',
                        maxRepeats: flow.maxRepeats || 2,
                        timeoutSeconds: flow.timeoutSeconds || 6,
                        autoCancelPolicy: flow.autoCancelPolicy || false,
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(flow.id)}
                    className="p-1.5 bg-gray-800 hover:bg-rose-900/40 text-rose-400 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Prompt Preview */}
              <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-3 text-xs text-gray-300 space-y-1.5">
                <div className="text-gray-400 font-semibold flex items-center gap-1.5 text-[11px]">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  Welcome Prompt (Bangla):
                </div>
                <p className="italic text-gray-300">"{flow.welcomeTtsText || 'Audio File Assigned'}"</p>
              </div>

              {/* Keypad Mappings Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40">
                  <span className="text-cyan-400 flex items-center gap-1 font-medium">
                    <PhoneForwarded className="w-3.5 h-3.5" /> Key {flow.transferKey || '1'} (Forward):
                  </span>
                  <span className="font-semibold text-cyan-300 font-mono text-[11px]">
                    {flow.transferDestination ? `📞 ${flow.transferDestination}` : 'Not Set'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/30 border border-rose-800/40">
                  <span className="text-rose-400 font-medium">Key {flow.cancelKey || '2'} (Hangup):</span>
                  <span className="font-semibold text-rose-300 text-[11px]">
                    Instant Disconnect (কেটে যাবে)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-950/60 border border-gray-800">
                  <span className="text-gray-400">Key {flow.confirmKey || '9'} (Confirm):</span>
                  <span className="font-semibold text-emerald-400">Order Confirmed</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-950/60 border border-gray-800">
                  <span className="text-gray-400">Key {flow.callbackKey || '3'} (Callback):</span>
                  <span className="font-semibold text-purple-400">Schedule Callback</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-800/60">
                <span>Timeout: {flow.timeoutSeconds}s | Repeats: {flow.maxRepeats}x</span>
                <span>Created: {new Date(flow.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Flow Builder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative my-8">
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <GitFork className="w-5 h-5 text-indigo-400" />
              {formData.id ? 'Edit Outbound IVR Flow' : 'Create Outbound IVR Flow'}
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Customize voice scripts, keypad mappings, and cancellation rules.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Flow Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Welcome & Keypad Menu Prompt (Text-To-Speech) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.welcomeTtsText}
                  onChange={(e) => setFormData({ ...formData, welcomeTtsText: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Press 1 Audio Response (Confirm Prompt)
                  </label>
                  <input
                    type="text"
                    value={formData.confirmTtsText}
                    onChange={(e) => setFormData({ ...formData, confirmTtsText: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Press 2 Audio Response (Cancel Prompt)
                  </label>
                  <input
                    type="text"
                    value={formData.cancelTtsText}
                    onChange={(e) => setFormData({ ...formData, cancelTtsText: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Press 3 Audio Response (Callback Prompt)
                </label>
                <input
                  type="text"
                  value={formData.callbackTtsText}
                  onChange={(e) => setFormData({ ...formData, callbackTtsText: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Call Forwarding / Live Agent Transfer Settings */}
              <div className="p-3.5 bg-gradient-to-br from-cyan-950/30 via-gray-950 to-indigo-950/30 border border-cyan-800/50 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <PhoneForwarded className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-300">
                    Live Call Forwarding (ইনকামিং কল ফরওয়ার্ডিং সেটিংস)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Forwarding Key (DTMF Key) *
                    </label>
                    <input
                      type="text"
                      maxLength={1}
                      value={formData.transferKey}
                      onChange={(e) => setFormData({ ...formData, transferKey: e.target.value })}
                      placeholder="e.g. 0"
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Destination Phone / SIP Ext *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 017XXXXXXXX বা 100"
                      value={formData.transferDestination}
                      onChange={(e) => setFormData({ ...formData, transferDestination: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  গ্রাহক Outbound IVR চলাকালীন <span className="text-cyan-300 font-bold font-mono">'{formData.transferKey || '0'}'</span> চাপলে কলটি সাথে সাথে আপনার এই নম্বরে <span className="text-emerald-400 font-semibold">ইনকামিং কল</span> হিসেবে আসবে। কল রিসিভ করলে সরাসরি গ্রাহকের সাথে কথা বলতে পারবেন।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Keypad Wait Timeout (Seconds)
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={15}
                    value={formData.timeoutSeconds}
                    onChange={(e) => setFormData({ ...formData, timeoutSeconds: parseInt(e.target.value) || 6 })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Max Prompt Repeats on No Input
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={formData.maxRepeats}
                    onChange={(e) => setFormData({ ...formData, maxRepeats: parseInt(e.target.value) || 2 })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">Auto-Cancel Order Policy</div>
                  <div className="text-[11px] text-gray-400">
                    If enabled, customer pressing 2 immediately marks order as CANCELLED (instead of manual review).
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoCancelPolicy}
                  onChange={(e) => setFormData({ ...formData, autoCancelPolicy: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-gray-900 border-gray-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save IVR Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
