'use client';

import { useState } from 'react';
import {
  BadgePercent,
  PlusCircle,
  Coins,
  TrendingUp,
  Percent,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

const mockPlans = [
  {
    id: 'PLAN-01',
    name: 'Telco Standard Wholesale 10s',
    creator: 'Service Provider (SP)',
    pulseDuration: '10s',
    buyRate: 0.12,
    sellRate: 0.20,
    grossMargin: '40.0%',
    assignedCount: 4,
    status: 'ACTIVE',
  },
  {
    id: 'PLAN-02',
    name: 'Reseller Commercial Retail 10s',
    creator: 'Prime Master Reseller',
    pulseDuration: '10s',
    buyRate: 0.20,
    sellRate: 0.35,
    grossMargin: '42.8%',
    assignedCount: 18,
    status: 'ACTIVE',
  },
  {
    id: 'PLAN-03',
    name: 'Premium 1-Second Pulse Plan',
    creator: 'Super Admin',
    pulseDuration: '1s',
    buyRate: 0.02,
    sellRate: 0.038,
    grossMargin: '47.3%',
    assignedCount: 2,
    status: 'ACTIVE',
  },
];

export default function PricingPage() {
  const [pulseDuration, setPulseDuration] = useState(10);
  const [simDuration, setSimDuration] = useState(28);
  const [buyRate, setBuyRate] = useState(0.20);
  const [sellRate, setSellRate] = useState(0.35);

  const pulses = Math.ceil(simDuration / pulseDuration);
  const totalCost = (pulses * buyRate).toFixed(3);
  const totalSell = (pulses * sellRate).toFixed(3);
  const totalMargin = (Number(totalSell) - Number(totalCost)).toFixed(3);
  const marginPct = (((Number(totalSell) - Number(totalCost)) / Number(totalSell)) * 100).toFixed(1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <BadgePercent className="w-6 h-6 text-brand-400" /> Pricing & Profit Management
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Separate buy rates vs selling rates, pulse duration configuration, and reseller commission margins.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition">
          <PlusCircle className="w-4 h-4" />
          <span>Create New Pricing Plan</span>
        </button>
      </div>

      {/* Interactive Margin & Profit Simulator */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-brand-950/30 to-gray-900 border border-brand-500/30 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Sliders className="w-4 h-4 text-brand-400" /> Real-Time Call Margin Simulator
          </div>
          <span className="text-xs text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
            Interactive Pulse Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Call Duration (Seconds)</label>
            <input
              type="number"
              value={simDuration}
              onChange={(e) => setSimDuration(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Pulse Increment</label>
            <select
              value={pulseDuration}
              onChange={(e) => setPulseDuration(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value={10}>10 Seconds Pulse</option>
              <option value={1}>1 Second Pulse</option>
              <option value={15}>15 Seconds Pulse</option>
              <option value={30}>30 Seconds Pulse</option>
              <option value={60}>60 Seconds Pulse</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Buy Rate / Pulse (৳)</label>
            <input
              type="number"
              step="0.01"
              value={buyRate}
              onChange={(e) => setBuyRate(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Sell Rate / Pulse (৳)</label>
            <input
              type="number"
              step="0.01"
              value={sellRate}
              onChange={(e) => setSellRate(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Calculation Result Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-800/80 text-xs">
          <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800">
            <span className="text-gray-400">Total Pulses Billed</span>
            <div className="text-lg font-bold text-white mt-0.5">{pulses} Pulses</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800">
            <span className="text-gray-400">Total Telecom Cost</span>
            <div className="text-lg font-bold text-gray-300 mt-0.5">৳ {totalCost}</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800">
            <span className="text-gray-400">Customer Charged</span>
            <div className="text-lg font-bold text-brand-400 mt-0.5">৳ {totalSell}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-emerald-400 font-semibold">Reseller Gross Profit</span>
            <div className="text-lg font-black text-emerald-300 mt-0.5">
              ৳ {totalMargin} <span className="text-xs font-normal text-emerald-400">({marginPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Plans List */}
      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white">Active Pricing Plans</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3.5 font-semibold">Plan Name</th>
                <th className="p-3.5 font-semibold">Creator Tier</th>
                <th className="p-3.5 font-semibold">Pulse Increment</th>
                <th className="p-3.5 font-semibold">Buy Rate</th>
                <th className="p-3.5 font-semibold">Selling Rate</th>
                <th className="p-3.5 font-semibold">Gross Margin</th>
                <th className="p-3.5 font-semibold">Assigned Accounts</th>
                <th className="p-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {mockPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-800/30 transition">
                  <td className="p-3.5 font-bold text-white">{plan.name}</td>
                  <td className="p-3.5 text-gray-300">{plan.creator}</td>
                  <td className="p-3.5 font-mono text-brand-300 font-semibold">{plan.pulseDuration}</td>
                  <td className="p-3.5 text-gray-400">৳ {plan.buyRate.toFixed(3)}</td>
                  <td className="p-3.5 font-bold text-white">৳ {plan.sellRate.toFixed(3)}</td>
                  <td className="p-3.5 font-semibold text-emerald-400">{plan.grossMargin}</td>
                  <td className="p-3.5 text-gray-300">{plan.assignedCount} users</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
