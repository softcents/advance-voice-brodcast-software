'use client';

import { useState, useEffect } from 'react';
import { Receipt, Search, Download, RefreshCw } from 'lucide-react';

interface LedgerItem {
  id: string;
  type: string;
  amount: number | string;
  balanceBefore: number | string;
  balanceAfter: number | string;
  description: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export default function TransactionsPage() {
  const [entries, setEntries] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallets/all-statements');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error('Failed to fetch ledger transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleExport = () => {
    window.open('/api/reports/cdr/export', '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-brand-400" /> Transactions Ledger
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Immutable financial audit trail recording all credits, debits, reservations, transfers, and refunds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white text-xs font-semibold"
          >
            <Download className="w-4 h-4 text-brand-400" /> Export Ledger (.csv)
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3.5 font-semibold">Transaction ID</th>
                <th className="p-3.5 font-semibold">Account / User</th>
                <th className="p-3.5 font-semibold">Type</th>
                <th className="p-3.5 font-semibold">Description</th>
                <th className="p-3.5 font-semibold text-right">Amount</th>
                <th className="p-3.5 font-semibold text-right">Balance Before</th>
                <th className="p-3.5 font-semibold text-right">Balance After</th>
                <th className="p-3.5 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    {loading ? 'Loading transactions ledger...' : 'No ledger entries found.'}
                  </td>
                </tr>
              ) : (
                entries.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-800/30 transition">
                    <td className="p-3.5 font-mono text-gray-300 font-bold">{tx.id.slice(0, 12)}...</td>
                    <td className="p-3.5 text-white font-medium">{tx.user?.name || 'System Account'}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'CREDIT' || tx.type === 'REFUND'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.type === 'DEBIT'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-200">{tx.description}</td>
                    <td className="p-3.5 text-right font-black text-white">৳ {Number(tx.amount).toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono text-gray-400">
                      ৳ {Number(tx.balanceBefore).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                      ৳ {Number(tx.balanceAfter).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right text-gray-400">{new Date(tx.createdAt).toLocaleString()}</td>
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
