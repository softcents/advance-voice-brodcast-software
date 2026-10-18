'use client';

import { useState, useEffect } from 'react';
import {
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Plus,
  Search,
  Download,
  Filter,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Send,
  Loader2,
  Calendar,
  PhoneForwarded,
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/api';

export default function IvrOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    cancellations: 0,
    callbacks: 0,
    forwarded: 0,
    conversionRate: '0%',
  });

  // Form State
  const [formData, setFormData] = useState({
    orderNumber: '',
    customerName: '',
    customerPhone: '',
    orderAmount: '',
    itemsSummary: '',
    webhookUrl: '',
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/ivr/orders?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        setOrders(items);

        // Calculate Stats
        const total = data.total || items.length;
        const confirmed = items.filter((o: any) => o.status === 'CONFIRMED').length;
        const cancellations = items.filter(
          (o: any) => o.status === 'CANCELLATION_REQUESTED' || o.status === 'CANCELLED',
        ).length;
        const callbacks = items.filter((o: any) => o.status === 'CALLBACK_SCHEDULED').length;
        const forwarded = items.filter((o: any) => o.dtmfPressed === '0' || (o.notes && /forward/i.test(o.notes))).length;
        const rate = total > 0 ? ((confirmed / total) * 100).toFixed(1) + '%' : '0%';

        setStats({ total, confirmed, cancellations, callbacks, forwarded, conversionRate: rate });
      }
    } catch (e) {
      console.error('Failed to fetch IVR orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/ivr/orders/dispatch', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          orderNumber: formData.orderNumber,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          orderAmount: parseFloat(formData.orderAmount) || 0,
          itemsSummary: formData.itemsSummary,
          webhookUrl: formData.webhookUrl,
        }),
      });

      if (res.ok) {
        setIsDispatchModalOpen(false);
        setFormData({
          orderNumber: '',
          customerName: '',
          customerPhone: '',
          orderAmount: '',
          itemsSummary: '',
          webhookUrl: '',
        });
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to dispatch outbound call');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async (orderId: string) => {
    if (!confirm('Are you sure you want to retry calling this customer?')) return;
    try {
      const res = await fetch(`/api/ivr/orders/${orderId}/retry`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        alert('Call retry initiated successfully');
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed
          </span>
        );
      case 'CALLING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <PhoneCall className="w-3.5 h-3.5" />
            Calling...
          </span>
        );
      case 'CANCELLATION_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Cancel Requested
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case 'CALLBACK_SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock className="w-3.5 h-3.5" />
            Callback Req
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200/80 flex-shrink-0">
            <img src="/icons/ivr.svg" alt="IVR Orders" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Outbound IVR — Auto Order Confirmation
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Automated e-commerce order confirmation via Asterisk PBX with Bangla voice prompts and keypad DTMF actions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/reports/ivr-orders/export"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Export XLSX
          </a>

          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white keep-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-500/20 transition"
          >
            <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0">
              <img src="/icons/ivr.svg" alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-white keep-white">Dispatch Order Call</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Orders</span>
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm ring-1 ring-slate-200/80 flex-shrink-0">
              <img src="/icons/ivr.svg" alt="Total" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.total}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Confirmed (Key 1)</span>
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm ring-1 ring-emerald-200/80 flex-shrink-0">
              <img src="/icons/ivr.svg" alt="Confirmed" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{stats.confirmed}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 font-bold uppercase tracking-wider">Cancellation (Key 2)</span>
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm ring-1 ring-amber-200/80 flex-shrink-0">
              <img src="/icons/callbacks.svg" alt="Cancel" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{stats.cancellations}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-700 font-bold uppercase tracking-wider">Callback (Key 3)</span>
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm ring-1 ring-purple-200/80 flex-shrink-0">
              <img src="/icons/callbacks.svg" alt="Callback" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">{stats.callbacks}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-700 font-bold uppercase tracking-wider">Forwarded (Key 0)</span>
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm ring-1 ring-cyan-200/80 flex-shrink-0">
              <img src="/icons/cdr.svg" alt="Forwarded" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-600 mt-2">{stats.forwarded}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by order #, customer phone, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            className="w-full pl-10 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="CALLING">Calling...</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLATION_REQUESTED">Cancel Requested</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="CALLBACK_SCHEDULED">Callback Scheduled</option>
          <option value="FAILED">Failed</option>
        </select>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg border border-gray-700 transition"
        >
          Search
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-950/80 border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Order #</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Keypad (DTMF)</th>
                <th className="px-5 py-3.5">Webhook</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading IVR Order records...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    No order confirmation calls found. Click "Dispatch Order Call" to test.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-800/40 transition">
                    <td className="px-5 py-3.5 font-medium text-white">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-gray-200">{order.customerName || 'N/A'}</div>
                      <div className="text-xs text-gray-400 font-mono">{order.customerPhone}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-emerald-400 font-semibold">
                      {order.orderAmount} {order.currency || 'BDT'}
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(order.status)}</td>
                    <td className="px-5 py-3.5">
                      {order.dtmfPressed ? (
                        <div className="space-y-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              order.dtmfPressed === '0'
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                : order.dtmfPressed === '1'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : order.dtmfPressed === '2'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-purple-950 text-purple-400 border border-purple-800'
                            }`}
                          >
                            Key {order.dtmfPressed} {order.dtmfPressed === '0' && '(Forwarded)'}
                          </span>
                          {order.notes && (
                            <div className="text-[10px] text-gray-400 truncate max-w-[200px]" title={order.notes}>
                              {order.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {order.webhookStatus ? (
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono ${
                            order.webhookStatus === 'DELIVERED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {order.webhookStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleRetry(order.id)}
                        title="Retry Outbound Call"
                        className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition border border-gray-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Modal */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              Dispatch Outbound Confirmation Call
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              The Asterisk PBX engine will dial the customer and play the interactive confirmation flow.
            </p>

            <form onSubmit={handleDispatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Order Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ORD-10924"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Order Amount (BDT)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    value={formData.orderAmount}
                    onChange={(e) => setFormData({ ...formData, orderAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Customer Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Rahim"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Ordered Items Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2x Cotton T-Shirt (Blue, L)"
                  value={formData.itemsSummary}
                  onChange={(e) => setFormData({ ...formData, itemsSummary: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Webhook Callback URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://myshop.com/api/webhooks/order-confirm"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Signed with HMAC SHA-256 header upon customer confirmation or cancellation.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Calling PBX...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Start Call
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
