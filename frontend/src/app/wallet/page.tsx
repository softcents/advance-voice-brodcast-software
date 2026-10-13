'use client';

import { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Send,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';

const mockLedger = [
  {
    id: 'LEDGER-001',
    type: 'CREDIT',
    amount: 3000.0,
    before: 0.0,
    after: 3000.0,
    ref: 'REC-INIT-001',
    desc: 'Wallet recharge via bKash (Ref: BK992812)',
    date: '2026-10-12 18:20:10',
  },
  {
    id: 'LEDGER-002',
    type: 'RESERVE',
    amount: 10.5,
    before: 3000.0,
    after: 2989.5,
    ref: 'CAMP-EID-01',
    desc: 'Reserved balance for Campaign #CAMP-EID-01',
    date: '2026-10-12 18:22:00',
  },
  {
    id: 'LEDGER-003',
    type: 'DEBIT',
    amount: 1.05,
    before: 2989.5,
    after: 2988.45,
    ref: 'CALL-171999',
    desc: 'Call charge for +8801711223344 (28s billable / 3 pulses)',
    date: '2026-10-12 18:22:45',
  },
  {
    id: 'LEDGER-004',
    type: 'REFUND',
    amount: 2.1,
    before: 2988.45,
    after: 2990.55,
    ref: 'CAMP-EID-01',
    desc: 'Unused reserved cost refund for non-connected calls in Campaign',
    date: '2026-10-12 18:25:00',
  },
  {
    id: 'LEDGER-005',
    type: 'TRANSFER',
    amount: 500.0,
    before: 2990.55,
    after: 2490.55,
    ref: 'TRF-SUB-01',
    desc: 'Transferred balance to FastDial Sub-Reseller',
    date: '2026-10-12 18:30:15',
  },
];

export default function WalletPage() {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-brand-400" /> Wallet & Financial Ledger
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Double-entry immutable ledger, balance transfers, reservations, and audit statements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-200 font-semibold text-xs transition"
          >
            <Send className="w-4 h-4 text-brand-400" />
            <span>Transfer to Sub-Reseller</span>
          </button>
          <button
            onClick={() => setShowRechargeModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Recharge Wallet</span>
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-900/60 via-gray-900 to-gray-950 border border-brand-500/30 shadow-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-brand-300">
            <span>Available Balance</span>
            <CreditCard className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-4xl font-black text-white">৳ 500,000.00</div>
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span>Currency: <strong>BDT</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Reconciled</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-amber-400">
            <span>In-Flight Reserved Balance</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-4xl font-black text-amber-400">৳ 1,420.00</div>
          <p className="text-xs text-gray-400">Locked for active campaign calls; adjusts upon hangup.</p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-purple-400">
            <span>Allocated Credit Limit</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-4xl font-black text-purple-300">৳ 1,000,000.00</div>
          <p className="text-xs text-gray-400">Postpaid overdraft allowed up to credit threshold.</p>
        </div>
      </div>

      {/* Immutable Ledger Statement Table */}
      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-400" /> Immutable Audit Ledger (Statement)
            </h3>
            <p className="text-xs text-gray-400">Every single debit, credit, reservation, and refund entry is permanently recorded.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Download Statement:</span>
            <button className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-medium">
              Excel (.xlsx)
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-medium">
              PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3.5 font-semibold">Entry ID / Date</th>
                <th className="p-3.5 font-semibold">Type</th>
                <th className="p-3.5 font-semibold">Description</th>
                <th className="p-3.5 font-semibold text-right">Amount</th>
                <th className="p-3.5 font-semibold text-right">Balance Before</th>
                <th className="p-3.5 font-semibold text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {mockLedger.map((row) => (
                <tr key={row.id} className="hover:bg-gray-800/30 transition">
                  <td className="p-3.5">
                    <div className="font-mono text-gray-300 font-semibold">{row.id}</div>
                    <div className="text-[10px] text-gray-500">{row.date}</div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.type === 'CREDIT'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : row.type === 'DEBIT'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : row.type === 'REFUND'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="p-3.5 text-gray-300 max-w-xs">{row.desc}</td>
                  <td className="p-3.5 text-right font-bold">
                    <span
                      className={
                        row.type === 'CREDIT' || row.type === 'REFUND'
                          ? 'text-emerald-400'
                          : 'text-gray-200'
                      }
                    >
                      {row.type === 'CREDIT' || row.type === 'REFUND' ? '+' : '-'}৳{' '}
                      {row.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono text-gray-400">৳ {row.before.toFixed(2)}</td>
                  <td className="p-3.5 text-right font-mono text-white font-bold">৳ {row.after.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
