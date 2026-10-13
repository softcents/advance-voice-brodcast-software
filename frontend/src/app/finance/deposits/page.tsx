'use client';

import { useState, useEffect } from 'react';
import { ArrowDownLeft, CheckCircle2, Clock, PlusCircle, CreditCard, RefreshCw } from 'lucide-react';

interface DepositItem {
  id: string;
  amount: number | string;
  paymentMethod: string;
  transactionRef: string | null;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
  };
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('1000');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [transactionRef, setTransactionRef] = useState('BKX' + Math.floor(100000 + Math.random() * 900000));
  const [submitting, setSubmitting] = useState(false);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallets/deposits');
      if (res.ok) {
        const data = await res.json();
        setDeposits(data);
      }
    } catch (err) {
      console.error('Failed to fetch deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/wallets/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'c12ba588-4754-4ccd-9b47-29e4505a9a76',
          amount: parseFloat(amount),
          paymentMethod,
          transactionRef,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchDeposits();
      }
    } catch (err) {
      console.error('Failed to create deposit:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <ArrowDownLeft className="w-6 h-6 text-brand-400" /> Wallet Deposits & Recharges
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Automated payment gateway deposits (bKash, Nagad, Bank Transfer) and manual recharge verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDeposits}
            disabled={loading}
            className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
          >
            <PlusCircle className="w-4 h-4" /> Add Recharge / Deposit
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-brand-400" /> Deposit History & Gateway Requests
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3.5 font-semibold">Deposit ID</th>
                <th className="p-3.5 font-semibold">User / Client</th>
                <th className="p-3.5 font-semibold">Method</th>
                <th className="p-3.5 font-semibold">Txn Reference</th>
                <th className="p-3.5 font-semibold text-right">Amount (BDT)</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    {loading ? 'Loading deposits...' : 'No deposit requests found. Click "Add Recharge" to top up balance.'}
                  </td>
                </tr>
              ) : (
                deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-800/30 transition">
                    <td className="p-3.5 font-mono text-gray-300 font-bold">{d.id.slice(0, 12)}...</td>
                    <td className="p-3.5 font-semibold text-white">{d.user?.name || 'Customer'}</td>
                    <td className="p-3.5 text-gray-300 font-medium">{d.paymentMethod}</td>
                    <td className="p-3.5 font-mono text-brand-300">{d.transactionRef || 'N/A'}</td>
                    <td className="p-3.5 text-right font-black text-white">৳ {Number(d.amount).toFixed(2)}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-gray-400">{new Date(d.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Deposit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-brand-400" /> Manual Wallet Recharge
            </h3>
            <form onSubmit={handleCreateDeposit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Payment Gateway / Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-brand-500"
                >
                  <option value="bKash">bKash Personal / Merchant</option>
                  <option value="Nagad">Nagad Personal / Merchant</option>
                  <option value="Rocket">Rocket Personal / Merchant</option>
                  <option value="Bank">Bank Deposit (EBL / City Bank)</option>
                  <option value="Manual">Cash / Admin Credit Adjustment</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Recharge Amount (BDT)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Transaction Ref / TRX ID</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
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
                  {submitting ? 'Crediting...' : 'Approve & Credit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
