'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  ArrowDownCircle,
  ArrowUpRight,
  RefreshCw,
  Download,
  Calendar,
  Search,
  Layers,
  BarChart3,
  CreditCard,
  ChevronRight,
  TrendingUp,
  Percent,
  Activity,
  History,
  FileSpreadsheet,
} from 'lucide-react';

interface UsageKpi {
  balance: number;
  pulse_rate: number;
  pulse_duration: number;
  remaining_calls: number;
  period_deposits: number;
  all_time_deposits: number;
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  duration_seconds: number;
  pulses: number;
  total_cost: number;
  asr: number;
}

interface CallDetail {
  id: string;
  phoneNumber: string;
  status: string;
  duration: number;
  billableSeconds: number;
  costPrice: number;
  sellingPrice: number;
  createdAt: string;
  campaign?: {
    id: string;
    name: string;
  };
}

export default function UsageReportPage() {
  const [preset, setPreset] = useState<string>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'campaigns' | 'daily' | 'deposits' | 'calls'>('campaigns');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const [kpi, setKpi] = useState<UsageKpi>({
    balance: 0,
    pulse_rate: 0.5,
    pulse_duration: 10,
    remaining_calls: 0,
    period_deposits: 0,
    all_time_deposits: 0,
    total_calls: 0,
    completed_calls: 0,
    failed_calls: 0,
    duration_seconds: 0,
    pulses: 0,
    total_cost: 0,
    asr: 0,
  });

  const [calls, setCalls] = useState<CallDetail[]>([]);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (preset !== 'custom') query.append('preset', preset);
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);

      const res = await fetch(`/api/reports/usage?${query.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.kpi) setKpi(data.kpi);
        if (data.calls) setCalls(data.calls);
      }
    } catch (err) {
      console.error('Failed to fetch usage report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, [preset]);

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPreset('custom');
    fetchUsageData();
  };

  const handleExportCsv = () => {
    window.open('/api/reports/cdr/export', '_blank');
  };

  // Group calls by date for Daily Breakdown tab
  const dailyBreakdown = React.useMemo(() => {
    const map = new Map<string, { date: string; total: number; completed: number; failed: number; duration: number; cost: number; pulses: number }>();
    calls.forEach((c) => {
      const d = new Date(c.createdAt).toISOString().split('T')[0];
      const curr = map.get(d) || { date: d, total: 0, completed: 0, failed: 0, duration: 0, cost: 0, pulses: 0 };
      curr.total++;
      if (c.status === 'COMPLETED') {
        curr.completed++;
        curr.duration += c.billableSeconds || c.duration || 0;
        curr.cost += Number(c.sellingPrice || 0);
        curr.pulses += Math.ceil((c.billableSeconds || c.duration || 10) / (kpi.pulse_duration || 10));
      } else {
        curr.failed++;
      }
      map.set(d, curr);
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [calls, kpi.pulse_duration]);

  // Group calls by campaign
  const campaignBreakdown = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; total: number; completed: number; failed: number; cost: number; pulses: number }>();
    calls.forEach((c) => {
      const campId = c.campaign?.id || 'direct-broadcast';
      const campName = c.campaign?.name || 'Direct Single Call / OTP Broadcast';
      const curr = map.get(campId) || { id: campId, name: campName, total: 0, completed: 0, failed: 0, cost: 0, pulses: 0 };
      curr.total++;
      if (c.status === 'COMPLETED') {
        curr.completed++;
        curr.cost += Number(c.sellingPrice || 0);
        curr.pulses += Math.ceil((c.billableSeconds || c.duration || 10) / (kpi.pulse_duration || 10));
      } else {
        curr.failed++;
      }
      map.set(campId, curr);
    });
    return Array.from(map.values()).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [calls, search, kpi.pulse_duration]);

  const presetsList = [
    { id: 'today', label: 'Today (আজ)' },
    { id: 'yesterday', label: 'Yesterday (গতকাল)' },
    { id: 'this_week', label: 'This Week (চলতি সপ্তাহ)' },
    { id: 'last_7_days', label: 'Last 7 Days (৭ দিন)' },
    { id: 'this_month', label: 'This Month (চলতি মাস)' },
    { id: 'last_month', label: 'Last Month (গত মাস)' },
    { id: 'this_year', label: 'This Year (চলতি বছর)' },
    { id: 'all_time', label: 'All Time (সর্বমোট)' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-800 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-brand-950/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-brand-600/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Customer Reporting
              </span>
              <span className="text-gray-400 text-xs">Live Telephony Ledger</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Usage & Billing Reports <span className="text-lg font-medium text-gray-400 font-bengali">(আমার খরচ ও কল রিপোর্ট)</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Track your voice SMS campaign consumption, pulse billing, live wallet deductions, and recharge history.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsageData}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl glass-panel border border-gray-700/80 hover:bg-gray-800 text-gray-300 flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-400' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20 flex items-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export CDR (CSV)
            </button>
          </div>
        </div>

        {/* Date Filter Preset Pills */}
        <div className="mt-6 pt-5 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            {presetsList.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  preset === p.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-semibold'
                    : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-gray-700/40'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleCustomDateSubmit} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-950/80 border border-gray-800 rounded-lg px-2.5 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-gray-200 focus:outline-none text-xs"
              />
              <span className="text-gray-500 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-gray-200 focus:outline-none text-xs"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold border border-gray-700"
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Balance */}
        <div className="glass-panel p-5 rounded-2xl border border-gray-800/80 bg-gray-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Current Balance</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">
              ৳ {kpi.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-400 font-bengali mt-0.5">বর্তমান ব্যালেন্স (ব্যবহারযোগ্য)</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs">
            <span className="text-gray-400 text-[11px]">Est. Calls Left:</span>
            <span className="font-bold text-gray-200">{kpi.remaining_calls.toLocaleString()} calls</span>
          </div>
        </div>

        {/* Card 2: Calls & ASR */}
        <div className="glass-panel p-5 rounded-2xl border border-gray-800/80 bg-gray-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Total Calls & ASR</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white flex items-baseline gap-2">
              {kpi.total_calls}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {kpi.asr}% ASR
              </span>
            </div>
            <p className="text-[11px] text-indigo-300 font-bengali mt-0.5">মোট কল ও সফলতার হার</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{kpi.completed_calls} Answered</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400 text-[11px]">
              <XCircle className="w-3.5 h-3.5" />
              <span>{kpi.failed_calls} Failed</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Cost & Pulses */}
        <div className="glass-panel p-5 rounded-2xl border border-gray-800/80 bg-gray-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Total Usage Cost</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">
              ৳ {kpi.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-amber-300 font-bengali mt-0.5">মোট বিল / খরচ ({kpi.pulse_duration}s পালস)</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs">
            <span className="text-gray-400 text-[11px]">Total Pulses:</span>
            <span className="font-bold text-gray-200">{kpi.pulses} pulses ({kpi.duration_seconds}s)</span>
          </div>
        </div>

        {/* Card 4: Deposits */}
        <div className="glass-panel p-5 rounded-2xl border border-gray-800/80 bg-gray-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Total Deposits</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">
              ৳ {kpi.period_deposits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-blue-300 font-bengali mt-0.5">রিচার্জকৃত মোট টাকা (নির্বাচিত পিরিয়ড)</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs">
            <span className="text-gray-400 text-[11px]">Pulse Rate:</span>
            <span className="font-bold text-gray-200">৳ {kpi.pulse_rate} / {kpi.pulse_duration}s</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { id: 'campaigns', label: 'My Campaigns (ক্যাম্পেইন ভিত্তিক)', icon: Layers },
            { id: 'daily', label: 'Daily Breakdown (দৈনিক রিপোর্ট)', icon: BarChart3 },
            { id: 'calls', label: 'Call Records (কল হিস্ট্রি)', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
                  isActive
                    ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'campaigns' && (
          <div className="relative w-64 pb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-950/80 border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Campaign Name</th>
                  <th className="px-6 py-3.5 font-bold text-center">Total Dialed</th>
                  <th className="px-6 py-3.5 font-bold text-center">Answered</th>
                  <th className="px-6 py-3.5 font-bold text-center">Failed</th>
                  <th className="px-6 py-3.5 font-bold text-center">Answer Rate</th>
                  <th className="px-6 py-3.5 font-bold text-center">Total Pulses</th>
                  <th className="px-6 py-3.5 font-bold text-right">Cost (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {campaignBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No campaign records found for this period.
                    </td>
                  </tr>
                ) : (
                  campaignBreakdown.map((c) => {
                    const asr = c.total > 0 ? ((c.completed / c.total) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={c.id} className="hover:bg-gray-800/30 transition">
                        <td className="px-6 py-4 font-semibold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold">{c.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">ID: {c.id.slice(0, 12)}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-200">{c.total}</td>
                        <td className="px-6 py-4 text-center text-emerald-400 font-bold">{c.completed}</td>
                        <td className="px-6 py-4 text-center text-rose-400 font-bold">{c.failed}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            {asr}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-medium text-gray-300">{c.pulses}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400 text-sm">
                          ৳ {c.cost.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Daily Breakdown */}
      {activeTab === 'daily' && (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Date</th>
                  <th className="px-6 py-3.5 font-bold text-center">Total Dialed</th>
                  <th className="px-6 py-3.5 font-bold text-center">Answered</th>
                  <th className="px-6 py-3.5 font-bold text-center">Failed</th>
                  <th className="px-6 py-3.5 font-bold text-center">Total Pulses</th>
                  <th className="px-6 py-3.5 font-bold text-center">ASR</th>
                  <th className="px-6 py-3.5 font-bold text-right">Daily Cost (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {dailyBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No daily records found for this period.
                    </td>
                  </tr>
                ) : (
                  dailyBreakdown.map((row) => {
                    const asr = row.total > 0 ? ((row.completed / row.total) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={row.date} className="hover:bg-gray-800/30 transition">
                        <td className="px-6 py-4 font-semibold text-white flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-brand-400" />
                          <span>{row.date}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-200">{row.total}</td>
                        <td className="px-6 py-4 text-center text-emerald-400 font-bold">{row.completed}</td>
                        <td className="px-6 py-4 text-center text-rose-400 font-bold">{row.failed}</td>
                        <td className="px-6 py-4 text-center font-mono font-medium text-gray-300">{row.pulses}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            {asr}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400 text-sm">
                          ৳ {row.cost.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Call Details (CDR) */}
      {activeTab === 'calls' && (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Call Time</th>
                  <th className="px-6 py-3.5 font-bold">Phone Number</th>
                  <th className="px-6 py-3.5 font-bold text-center">Status</th>
                  <th className="px-6 py-3.5 font-bold text-center">Duration</th>
                  <th className="px-6 py-3.5 font-bold text-center">Billable Sec</th>
                  <th className="px-6 py-3.5 font-bold text-right">Cost (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No call details found.
                    </td>
                  </tr>
                ) : (
                  calls.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-800/30 transition">
                      <td className="px-6 py-3.5 text-gray-400 font-mono text-[11px]">
                        {new Date(c.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-white font-mono">{c.phoneNumber}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : c.status === 'FAILED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center font-mono text-gray-300">{c.duration || 0}s</td>
                      <td className="px-6 py-3.5 text-center font-mono font-bold text-gray-200">
                        {c.billableSeconds || 0}s
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-bold text-emerald-400">
                        ৳ {Number(c.sellingPrice || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
