'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  PhoneCall,
  CheckCircle2,
  Check,
  Search,
  Calendar,
  User,
  Loader2,
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/api';

export default function IvrCallbacksPage() {
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCallbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ivr/callbacks', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCallbacks(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallbacks();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/ivr/callbacks/${id}/complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchCallbacks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Clock className="w-7 h-7 text-purple-400" />
          Scheduled Customer Callbacks
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Review and execute callbacks requested by customers during Outbound IVR campaigns (Keypad option 3).
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-950/80 border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Customer Phone</th>
                <th className="px-5 py-3.5">Order Number</th>
                <th className="px-5 py-3.5">Order Amount</th>
                <th className="px-5 py-3.5">Scheduled Time</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Notes</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                    Loading Callbacks...
                  </td>
                </tr>
              ) : callbacks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No scheduled callbacks at this time.
                  </td>
                </tr>
              ) : (
                callbacks.map((cb) => (
                  <tr key={cb.id} className="hover:bg-gray-800/40 transition">
                    <td className="px-5 py-3.5 font-mono font-medium text-white flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-purple-400" />
                      {cb.customerPhone}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-200">
                      {cb.order?.orderNumber || 'Direct Request'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-emerald-400">
                      {cb.order ? `${cb.order.orderAmount} BDT` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(cb.scheduledAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          cb.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse'
                        }`}
                      >
                        {cb.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 max-w-xs truncate">
                      {cb.notes || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {cb.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleComplete(cb.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm transition ml-auto"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Done
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
