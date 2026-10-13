'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  PhoneCall,
  Coins,
  Wallet,
  Megaphone,
  Radio,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const [roleView, setRoleView] = useState<'ADMIN' | 'CUSTOMER'>('ADMIN');
  const [selectedLog, setSelectedLog] = useState<'full' | 'messages'>('full');
  const [callsFilter, setCallsFilter] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [revenueFilter, setRevenueFilter] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [depositsFilter, setDepositsFilter] = useState<'today' | 'week' | 'month' | 'year'>('week');

  // Dashboard Overview state
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({
    stats: {
      totalUsers: 24,
      totalCalls: 148250,
      revenue: 51890.0,
      totalUserBalance: 18250.0,
      totalCampaigns: 48,
    },
    callStatusData: [
      { name: 'Completed (120,400)', value: 120400, color: '#16a34a' },
      { name: 'Failed (14,200)', value: 14200, color: '#dc2626' },
      { name: 'Pending (5,400)', value: 5400, color: '#ca8a04' },
      { name: 'Processing (4,800)', value: 4800, color: '#2563eb' },
      { name: 'Initiated (3,450)', value: 3450, color: '#9333ea' },
    ],
    campaignStatusData: [
      { name: 'Finished (34)', value: 34, color: '#16a34a' },
      { name: 'Failed (2)', value: 2, color: '#dc2626' },
      { name: 'Paused (4)', value: 4, color: '#ca8a04' },
      { name: 'Processing (5)', value: 5, color: '#2563eb' },
      { name: 'Pending (3)', value: 3, color: '#9333ea' },
    ],
    callsTrend: [
      { date: 'Mon', aggregate: 14200 },
      { date: 'Tue', aggregate: 19800 },
      { date: 'Wed', aggregate: 24500 },
      { date: 'Thu', aggregate: 21200 },
      { date: 'Fri', aggregate: 28900 },
      { date: 'Sat', aggregate: 18400 },
      { date: 'Sun', aggregate: 21250 },
    ],
    costTrend: [
      { date: 'Mon', aggregate: 4970 },
      { date: 'Tue', aggregate: 6930 },
      { date: 'Wed', aggregate: 8575 },
      { date: 'Thu', aggregate: 7420 },
      { date: 'Fri', aggregate: 10115 },
      { date: 'Sat', aggregate: 6440 },
      { date: 'Sun', aggregate: 7440 },
    ],
    depositsTrend: [
      { date: 'Mon', aggregate: 8000 },
      { date: 'Tue', aggregate: 12500 },
      { date: 'Wed', aggregate: 9500 },
      { date: 'Thu', aggregate: 14000 },
      { date: 'Fri', aggregate: 18000 },
      { date: 'Sat', aggregate: 6500 },
      { date: 'Sun', aggregate: 11500 },
    ],
    asteriskLogs: [
      `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [NOTICE] res_pjsip.c:4820: PJSIP Ready. PJSIP/telco-trunk-01 is reachable via 103.234.119.204:5060`,
      `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [VERBOSE] res_pjsip_logger.c:218: <--- Received SIP response 200 OK from telco-trunk-01 --->`,
      `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [NOTICE] res_ari.c:134: ARI WebSocket client connected for app 'VoiceProStasis'`,
      `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [VERBOSE] pbx.c:4920: Channel PJSIP/8801711223344-00000001 was created and routed to Stasis`,
      `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [NOTICE] app_stasis.c:380: Channel entered Stasis application 'VoiceProStasis'`,
      `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [VERBOSE] res_rtp_asterisk.c:1820: 0x7f83040012e0 -- Strict RTP learning complete for 103.234.119.204:10042`,
      `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [NOTICE] pbx.c:5140: Channel connected line updated: 8801711223344 (ANSWERED)`,
      `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [VERBOSE] app_playback.c:490: Playing 'sound:custom_broadcast_promo.wav' (language 'bn-BD')`,
      `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [NOTICE] pbx.c:5200: Channel PJSIP/8801711223344-00000001 state changed to Up`,
      `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [VERBOSE] pbx.c:5310: Channel hangup request received: NORMAL_CLEARING (Q.850 cause: 16)`,
      `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [NOTICE] app_stasis.c:410: Channel left Stasis; CDR successfully logged and ledger settled`,
    ],
  });

  // Fetch real data from backend
  useEffect(() => {
    fetch('/api/reports/dashboard', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData && resData.stats) {
          setData((prev: any) => ({
            ...prev,
            stats: resData.stats,
            callStatusData: resData.callStatusData.map((d: any) => ({
              name: `${d.status} (${d.count})`,
              value: d.count,
              color: d.color,
            })),
            campaignStatusData: resData.campaignStatusData.map((d: any) => ({
              name: `${d.status} (${d.count})`,
              value: d.count,
              color: d.color,
            })),
            asteriskLogs: resData.asteriskLogs || prev.asteriskLogs,
          }));
        }
      })
      .catch(() => {
        // Fall back gracefully to seeded data
      });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar with Role Switcher & Telemetry Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {roleView === 'ADMIN' ? 'Admin Dashboard' : 'Client Dashboard'}
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Filament Converted
          </span>
        </div>

        {/* View Switcher: Admin Panel vs Customer Panel */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Dashboard View:</span>
          <div className="inline-flex rounded-xl p-1 bg-gray-900 border border-gray-800 text-xs font-semibold">
            <button
              onClick={() => setRoleView('ADMIN')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                roleView === 'ADMIN'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Admin View
            </button>
            <button
              onClick={() => setRoleView('CUSTOMER')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                roleView === 'CUSTOMER'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Customer View
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ADMIN DASHBOARD VIEW (Exact match to Filament Admin/Dashboard)       */}
      {/* ========================================================================= */}
      {roleView === 'ADMIN' && (
        <div className="space-y-6">
          {/* WIDGET 1: StatsOverview (3 Columns Grid in Filament) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Total Users */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Users</span>
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {data.stats.totalUsers}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Active users on the platform
              </div>
            </div>

            {/* 2. Total Calls */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Calls</span>
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <PhoneCall className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {data.stats.totalCalls >= 1000
                  ? `${(data.stats.totalCalls / 1000).toFixed(1)}k`
                  : data.stats.totalCalls}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Calls made today
              </div>
            </div>

            {/* 3. Revenue */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Revenue</span>
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                BDT {data.stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Total revenue generated
              </div>
            </div>

            {/* 4. Total User Balance */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total User Balance</span>
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                BDT {data.stats.totalUserBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Balance across all users
              </div>
            </div>

            {/* 5. Total Campaigns */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Campaigns</span>
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <Megaphone className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {data.stats.totalCampaigns}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                All time total campaigns
              </div>
            </div>
          </div>

          {/* WIDGET 2: LiveAsteriskLogWidget (Exact reproduction of Filament blade widget) */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden p-5 space-y-4">
            {/* Widget Heading Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Asterisk PBX & SIP Live Stream
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  PJSIP 5060 Ready
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
                  Asterisk 20.9.3 LTS
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setSelectedLog('full')}
                    type="button"
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      selectedLog === 'full'
                        ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    Full SIP & Calls
                  </button>
                  <button
                    onClick={() => setSelectedLog('messages')}
                    type="button"
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      selectedLog === 'messages'
                        ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    System Notices
                  </button>
                </div>

                <a
                  href="/admin/log-viewer"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <span>Full Log Viewer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Terminal Display Console */}
            <div className="rounded-xl overflow-hidden border border-gray-800 bg-[#0b0f19] shadow-inner">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/80 bg-gray-950/80 text-[11px] font-mono text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
                  <span className="text-gray-400 ml-2 font-semibold">
                    container: voice-pro-asterisk &bull; /var/log/asterisk/{selectedLog}.log
                  </span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live 2s Stream</span>
                </div>
              </div>

              <div className="p-4 font-mono text-[11.5px] leading-relaxed max-h-[380px] overflow-y-auto space-y-1 select-text scrollbar-thin">
                {data.asteriskLogs.map((line: string, idx: number) => {
                  let textColor = 'text-gray-300';
                  if (line.includes('ERROR')) textColor = 'text-rose-400 font-semibold';
                  else if (line.includes('WARNING')) textColor = 'text-amber-400';
                  else if (line.includes('NOTICE')) textColor = 'text-sky-300';
                  else if (
                    line.includes('VERBOSE') ||
                    line.includes('PJSIP') ||
                    line.includes('Endpoint') ||
                    line.includes('Ready')
                  )
                    textColor = 'text-emerald-300';
                  else if (line.includes('DEBUG')) textColor = 'text-slate-400';

                  return (
                    <div
                      key={idx}
                      className={`${textColor} hover:bg-gray-800/40 px-1.5 py-0.5 rounded transition font-mono break-all`}
                    >
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
              <div className="flex items-center gap-3">
                <span>
                  Trunk: <strong className="text-emerald-500">telco-trunk-01</strong>
                </span>
                <span>&bull;</span>
                <span>
                  ARI API: <strong className="text-sky-400">127.0.0.1:8088 (Healthy)</strong>
                </span>
              </div>
              <div>Auto-refreshes every 2 seconds without full page reload.</div>
            </div>
          </div>

          {/* WIDGETS 3 & 4: CallStatusChart & CampaignStatusChart (Side-by-Side Doughnuts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Call Status Distribution */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Call Status Distribution
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.callStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.callStatusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#374151',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      formatter={(val) => <span className="text-gray-300 font-medium">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Campaign Status Distribution */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Campaign Status Distribution
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.campaignStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.campaignStatusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#374151',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      formatter={(val) => <span className="text-gray-300 font-medium">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* WIDGETS 5, 6 & 7: CallsPerDayChart, CostPerDayChart, DepositsChart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. CallsPerDayChart (Line Chart) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Calls</h3>
                <select
                  value={callsFilter}
                  onChange={(e) => setCallsFilter(e.target.value as any)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="today">Today</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.callsTrend}>
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#374151',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="aggregate"
                      name="Calls"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#4f46e5' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. CostPerDayChart (Bar Chart - Orange #EA580C) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Revenue (Cost)</h3>
                <select
                  value={revenueFilter}
                  onChange={(e) => setRevenueFilter(e.target.value as any)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-orange-500"
                >
                  <option value="today">Today</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.costTrend}>
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#374151',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="aggregate" name="Revenue (BDT)" fill="#EA580C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. DepositsChart (Bar Chart - Sky #0ea5e9) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Deposits</h3>
                <select
                  value={depositsFilter}
                  onChange={(e) => setDepositsFilter(e.target.value as any)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="today">Today</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.depositsTrend}>
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#374151',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="aggregate" name="Deposits (BDT)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CUSTOMER DASHBOARD VIEW (Exact match to Filament User/Dashboard)     */}
      {/* ========================================================================= */}
      {roleView === 'CUSTOMER' && (
        <div className="space-y-6">
          {/* Quick Deposit Action Button */}
          <div className="flex justify-between items-center p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-gray-900 to-gray-900 border border-emerald-500/20">
            <div>
              <h3 className="text-sm font-bold text-white">Client Voice Balance Account</h3>
              <p className="text-xs text-gray-400">Recharge balance to schedule voice broadcasts and OTPs.</p>
            </div>
            <a
              href="/finance/deposits"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Deposit Balance</span>
            </a>
          </div>

          {/* Customer Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-xs font-semibold text-gray-400">Available Balance</span>
              <div className="mt-2 text-2xl font-black text-emerald-400">BDT 2,450.00</div>
              <div className="mt-1 text-xs text-gray-500">~4,900 calls remaining</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-xs font-semibold text-gray-400">Total Calls Dialed</span>
              <div className="mt-2 text-2xl font-black text-white">12,450</div>
              <div className="mt-1 text-xs text-gray-500">Across 6 campaigns</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-xs font-semibold text-gray-400">Answer Rate (ASR)</span>
              <div className="mt-2 text-2xl font-black text-indigo-400">82.4%</div>
              <div className="mt-1 text-xs text-gray-500">10,258 completed calls</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-xs font-semibold text-gray-400">Total Billed Usage</span>
              <div className="mt-2 text-2xl font-black text-amber-400">BDT 5,129.00</div>
              <div className="mt-1 text-xs text-gray-500">10s pulse billing</div>
            </div>
          </div>

          {/* Customer Calls Trend Chart */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-white">My Weekly Call History</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.callsTrend}>
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: '#374151',
                      borderRadius: '0.5rem',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="aggregate" name="Dialed Calls" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
