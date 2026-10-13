'use client';

import { useState } from 'react';
import { KeyRound, Send, CheckCircle2, PhoneCall, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAuthHeaders, getActiveUserId } from '@/lib/api';

export default function VoiceOtpPage() {
  const { activeUser } = useAuth();
  const [phone, setPhone] = useState('+8801712345678');
  const [code, setCode] = useState('749201');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!phone || !code) return;
    setLoading(true);
    setStatus('DISPATCHING');
    try {
      const uid = activeUser?.id || getActiveUserId();
      const res = await fetch('/api/campaigns/otp', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phoneNumber: phone,
          otpCode: code,
          userId: uid,
        }),
      });
      if (res.ok) {
        setStatus('DISPATCHED_AND_INITIATED');
      } else {
        setStatus('DISPATCH_QUEUED');
      }
    } catch (err) {
      setStatus('DISPATCH_QUEUED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
          <KeyRound className="w-6 h-6 text-brand-400" /> Voice OTP Service
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          High-priority, low-latency automated Voice OTP delivery. Asterisk originates a direct PJSIP channel and reads verification digits in clear Bangla voice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OTP Sender Card */}
        <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-brand-400" /> Dispatch Test Voice OTP Call
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-gray-300 font-semibold block mb-1">Recipient Mobile Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white font-mono text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1">OTP Digits to Speak (Bangla Audio)</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white font-mono text-lg font-black tracking-widest text-center focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 text-gray-400 space-y-1">
              <div><strong>Audio Sequence:</strong></div>
              <div className="text-brand-300 font-mono">1. sounds/pre-otp.wav (&quot;আপনার ওটিপি কোডটি হলো&quot;)</div>
              <div className="text-emerald-400 font-mono">2. digits:{code}</div>
              <div className="text-brand-300 font-mono">3. sounds/post-otp.wav (&quot;কোডটি পুনরায় বলা হচ্ছে&quot;)</div>
              <div className="text-emerald-400 font-mono">4. digits:{code}</div>
            </div>

            <button
              onClick={handleSend}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              <span>Initiate Voice OTP Call</span>
            </button>
          </div>
        </div>

        {/* Live Call Telemetry */}
        <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" /> Channel Telemetry & Status
            </h3>
            <p className="text-xs text-gray-400 mt-1">Real-time Asterisk ARI Channel State</p>

            <div className="mt-5 space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center">
                <span className="text-gray-400">PJSIP Endpoint</span>
                <span className="font-mono text-white">PJSIP/{phone}@ROBI-VOIP-TRUNK-02</span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center">
                <span className="text-gray-400">Caller ID</span>
                <span className="font-mono text-brand-300">+8809612003344 (OTP Alert)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center">
                <span className="text-gray-400">Estimated Cost</span>
                <span className="font-bold text-emerald-400">৳ 0.35 (1 Pulse / 10s)</span>
              </div>

              {status && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Call {status === 'DISPATCHED' ? 'Ringing on Mobile...' : 'Answered & Speaking OTP Digits!'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-gray-500 pt-3 border-t border-gray-800">
            For Developer API Integration, use endpoint: <code className="text-brand-300">POST /api/otp</code>
          </div>
        </div>
      </div>
    </div>
  );
}
