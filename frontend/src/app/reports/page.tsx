'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  Search,
  Calendar,
  Users,
  Megaphone,
  CalendarDays,
  Phone,
  CheckCircle,
  Wallet,
  TrendingUp,
  Percent,
  Banknote,
  Calculator,
  FileSpreadsheet,
  PhoneCall,
  Clock,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/api';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'clients' | 'daily' | 'campaigns' | 'cdr' | 'statement'>('clients');
  const [preset, setPreset] = useState<string>('this_month');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-31');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Sales Report state
  const [reportData, setReportData] = useState<any>({
    kpi: {
      net_profit: 33730.0,
      profit_margin: 65.0,
      total_deposits: 95000.0,
      deposits_count: 18,
      total_user_balance: 18250.0,
      call_revenue: 51890.0,
      completed_calls: 120400,
      failed_calls: 27850,
      total_duration: 3371200,
      wholesale_cost: 18160.0,
      wholesale_rate: 0.15,
      pulse_duration: 10,
      answer_rate: 81.2,
      total_calls: 148250,
      total_pulses: 121066,
      active_clients: 24,
    },
    clients: [
      {
        id: 'user-01',
        name: 'Apex Electronics BD',
        company: 'Apex Retailer Customer',
        email: 'client@demo.com',
        balance: 2450.0,
        pulseRate: 0.5,
        totalCalls: 34200,
        completedCalls: 28400,
        pulses: 28400,
        revenue: 14200.0,
        cost: 4260.0,
        profit: 9940.0,
        margin: 70.0,
        asr: 83.0,
      },
      {
        id: 'user-02',
        name: 'Prime Voice Agency',
        company: 'Prime Master Reseller',
        email: 'master@reseller.com',
        balance: 35000.0,
        pulseRate: 0.35,
        totalCalls: 74200,
        completedCalls: 60500,
        pulses: 60500,
        revenue: 21175.0,
        cost: 9075.0,
        profit: 12100.0,
        margin: 57.1,
        asr: 81.5,
      },
      {
        id: 'user-03',
        name: 'FastDial Media',
        company: 'FastDial Sub-Reseller',
        email: 'sub@reseller.com',
        balance: 8500.0,
        pulseRate: 0.42,
        totalCalls: 39850,
        completedCalls: 31500,
        pulses: 31500,
        revenue: 13230.0,
        cost: 4725.0,
        profit: 8505.0,
        margin: 64.3,
        asr: 79.0,
      },
    ],
    daily: [
      {
        date: '2026-10-12',
        deposits: 14500.0,
        totalCalls: 28900,
        completedCalls: 24100,
        duration: 674800,
        pulses: 24100,
        revenue: 10845.0,
        cost: 3615.0,
        profit: 7230.0,
        margin: 66.7,
      },
      {
        date: '2026-10-11',
        deposits: 18000.0,
        totalCalls: 24500,
        completedCalls: 19800,
        duration: 554400,
        pulses: 19800,
        revenue: 8910.0,
        cost: 2970.0,
        profit: 5940.0,
        margin: 66.7,
      },
      {
        date: '2026-10-10',
        deposits: 9500.0,
        totalCalls: 21200,
        completedCalls: 17400,
        duration: 487200,
        pulses: 17400,
        revenue: 7830.0,
        cost: 2610.0,
        profit: 5220.0,
        margin: 66.7,
      },
      {
        date: '2026-10-09',
        deposits: 22000.0,
        totalCalls: 29800,
        completedCalls: 24600,
        duration: 688800,
        pulses: 24600,
        revenue: 11070.0,
        cost: 3690.0,
        profit: 7380.0,
        margin: 66.7,
      },
    ],
    campaigns: [
      {
        id: 'CAMP-881',
        name: 'Flash Sale Broadcast Oct-12',
        client: 'Apex Retailer Customer',
        company: 'Apex Electronics BD',
        status: 'COMPLETED',
        totalCalls: 18500,
        completedCalls: 15400,
        pulses: 15400,
        revenue: 7700.0,
        cost: 2310.0,
        profit: 5390.0,
        margin: 70.0,
        asr: 83.2,
        createdAt: '2026-10-12',
      },
      {
        id: 'CAMP-880',
        name: 'Customer Survey IVR Voice SMS',
        client: 'Prime Master Reseller',
        company: 'Prime Voice Solutions',
        status: 'COMPLETED',
        totalCalls: 32000,
        completedCalls: 26200,
        pulses: 26200,
        revenue: 9170.0,
        cost: 3930.0,
        profit: 5240.0,
        margin: 57.1,
        asr: 81.9,
        createdAt: '2026-10-11',
      },
      {
        id: 'CAMP-879',
        name: 'Emergency Maintenance Alert',
        client: 'FastDial Sub-Reseller',
        company: 'FastDial Agency',
        status: 'COMPLETED',
        totalCalls: 12500,
        completedCalls: 9800,
        pulses: 9800,
        revenue: 4116.0,
        cost: 1470.0,
        profit: 2646.0,
        margin: 64.3,
        asr: 78.4,
        createdAt: '2026-10-10',
      },
    ],
    clientOptions: [
      { id: 'user-01', name: 'Apex Retailer Customer' },
      { id: 'user-02', name: 'Prime Master Reseller' },
      { id: 'user-03', name: 'FastDial Sub-Reseller' },
    ],
  });

  // Call Detail Records state
  const [cdrRecords, setCdrRecords] = useState<any[]>([
    {
      id: 'CDR-99120',
      uniqueId: 'ast-1728795735.120',
      channelId: 'PJSIP/8801711223344-00000001',
      phoneNumber: '+8801711223344',
      callerId: '+8809612001122',
      campaignName: 'Flash Sale Broadcast Oct-12',
      client: 'Apex Retailer Customer',
      status: 'COMPLETED',
      hangupCause: 'NORMAL_CLEARING',
      duration: 28,
      billableSeconds: 28,
      costPrice: 0.45,
      sellingPrice: 1.05,
      grossProfit: 0.6,
      createdAt: '2026-10-12 18:22:15',
    },
    {
      id: 'CDR-99121',
      uniqueId: 'ast-1728795745.121',
      channelId: 'PJSIP/8801819283746-00000002',
      phoneNumber: '+8801819283746',
      callerId: '+8809612001122',
      campaignName: 'Flash Sale Broadcast Oct-12',
      client: 'Apex Retailer Customer',
      status: 'COMPLETED',
      hangupCause: 'NORMAL_CLEARING',
      duration: 30,
      billableSeconds: 30,
      costPrice: 0.45,
      sellingPrice: 1.05,
      grossProfit: 0.6,
      createdAt: '2026-10-12 18:22:45',
    },
    {
      id: 'CDR-99122',
      uniqueId: 'ast-1728795752.122',
      channelId: 'PJSIP/8801912345678-00000003',
      phoneNumber: '+8801912345678',
      callerId: '+8809612001122',
      campaignName: 'Customer Survey IVR Voice SMS',
      client: 'Prime Master Reseller',
      status: 'BUSY',
      hangupCause: 'USER_BUSY',
      duration: 0,
      billableSeconds: 0,
      costPrice: 0.0,
      sellingPrice: 0.0,
      grossProfit: 0.0,
      createdAt: '2026-10-12 18:23:02',
    },
    {
      id: 'CDR-99123',
      uniqueId: 'ast-1728795760.123',
      channelId: 'PJSIP/8801671122334-00000004',
      phoneNumber: '+8801671122334',
      callerId: '+8809612001122',
      campaignName: 'Flash Sale Broadcast Oct-12',
      client: 'Apex Retailer Customer',
      status: 'COMPLETED',
      hangupCause: 'NORMAL_CLEARING',
      duration: 25,
      billableSeconds: 25,
      costPrice: 0.45,
      sellingPrice: 1.05,
      grossProfit: 0.6,
      createdAt: '2026-10-12 18:23:30',
    },
    {
      id: 'CDR-99124',
      uniqueId: 'ast-1728795775.124',
      channelId: 'PJSIP/8801552345678-00000005',
      phoneNumber: '+8801552345678',
      callerId: '+8809612001122',
      campaignName: 'Emergency Maintenance Alert',
      client: 'FastDial Sub-Reseller',
      status: 'NO_ANSWER',
      hangupCause: 'NO_ANSWER',
      duration: 0,
      billableSeconds: 0,
      costPrice: 0.0,
      sellingPrice: 0.0,
      grossProfit: 0.0,
      createdAt: '2026-10-12 18:24:10',
    },
  ]);

  // Fetch Sales Report data from NestJS backend
  const fetchReport = () => {
    setLoading(true);
    const params = new URLSearchParams({
      preset,
      startDate,
      endDate,
      ...(selectedUserId ? { userId: selectedUserId } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
    });

    fetch(`/api/reports/sales?${params}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.kpi) {
          setReportData(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [preset, selectedUserId]);

  const applyPreset = (p: string) => {
    setPreset(p);
    const now = new Date();
    if (p === 'today') {
      const d = now.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (p === 'yesterday') {
      const prev = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];
      setStartDate(prev);
      setEndDate(prev);
    } else if (p === 'this_month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    }
  };

  const handleDownloadCsv = (type: string) => {
    window.open(`/api/reports/cdr/export?type=${type}`, '_blank');
  };

  const resetFilters = () => {
    setSelectedUserId('');
    setSearchQuery('');
    applyPreset('this_month');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. HEADER HERO (Exact replication of Filament sales-report.blade.php)     */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 text-white shadow-xl border border-gray-800">
        {/* Background Glow Orbs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg ring-2 ring-emerald-400/50 flex-shrink-0">
              <img src="/icons/reports.svg" alt="Reports" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Voice SMS PBX Financial Intelligence
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Sales & Profit Analytics <span className="text-emerald-400 font-semibold">(বিক্রয় ও লাভ রিপোর্ট)</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
                টেলিকম ক্যারিয়ার কেনা খরচ, ক্লায়েন্ট বিলিং রেট এবং নীট লাভের (Net Profit & Margin) সম্পূর্ণ রিয়েল-টাইম হিসাব।
              </p>
            </div>
          </div>

          {/* Quick Export Actions */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {activeTab === 'clients' && (
              <button
                type="button"
                onClick={() => handleDownloadCsv('clients')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Export Clients CSV</span>
              </button>
            )}
            {activeTab === 'daily' && (
              <button
                type="button"
                onClick={() => handleDownloadCsv('daily')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Export Daily CSV</span>
              </button>
            )}
            {activeTab === 'cdr' && (
              <button
                type="button"
                onClick={() => handleDownloadCsv('cdr')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CDR (Excel)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER TOOLBAR (Exact replication of Filament Toolbar)                */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-sm space-y-4">
        {/* Preset Selector Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Date Range</span>
              <span className="text-[11px] text-gray-400 ml-1.5">
                ({startDate} to {endDate})
              </span>
            </div>
          </div>

          {/* Presets Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar">
            {[
              { key: 'today', label: 'Today' },
              { key: 'yesterday', label: 'Yesterday' },
              { key: 'last_7_days', label: '7 Days' },
              { key: 'this_month', label: 'This Month' },
              { key: 'last_month', label: 'Last Month' },
              { key: 'this_year', label: 'This Year' },
              { key: 'all_time', label: 'All Time' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-medium transition-all ${
                  preset === key
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-gray-100 hover:bg-gray-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div>
            <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">
              From Date (শুরুর তারিখ)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreset('custom');
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">
              To Date (শেষের তারিখ)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreset('custom');
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">
              Filter by Client (গ্রাহক)
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="">All Clients (সকল গ্রাহক - {reportData.clientOptions.length})</option>
              {reportData.clientOptions.map((opt: any) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">
              Search Keyword (অনুসন্ধান)
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, email, company, phone..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all shrink-0"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. KPI EXECUTIVE CARDS (4 PRIMARY METRICS - Exact Filament Layout)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Net Profit (মোট লাভ) - Emerald */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-transparent border border-emerald-500/30 bg-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-600">
                Net Profit (মোট লাভ)
              </span>
              <div className="text-[11px] text-slate-500">আয় - টেলিকম খরচ</div>
            </div>
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-emerald-300 flex-shrink-0">
              <img src="/icons/reports.svg" alt="Profit" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              BDT {reportData.kpi.net_profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                {reportData.kpi.profit_margin}% Margin
              </span>
              <span className="text-slate-500 text-[11px]">
                {reportData.kpi.total_pulses.toLocaleString()} pulses billed
              </span>
            </div>
          </div>
        </div>

        {/* 2. Total Deposits (মোট রিচার্জ) - Blue */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/15 via-indigo-500/5 to-transparent border border-blue-500/30 bg-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-600">
                Total Deposits (মোট রিচার্জ)
              </span>
              <div className="text-[11px] text-slate-500">গ্রাহকদের জমা করা টাকা</div>
            </div>
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-blue-300 flex-shrink-0">
              <img src="/icons/deposits.svg" alt="Deposits" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              BDT {reportData.kpi.total_deposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{reportData.kpi.deposits_count} transactions</span>
              <span className="font-medium text-slate-600">
                Balance: BDT {reportData.kpi.total_user_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Call Revenue (কল বিলিং আয়) - Indigo */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-purple-500/5 to-transparent border border-indigo-500/30 bg-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-600">
                Call Revenue (কল বিলিং আয়)
              </span>
              <div className="text-[11px] text-slate-500">গ্রাহকদের থেকে কাটা ব্যালেন্স</div>
            </div>
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-indigo-300 flex-shrink-0">
              <img src="/icons/cdr.svg" alt="Revenue" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              BDT {reportData.kpi.call_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{reportData.kpi.completed_calls.toLocaleString()} answered</span>
              <span className="text-[11px]">
                {(reportData.kpi.total_duration / 60).toFixed(1)} mins
              </span>
            </div>
          </div>
        </div>

        {/* 4. Carrier Cost (টেলিকম কেনা খরচ) - Amber */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-transparent border border-amber-500/30 bg-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-600">
                Carrier Cost (টেলিকম খরচ)
              </span>
              <div className="text-[11px] text-slate-500">ট্রাঙ্ক / ক্যারিয়ার খরচ</div>
            </div>
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-amber-300 flex-shrink-0">
              <img src="/icons/tariffs.svg" alt="Cost" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              BDT {reportData.kpi.wholesale_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Rate: BDT {reportData.kpi.wholesale_rate.toFixed(4)}/p</span>
              <span>ASR: {reportData.kpi.answer_rate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SECONDARY STATS BAR (Chips - Exact Filament Layout)                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 sm:p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-800 text-xs">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/60">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400">Total Dialed</div>
            <div className="font-bold text-gray-900 dark:text-white">
              {reportData.kpi.total_calls.toLocaleString()} calls
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/60">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400">Success Rate</div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400">
              {reportData.kpi.answer_rate}% ASR
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/60">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400">Total Clients</div>
            <div className="font-bold text-gray-900 dark:text-white">
              {reportData.kpi.active_clients} registered
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/60">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400">Clients Balance</div>
            <div className="font-bold text-gray-900 dark:text-white">
              BDT {reportData.kpi.total_user_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MAIN TABS CONTAINER                                                    */}
      {/* ========================================================================= */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {/* Segmented Control Bar */}
        <div className="p-3 sm:p-4 border-b border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex p-1 rounded-xl sm:rounded-2xl bg-gray-200/70 dark:bg-gray-800/80 text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('clients')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg sm:rounded-xl transition-all ${
                  activeTab === 'clients'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Client Sales & Profit</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-300">
                  {reportData.clients.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('daily')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg sm:rounded-xl transition-all ${
                  activeTab === 'daily'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-white'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Daily Breakdown</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-300">
                  {reportData.daily.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('campaigns')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg sm:rounded-xl transition-all ${
                  activeTab === 'campaigns'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-white'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Campaigns</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-300">
                  {reportData.campaigns.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cdr')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg sm:rounded-xl transition-all ${
                  activeTab === 'cdr'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-white'
                }`}
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Details (CDR)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                  Live
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('statement')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg sm:rounded-xl transition-all ${
                  activeTab === 'statement'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-white'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>My Statement</span>
              </button>
            </div>

            <div className="text-xs text-gray-400 hidden sm:block">
              Preset active: <strong className="text-white">{preset.replace('_', ' ').toUpperCase()}</strong>
            </div>
          </div>
        </div>

        {/* TAB 1: CLIENTS SALES & PROFIT TABLE */}
        {activeTab === 'clients' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-50/80 dark:bg-gray-800/60 uppercase font-semibold text-[11px] text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3.5">Client & Company</th>
                  <th className="px-3 py-3.5 text-right">Balance</th>
                  <th className="px-3 py-3.5 text-center">Rate/p</th>
                  <th className="px-3 py-3.5 text-right">Total Calls</th>
                  <th className="px-3 py-3.5 text-right">Answered</th>
                  <th className="px-3 py-3.5 text-right">ASR %</th>
                  <th className="px-3 py-3.5 text-right">Revenue</th>
                  <th className="px-3 py-3.5 text-right">Wholesale Cost</th>
                  <th className="px-3 py-3.5 text-right text-emerald-400 font-bold">Net Profit</th>
                  <th className="px-3 py-3.5 text-center">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reportData.clients.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-[11px] text-gray-400">{c.company}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-white">
                      ৳ {c.balance.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-400">
                      ৳ {c.pulseRate.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-white">
                      {c.totalCalls.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-400 font-semibold">
                      {c.completedCalls.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                        {c.asr}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-white">
                      ৳ {c.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right text-amber-400">
                      ৳ {c.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-400 font-black">
                      ৳ {c.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-300">
                        {c.margin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: DAILY BREAKDOWN TABLE */}
        {activeTab === 'daily' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-50/80 dark:bg-gray-800/60 uppercase font-semibold text-[11px] text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-3 py-3.5 text-right">Deposits</th>
                  <th className="px-3 py-3.5 text-right">Total Calls</th>
                  <th className="px-3 py-3.5 text-right">Answered</th>
                  <th className="px-3 py-3.5 text-right">Duration (min)</th>
                  <th className="px-3 py-3.5 text-right">Revenue</th>
                  <th className="px-3 py-3.5 text-right">Carrier Cost</th>
                  <th className="px-3 py-3.5 text-right text-emerald-400 font-bold">Net Profit</th>
                  <th className="px-3 py-3.5 text-center">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reportData.daily.map((d: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-800/40 transition">
                    <td className="px-4 py-3 font-semibold text-white">{d.date}</td>
                    <td className="px-3 py-3 text-right font-medium text-blue-400">
                      ৳ {d.deposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right text-white">
                      {d.totalCalls.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-400 font-semibold">
                      {d.completedCalls.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-400">
                      {(d.duration / 60).toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-white">
                      ৳ {d.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right text-amber-400">
                      ৳ {d.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-400 font-black">
                      ৳ {d.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300">
                        {d.margin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: CAMPAIGNS TABLE */}
        {activeTab === 'campaigns' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-50/80 dark:bg-gray-800/60 uppercase font-semibold text-[11px] text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3.5">Campaign Name</th>
                  <th className="px-3 py-3.5">Client</th>
                  <th className="px-3 py-3.5 text-center">Status</th>
                  <th className="px-3 py-3.5 text-right">Recipients</th>
                  <th className="px-3 py-3.5 text-right">Answered</th>
                  <th className="px-3 py-3.5 text-right">ASR %</th>
                  <th className="px-3 py-3.5 text-right">Revenue</th>
                  <th className="px-3 py-3.5 text-right text-emerald-400 font-bold">Net Profit</th>
                  <th className="px-3 py-3.5 text-center">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reportData.campaigns.map((camp: any) => (
                  <tr key={camp.id} className="hover:bg-gray-800/40 transition">
                    <td className="px-4 py-3 font-semibold text-white">
                      <div>{camp.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{camp.id}</div>
                    </td>
                    <td className="px-3 py-3 text-gray-300">{camp.client}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-white">
                      {camp.totalCalls.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-400 font-semibold">
                      {camp.completedCalls.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300">
                        {camp.asr}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-white">
                      ৳ {camp.revenue.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-400 font-black">
                      ৳ {camp.profit.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-400">{camp.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: ADVANCED CALL DETAIL RECORDS (CDR) */}
        {activeTab === 'cdr' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300 font-mono">
              <thead className="bg-gray-50/80 dark:bg-gray-800/60 uppercase font-semibold text-[11px] text-gray-400 border-b border-gray-200 dark:border-gray-800 font-sans">
                <tr>
                  <th className="px-4 py-3.5">Call ID & Asterisk Channel</th>
                  <th className="px-3 py-3.5">Destination Phone</th>
                  <th className="px-3 py-3.5">Caller ID</th>
                  <th className="px-3 py-3.5 text-center">Status</th>
                  <th className="px-3 py-3.5 text-center">Hangup Cause</th>
                  <th className="px-3 py-3.5 text-right">Duration</th>
                  <th className="px-3 py-3.5 text-right">Cost Price</th>
                  <th className="px-3 py-3.5 text-right">Selling Price</th>
                  <th className="px-3 py-3.5 text-right text-emerald-400">Profit</th>
                  <th className="px-3 py-3.5 text-center">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-[11.5px]">
                {cdrRecords.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-indigo-400">{r.id}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[180px]">{r.channelId}</div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-white">{r.phoneNumber}</td>
                    <td className="px-3 py-3 text-gray-400">{r.callerId}</td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : r.status === 'BUSY'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-[10px] text-gray-400">
                      {r.hangupCause}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-white">
                      {r.billableSeconds}s
                    </td>
                    <td className="px-3 py-3 text-right text-gray-400">
                      ৳ {r.costPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right text-white font-bold">
                      ৳ {r.sellingPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-400 font-black">
                      ৳ {r.grossProfit.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-400 text-[10px]">
                      {r.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: CLIENT STATEMENT (Exact match to Filament UsageReport) */}
        {activeTab === 'statement' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
                <div className="text-xs text-gray-400">Available Balance</div>
                <div className="text-xl font-black text-emerald-400 mt-1">BDT 2,450.00</div>
                <div className="text-[11px] text-gray-500 mt-1">~4,900 calls remaining</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
                <div className="text-xs text-gray-400">Billing Pulse Rate</div>
                <div className="text-xl font-black text-white mt-1">BDT 0.50 / pulse</div>
                <div className="text-[11px] text-gray-500 mt-1">10-second increment</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
                <div className="text-xs text-gray-400">Total Dialed Calls</div>
                <div className="text-xl font-black text-white mt-1">12,450</div>
                <div className="text-[11px] text-emerald-400 mt-1">82.4% Answer Rate</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
                <div className="text-xs text-gray-400">Total Billed Expense</div>
                <div className="text-xl font-black text-amber-400 mt-1">BDT 5,129.00</div>
                <div className="text-[11px] text-gray-500 mt-1">Completed calls only</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-800/60 uppercase font-semibold text-[11px] text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-3 py-3 text-right">Recipients</th>
                    <th className="px-3 py-3 text-right">Answered</th>
                    <th className="px-3 py-3 text-right">ASR %</th>
                    <th className="px-3 py-3 text-right">Duration (min)</th>
                    <th className="px-3 py-3 text-right">Billed Pulses</th>
                    <th className="px-3 py-3 text-right font-bold text-white">Expense (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {reportData.campaigns.map((camp: any) => (
                    <tr key={camp.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-semibold text-white">{camp.name}</td>
                      <td className="px-3 py-3 text-right">{camp.totalCalls.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-emerald-400">{camp.completedCalls.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">{camp.asr}%</td>
                      <td className="px-3 py-3 text-right text-gray-400">{((camp.pulses * 10) / 60).toFixed(1)}</td>
                      <td className="px-3 py-3 text-right">{camp.pulses.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-bold text-white">৳ {camp.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
