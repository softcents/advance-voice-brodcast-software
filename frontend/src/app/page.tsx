'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Upload,
  Play,
  Volume2,
  PhoneCall,
  Headphones,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Check,
  Radio,
  Sparkles,
  Zap,
  Clock,
  Coins,
  Wallet,
  Settings,
  Share2,
  Users,
  Megaphone,
  GitFork,
  Mic,
  Server,
  Code2,
  AlertCircle,
  FileAudio,
  User,
  CreditCard,
  Layers,
  PhoneOff,
  TrendingUp,
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
  RefreshCw,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';

export default function VoiceSaaSDashboard() {
  const { activeUser, isImpersonating } = useAuth();

  // Active Screen: Default is 'overview' (FULL KPI & WIDGETS DASHBOARD!)
  const [activeScreen, setActiveScreen] = useState<
    | 'overview'
    | 'setup_info'
    | 'setup_provider'
    | 'setup_review'
    | 'voice_sms'
    | 'ivr_builder'
    | 'ivr_flow'
    | 'tts_wizard'
    | 'reseller_wizard'
    | 'recharge_wizard'
  >('overview');

  // Recharge State
  const [rechargeAmount, setRechargeAmount] = useState<number>(1000);

  // Audio State for Voice SMS
  const [audioSource, setAudioSource] = useState<'upload' | 'library' | 'tts' | 'record'>('upload');

  // Provider Setup Subtabs
  const [providerTab, setProviderTab] = useState<'voice' | 'tts' | 'gateway' | 'api'>('voice');

  // IVR Options State
  const [ivrOptions, setIvrOptions] = useState([
    { id: '1', digit: '1', title: 'Press 1 - Sales', dest: 'Queue', queue: 'Sales Queue' },
    { id: '2', digit: '2', title: 'Press 2 - Support', dest: 'Queue', queue: 'Support Queue' },
    { id: '3', digit: '3', title: 'Press 3 - Billing', dest: 'Department', queue: 'Billing' },
  ]);
  const [selectedOption, setSelectedOption] = useState('1');

  // TTS text
  const [ttsText, setTtsText] = useState(
    'প্রিয় গ্রাহক, আপনার অর্ডার সফলভাবে নিশ্চিত হয়েছে। আপনাকে ধন্যবাদ।'
  );

  // Traffic Trend Data for Dashboard Chart
  const callTrafficData = [
    { day: 'Mon', calls: 14200, connected: 11800, revenue: 4970 },
    { day: 'Tue', calls: 19800, connected: 16400, revenue: 6930 },
    { day: 'Wed', calls: 24500, connected: 20200, revenue: 8575 },
    { day: 'Thu', calls: 21200, connected: 17400, revenue: 7420 },
    { day: 'Fri', calls: 28900, connected: 24100, revenue: 10115 },
    { day: 'Sat', calls: 18400, connected: 15100, revenue: 6440 },
    { day: 'Sun', calls: 21250, connected: 17800, revenue: 7440 },
  ];

  // FreeSWITCH ESL Telemetry Logs
  const freeswitchLogs = [
    `[NOTICE] mod_event_socket.c: Event socket listening on 127.0.0.1:8021 (ESL Client Ready)`,
    `[INFO] mod_sofia.c: Sofia SIP profile 'internal' running on 5060 (Host: 138.252.125.207)`,
    `[INFO] mod_sofia.c: Sofia SIP profile 'external' active on 5080 for Carrier Gateway`,
    `[NOTICE] switch_core.c: FreeSWITCH 1.11.3 High-CPS Engine online & ready (Max Sessions: 1000)`,
    `[VERBOSE] mod_event_socket.c: ESL authenticated successfully with password 'ClueCon'`,
    `[NOTICE] switch_ivr_originate.c: Outbound Sofia call originated for destination 8801711223344`,
    `[VERBOSE] switch_ivr.c: Playing prompt 'sounds/post-otp.wav' via mod_dptools`,
    `[NOTICE] switch_core_session.c: Channel sofia/gateway/bdpbx-999/8801711223344 answered`,
    `[NOTICE] switch_channel.c: Hangup cause: NORMAL_CLEARING (billsec: 32s, duration: 32s)`,
    `[NOTICE] freeswitch-esl: CDR settled and double-entry ledger updated with PostgreSQL`,
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>VoiceSaaS Operations Console</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Carrier Engine
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Executive telemetry, voice broadcast campaigns, and IVR workflows.
          </p>
        </div>

        {/* View Selector Tabs */}
        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveScreen('overview')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeScreen === 'overview'
                ? 'bg-[#2563eb] text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 KPI Dashboard
          </button>

          <button
            onClick={() => setActiveScreen('setup_info')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeScreen !== 'overview'
                ? 'bg-[#2563eb] text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚙️ Wizards Studio
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE KPI DASHBOARD VIEW (DEFAULT ACTIVE)                           */}
      {/* ========================================================================= */}
      {activeScreen === 'overview' && (
        <div className="space-y-6">
          {/* 5 Executive Telecom KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1: Total Calls Dialed */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-blue-300 transition group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Dialed
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <PhoneCall className="w-5 h-5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900 tracking-tight">148,250</span>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+12.4% vs last week</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Carrier SIP Outbound</p>
            </div>

            {/* KPI 2: ASR (Answer Seizure Rate) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Answer Rate (ASR)
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16a34a] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-[#16a34a] tracking-tight">82.4%</span>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <span>120,400 Connected</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Average duration: 32s</p>
            </div>

            {/* KPI 3: Gross Billed Revenue */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-amber-300 transition group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Gross Billed
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#d97706] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Coins className="w-5 h-5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  ৳ 51,890
                </span>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18.4% Revenue</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Standard 10s pulse rate</p>
            </div>

            {/* KPI 4: Escrow & Wallet Balance */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-teal-300 transition group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Escrow Balance
                </span>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0f766e] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Wallet className="w-5 h-5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  ৳ 18,250
                </span>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 w-fit">
                  <span>Solvent</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Available client balance</p>
            </div>

            {/* KPI 5: Active Campaigns */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-purple-300 transition group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Campaigns
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Megaphone className="w-5 h-5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900 tracking-tight">48</span>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 w-fit">
                  <span>6 Running Now</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Voice broadcast queues</p>
            </div>
          </div>

          {/* Quick-Launch VoiceSaaS Studio Grid (Links to all 7 Mockup Wizards!) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">VoiceSaaS Studio & Wizards</h3>
                <p className="text-xs text-slate-400">
                  Quick access to all setup wizards and visual workflow builders from the design mockup.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#2563eb]">7 Modules Ready</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-1">
              {/* 1. Setup Wizard */}
              <button
                type="button"
                onClick={() => setActiveScreen('setup_info')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Settings className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">Admin Setup</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Platform wizard</p>
              </button>

              {/* 2. Voice SMS Campaign */}
              <button
                type="button"
                onClick={() => setActiveScreen('voice_sms')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">Voice SMS</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Broadcast audio</p>
              </button>

              {/* 3. IVR Builder */}
              <button
                type="button"
                onClick={() => setActiveScreen('ivr_builder')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <GitFork className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">IVR Builder</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Press 1-2-3</p>
              </button>

              {/* 4. IVR Flow Canvas */}
              <button
                type="button"
                onClick={() => setActiveScreen('ivr_flow')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">Flow Canvas</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Visual preview</p>
              </button>

              {/* 5. TTS Voice Studio */}
              <button
                type="button"
                onClick={() => setActiveScreen('tts_wizard')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Mic className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">TTS Studio</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Bangla AI voice</p>
              </button>

              {/* 6. Reseller Onboarding */}
              <button
                type="button"
                onClick={() => setActiveScreen('reseller_wizard')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">Resellers</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Onboarding tree</p>
              </button>

              {/* 7. Recharge Wallet */}
              <button
                type="button"
                onClick={() => setActiveScreen('recharge_wizard')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">Recharge</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">PayStation ৳</p>
              </button>
            </div>
          </div>

          {/* Middle Row: Broadcast Traffic Analytics & Carrier Health */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols): Call Volume Chart */}
            <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Voice Broadcast Traffic & Delivery Trends
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live Asterisk ARI dispatcher throughput and connected calls (Last 7 Days).
                  </p>
                </div>
                <span className="text-xs font-bold text-[#2563eb] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  82.4% ASR Average
                </span>
              </div>

              {/* Chart */}
              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callTrafficData}>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="calls" name="Dialed Calls" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="connected"
                      name="Connected (Answered)"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Column (4 cols): Carrier Trunk & Asterisk Engine Health */}
            <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Carrier PBX & Engine Status
              </h3>

              <div className="space-y-3">
                {/* Trunk 1 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <strong className="text-xs text-slate-900">bdpbx-999 (Carrier Trunk)</strong>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Registered
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Host: 103.234.119.204</span>
                    <span className="font-mono">Port: 5060 PJSIP</span>
                  </div>
                </div>

                {/* Engine 2 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <strong className="text-xs text-slate-900">FreeSWITCH 1.11.3 (High-CPS)</strong>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ESL Socket Up
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Dispatch: 1000 Sessions</span>
                    <span className="font-mono">Sofia SIP: Port 5060/5080</span>
                  </div>
                </div>

                {/* Ledger & Solvency */}
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-emerald-800 font-bold">
                    <span>Double-Entry Ledger</span>
                    <span>Reconciled</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-tight">
                    All voice campaign balances and reserves settled without discrepancies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Active Voice Campaigns & Live Asterisk Terminal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Active Campaigns Table */}
            <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Recent Voice Broadcast Campaigns
                </h3>
                <Link
                  href="/calling/campaigns"
                  className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                      <th className="py-2.5 px-2">Campaign</th>
                      <th className="py-2.5 px-2">Contacts</th>
                      <th className="py-2.5 px-2">Delivered</th>
                      <th className="py-2.5 px-2">ASR %</th>
                      <th className="py-2.5 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-2">
                        <strong className="text-slate-900 block text-xs">Summer Promo Flash</strong>
                        <span className="text-[10px] text-slate-400">Audio: promo_v3.mp3</span>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-700">25,000</td>
                      <td className="py-3 px-2 font-semibold text-slate-700">24,120</td>
                      <td className="py-3 px-2 font-bold text-emerald-600">92.4%</td>
                      <td className="py-3 px-2 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Finished
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-2">
                        <strong className="text-slate-900 block text-xs">Order OTP Dispatch</strong>
                        <span className="text-[10px] text-slate-400">Zero Latency PJSIP</span>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-700">8,920</td>
                      <td className="py-3 px-2 font-semibold text-slate-700">8,750</td>
                      <td className="py-3 px-2 font-bold text-emerald-600">98.1%</td>
                      <td className="py-3 px-2 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                          Running
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-2">
                        <strong className="text-slate-900 block text-xs">Due Bill Reminder IVR</strong>
                        <span className="text-[10px] text-slate-400">Audio: payment_due.wav</span>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-700">12,400</td>
                      <td className="py-3 px-2 font-semibold text-slate-700">10,210</td>
                      <td className="py-3 px-2 font-bold text-amber-600">82.3%</td>
                      <td className="py-3 px-2 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Finished
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: FreeSWITCH Live Terminal */}
            <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    FreeSWITCH ESL Live Terminal
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">container: voice-pro-freeswitch</span>
              </div>

              <div className="rounded-xl bg-[#090d16] border border-slate-800 p-3.5 font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto space-y-1 select-text scrollbar-thin">
                {freeswitchLogs.map((log, idx) => (
                  <div key={idx} className="text-emerald-400 hover:bg-slate-800/40 px-1 rounded">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WIZARD SCREEN 1: SUPER ADMIN SETUP WIZARD (PLATFORM INFO)               */}
      {/* ========================================================================= */}
      {activeScreen === 'setup_info' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Super Admin Setup Wizard
              </h2>
              <p className="text-xs text-slate-500 mt-1">Configure your platform to get started</p>
            </div>
            <button
              onClick={() => setActiveScreen('overview')}
              className="text-xs font-bold text-[#2563eb] hover:underline"
            >
              ← Back to KPI Dashboard
            </button>
          </div>

          {/* Stepper (7 Steps) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto pb-2">
              {[
                { num: '1', title: 'Platform Info', active: true },
                { num: '2', title: 'Services' },
                { num: '3', title: 'Providers' },
                { num: '4', title: 'Pricing' },
                { num: '5', title: 'Wallet & Payment' },
                { num: '6', title: 'Security' },
                { num: '7', title: 'Review' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        step.active
                          ? 'bg-[#2563eb] text-white shadow-xs ring-4 ring-blue-100'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {step.num}
                    </div>
                    <span
                      className={`text-[11px] mt-1 font-semibold ${
                        step.active ? 'text-[#2563eb] font-bold' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {idx < 6 && <div className="w-8 sm:w-16 h-0.5 bg-slate-200 -mt-4"></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400">Step 1 of 7</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Platform Information</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Platform Name *
                  </label>
                  <input
                    type="text"
                    defaultValue="VoiceSaaS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    defaultValue="ABC Communications Ltd."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="lg:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Logo</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center bg-slate-50/50">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-[#2563eb]">Click to upload logo</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG (Max 2MB)</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Default Language
                </label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white">
                  <option>English</option>
                  <option>Bengali (বাংলা)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Timezone</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white">
                  <option>(GMT+6) Dhaka</option>
                  <option>(GMT+0) UTC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Currency</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white">
                  <option>BDT (৳)</option>
                  <option>USD ($)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveScreen('overview')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen('setup_provider')}
                className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <span>Next → Provider Setup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. WIZARD SCREEN 2: PROVIDER SETUP                                        */}
      {/* ========================================================================= */}
      {activeScreen === 'setup_provider' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Super Admin Setup Wizard
              </h2>
              <p className="text-xs text-slate-500 mt-1">Configure your platform to get started</p>
            </div>
            <button
              onClick={() => setActiveScreen('overview')}
              className="text-xs font-bold text-[#2563eb] hover:underline"
            >
              ← Back to KPI Dashboard
            </button>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400">Step 3 of 7</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Provider Setup</h3>
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              {['Voice Provider', 'TTS Provider', 'Payment Gateway', 'API Credentials'].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setProviderTab(idx === 0 ? 'voice' : idx === 1 ? 'tts' : 'gateway')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    (idx === 0 && providerTab === 'voice') || (idx === 1 && providerTab === 'tts')
                      ? 'bg-blue-50 text-[#2563eb] border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Provider Name
                  </label>
                  <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white">
                    <option>Twilio (Voice API)</option>
                    <option>FreeSWITCH ESL / Sofia SIP Trunk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account SID
                  </label>
                  <input
                    type="text"
                    defaultValue="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Auth Token
                  </label>
                  <input
                    type="password"
                    defaultValue="••••••••••••••••••••••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Caller ID
                  </label>
                  <input
                    type="text"
                    defaultValue="+8809600XXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => alert('Voice Provider Test Connection Passed (100 Channels Active)!')}
                    className="px-5 py-2.5 rounded-xl bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Test Connection</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold">Connected</span>
                  <span className="text-[10px] text-slate-400">• Just now</span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Type:</span>
                    <strong className="text-slate-900">Production</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Region:</span>
                    <strong className="text-slate-900">Asia</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Concurrent Limit:</span>
                    <strong className="text-slate-900">100</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pricing:</span>
                    <strong className="text-slate-900">৳0.005 / min</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveScreen('setup_info')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen('setup_review')}
                className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <span>Next → Review</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. WIZARD SCREEN 3: REVIEW & ACTIVATE PLATFORM                             */}
      {/* ========================================================================= */}
      {activeScreen === 'setup_review' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Super Admin Setup Wizard
              </h2>
              <p className="text-xs text-slate-500 mt-1">Configure your platform to get started</p>
            </div>
            <button
              onClick={() => setActiveScreen('overview')}
              className="text-xs font-bold text-[#2563eb] hover:underline"
            >
              ← Back to KPI Dashboard
            </button>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400">Step 7 of 7</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Review & Activate</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  Platform Information
                </h4>
                <div className="space-y-1 text-slate-600">
                  <p><span className="text-slate-400">Name:</span> VoiceSaaS</p>
                  <p><span className="text-slate-400">Company:</span> ABC Communications Ltd.</p>
                  <p><span className="text-slate-400">Language:</span> English</p>
                  <p><span className="text-slate-400">Timezone:</span> Asia/Dhaka</p>
                  <p><span className="text-slate-400">Currency:</span> BDT</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  Pricing Summary
                </h4>
                <div className="space-y-1 text-slate-600">
                  <p><span className="text-slate-400">Voice SMS:</span> ৳ 0.50 / call</p>
                  <p><span className="text-slate-400">IVR Call:</span> ৳ 0.40 / minute</p>
                  <p><span className="text-slate-400">TTS:</span> ৳ 0.10 / 1000 chars</p>
                  <p><span className="text-slate-400">Customer Rate:</span> ৳ 1.00 / call</p>
                  <p><span className="text-slate-400">Reseller Rate:</span> ৳ 0.80 / call</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  Services Enabled
                </h4>
                <div className="grid grid-cols-2 gap-1 text-slate-700">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><Check className="w-3.5 h-3.5" /> Voice SMS</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><Check className="w-3.5 h-3.5" /> Voice IVR</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><Check className="w-3.5 h-3.5" /> TTS</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><Check className="w-3.5 h-3.5" /> AI Voice</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><Check className="w-3.5 h-3.5" /> API Access</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><Check className="w-3.5 h-3.5" /> Reseller Tree</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveScreen('setup_provider')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={() => {
                  alert('VoiceSaaS Platform Activated Successfully!');
                  setActiveScreen('overview');
                }}
                className="px-6 py-2.5 rounded-xl bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Activate Platform</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WIZARD SCREEN 4: VOICE SMS CAMPAIGN WIZARD                             */}
      {/* ========================================================================= */}
      {activeScreen === 'voice_sms' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Voice SMS Campaign Wizard
              </h2>
            </div>
            <button
              onClick={() => setActiveScreen('overview')}
              className="text-xs font-bold text-[#2563eb] hover:underline"
            >
              ← Back to KPI Dashboard
            </button>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400">Step 3 of 7</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Audio Message</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'upload', label: 'Upload Audio' },
                { id: 'library', label: 'Select from Library' },
                { id: 'tts', label: 'Generate TTS' },
                { id: 'record', label: 'Record Audio' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setAudioSource(btn.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                    audioSource === btn.id
                      ? 'bg-blue-50 text-[#2563eb] border-[#2563eb]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center bg-slate-50/50 min-h-[200px]">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Click to upload audio file</p>
                  <p className="text-[11px] text-slate-400 mt-1">MP3, WAV (Max 10MB)</p>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-900">Audio Preview</h4>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  <button className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0">
                    <Play className="w-3.5 h-3.5 ml-0.5 fill-white" />
                  </button>
                  <div className="flex-1">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-[#2563eb] rounded-full"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                      <span>0:00</span>
                      <span>0:30</span>
                    </div>
                  </div>
                  <Volume2 className="w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <strong className="text-slate-900 font-mono">00:30</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Format:</span>
                    <strong className="text-slate-900">MP3</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Size:</span>
                    <strong className="text-slate-900">350 KB</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveScreen('overview')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen('ivr_builder')}
                className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <span>Next → IVR Builder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. WIZARD SCREEN 5: VOICE IVR BUILDER WIZARD                              */}
      {/* ========================================================================= */}
      {activeScreen === 'ivr_builder' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Voice IVR Builder Wizard
              </h2>
            </div>
            <button
              onClick={() => setActiveScreen('overview')}
              className="text-xs font-bold text-[#2563eb] hover:underline"
            >
              ← Back to KPI Dashboard
            </button>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400">Step 3 of 6</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Menu Configuration</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Menu Options</h4>
                <div className="space-y-2">
                  {ivrOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedOption(opt.digit)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        selectedOption === opt.digit
                          ? 'bg-blue-50/70 border-blue-300 text-slate-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <GripVertical className="w-4 h-4 text-slate-300" />
                        <PhoneCall className="w-4 h-4 text-[#2563eb]" />
                        <span className="text-xs">{opt.title}</span>
                      </div>
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextDigit = String(ivrOptions.length + 1);
                    setIvrOptions([
                      ...ivrOptions,
                      {
                        id: nextDigit,
                        digit: nextDigit,
                        title: `Press ${nextDigit} - Operator`,
                        dest: 'Queue',
                        queue: 'General Queue',
                      },
                    ]);
                  }}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 text-xs font-bold text-[#2563eb] flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Menu Option</span>
                </button>
              </div>

              <div className="lg:col-span-7 bg-slate-50/60 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-900">Configure Menu Option</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      DTMF Digit *
                    </label>
                    <select
                      value={selectedOption}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Description *
                    </label>
                    <input
                      type="text"
                      defaultValue="Sales Department"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Destination *
                    </label>
                    <select className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white">
                      <option>Queue</option>
                      <option>Forward to 01713252758</option>
                      <option>Voicemail</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Select Queue
                    </label>
                    <select className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white">
                      <option>Sales Queue</option>
                      <option>Support Queue</option>
                      <option>Billing Queue</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveScreen('overview')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen('ivr_flow')}
                className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <span>Next → View Flow Canvas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. WIZARD SCREEN 6: IVR FLOW PREVIEW (VISUAL FLOW CANVAS)                  */}
      {/* ========================================================================= */}
      {activeScreen === 'ivr_flow' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                IVR Flow Preview
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => alert('IVR Flow Topology: 0 Errors, AST-ARI Validated.')}
                className="px-4 py-2 rounded-xl border border-[#2563eb] text-[#2563eb] hover:bg-blue-50 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Validate Flow</span>
              </button>
              <button
                onClick={() => setActiveScreen('overview')}
                className="text-xs font-bold text-[#2563eb] hover:underline"
              >
                ← Back to KPI Dashboard
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-9 bg-slate-50/50 border border-slate-200/90 rounded-2xl p-6 sm:p-10 flex flex-col items-center shadow-inner relative overflow-hidden min-h-[460px]">
              <div className="px-5 py-2 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm z-10">
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start</span>
              </div>
              <div className="w-0.5 h-8 bg-slate-300"></div>

              <div className="w-64 p-3.5 rounded-xl bg-blue-50 border-2 border-blue-400 text-center shadow-xs z-10">
                <h4 className="text-xs font-bold text-blue-900">Welcome Message</h4>
                <p className="text-[11px] text-blue-600 mt-0.5">Play: welcome.mp3</p>
              </div>

              <div className="w-0.5 h-6 bg-slate-300"></div>
              <div className="w-72 sm:w-96 h-0.5 bg-slate-300 relative">
                <div className="absolute -left-1 -bottom-4 w-0.5 h-5 bg-slate-300"></div>
                <div className="absolute left-1/2 -bottom-4 w-0.5 h-5 bg-slate-300"></div>
                <div className="absolute -right-1 -bottom-4 w-0.5 h-5 bg-slate-300"></div>
              </div>
              <div className="h-4"></div>

              <div className="grid grid-cols-3 gap-4 w-full max-w-xl z-10 pt-2">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs text-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center mx-auto text-xs font-bold">1</div>
                  <h5 className="text-[11px] font-bold text-slate-800">Press 1</h5>
                  <p className="text-[10px] text-slate-400">Sales Queue</p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs text-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center mx-auto text-xs font-bold">2</div>
                  <h5 className="text-[11px] font-bold text-slate-800">Press 2</h5>
                  <p className="text-[10px] text-slate-400">Support Queue</p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs text-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center mx-auto text-xs font-bold">3</div>
                  <h5 className="text-[11px] font-bold text-slate-800">Press 3</h5>
                  <p className="text-[10px] text-slate-400">Billing</p>
                </div>
              </div>

              <div className="w-72 sm:w-96 h-0.5 bg-slate-300 mt-4 relative">
                <div className="absolute -left-1 -top-4 w-0.5 h-4 bg-slate-300"></div>
                <div className="absolute left-1/2 -top-4 w-0.5 h-4 bg-slate-300"></div>
                <div className="absolute -right-1 -top-4 w-0.5 h-4 bg-slate-300"></div>
              </div>
              <div className="w-0.5 h-6 bg-slate-300"></div>

              <div className="px-5 py-2 rounded-full bg-rose-50 border-2 border-rose-400 text-rose-700 font-bold text-xs flex items-center gap-2 shadow-xs z-10">
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Call</span>
              </div>
            </div>

            <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">Nodes</h4>
              <div className="space-y-1.5 text-xs text-slate-700">
                {[
                  { name: 'Audio Playback', icon: FileAudio },
                  { name: 'TTS Message', icon: Mic },
                  { name: 'DTMF Input', icon: PhoneCall },
                  { name: 'Queue', icon: Users },
                  { name: 'Extension', icon: PhoneCall },
                  { name: 'External Number', icon: PhoneCall },
                  { name: 'Voicemail', icon: Radio },
                  { name: 'Condition', icon: GitFork },
                  { name: 'End Call', icon: PhoneOff },
                ].map((node, idx) => {
                  const NodeIcon = node.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-grab transition"
                    >
                      <NodeIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-semibold text-xs">{node.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. WIZARD SCREEN 7: TTS & AI VOICE WIZARD                                 */}
      {/* ========================================================================= */}
      {activeScreen === 'tts_wizard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                TTS & AI Voice Wizard
              </h2>
            </div>
            <button
              onClick={() => setActiveScreen('overview')}
              className="text-xs font-bold text-[#2563eb] hover:underline"
            >
              ← Back to KPI Dashboard
            </button>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400">Step 1 of 5</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Text Input</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Text Content *</label>
                <textarea
                  rows={6}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-right text-[11px] text-slate-400 font-mono">{ttsText.length} / 5000</div>
              </div>

              <div className="lg:col-span-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Language</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white">
                    <option>Bengali (বাংলা)</option>
                    <option>English (US)</option>
                  </select>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <h4 className="font-bold text-slate-900 text-xs">Sample Scripts</h4>
                  <ul className="space-y-1.5 text-slate-600">
                    <li><button onClick={() => setTtsText('প্রিয় গ্রাহক, আপনার অর্ডার সফলভাবে নিশ্চিত হয়েছে।')} className="text-[#2563eb] hover:underline font-semibold">Order Confirmation</button></li>
                    <li><button onClick={() => setTtsText('আপনার অ্যাপয়েন্টমেন্ট আগামীকাল সকাল ১০টায় নির্ধারিত হয়েছে।')} className="hover:text-slate-900">Appointment Reminder</button></li>
                    <li><button onClick={() => setTtsText('আপনার মাসিক বিল পরিশোধ করার জন্য বিনীত অনুরোধ করা হচ্ছে।')} className="hover:text-slate-900">Payment Reminder</button></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveScreen('overview')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => alert('Generating Bengali Neural TTS Audio...')}
                className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <span>Generate Voice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. WIZARD SCREEN 8: RESELLER ONBOARDING WIZARD                            */}
      {/* ========================================================================= */}
      {activeScreen === 'reseller_wizard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Reseller Onboarding Wizard
              </h2>
            </div>
            <button
              onClick={() => setActiveScreen('overview')}
              className="text-xs font-bold text-[#2563eb] hover:underline"
            >
              ← Back to KPI Dashboard
            </button>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400">Step 1 of 5</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Reseller Information</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company Name *</label>
                  <input type="text" defaultValue="XYZ Telecom" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Person *</label>
                  <input type="text" defaultValue="Rahim Uddin" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email *</label>
                    <input type="email" defaultValue="rahim@xyz.com" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone *</label>
                    <input type="text" defaultValue="+8801XXXXXXXXX" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Business Documents</h4>
                {['Trade License', 'NID / Passport', 'Business Certificate'].map((doc, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 flex items-center justify-between cursor-pointer transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">{doc}</h5>
                        <p className="text-[10px] text-slate-400">Upload PDF, JPG (Max 5MB)</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveScreen('overview')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => alert('Reseller KYC Documents submitted for verification!')}
                className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <span>Submit & Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. WIZARD SCREEN 9: RECHARGE WIZARD                                      */}
      {/* ========================================================================= */}
      {activeScreen === 'recharge_wizard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recharge Wizard</h2>
            </div>
            <button
              onClick={() => setActiveScreen('overview')}
              className="text-xs font-bold text-[#2563eb] hover:underline"
            >
              ← Back to KPI Dashboard
            </button>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400">Step 2 of 4</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Recharge Details</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Recharge Amount *
                  </label>
                  <input
                    type="text"
                    value={`৳ ${rechargeAmount.toLocaleString()}`}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                      setRechargeAmount(num);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[500, 1000, 2000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRechargeAmount(amt)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border ${
                        rechargeAmount === amt
                          ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method *</label>
                  <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white">
                    <option>PayStation (Online Payment)</option>
                    <option>bKash Merchant</option>
                    <option>Nagad Direct</option>
                  </select>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Recharge Summary</h4>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <strong className="text-slate-900 font-mono">৳ {rechargeAmount.toLocaleString()}.00</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee:</span>
                    <strong className="text-slate-900 font-mono">৳ 0.00</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                    <span>Total Payable:</span>
                    <strong className="text-[#2563eb] font-mono text-sm">৳ {rechargeAmount.toLocaleString()}.00</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveScreen('overview')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={() => alert(`Redirecting to PayStation Gateway for ৳${rechargeAmount}...`)}
                className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
