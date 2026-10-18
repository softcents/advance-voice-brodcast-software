'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCheck,
  FolderTree,
  Users,
  Megaphone,
  History,
  FileAudio,
  Users2,
  BadgePercent,
  ArrowDownLeft,
  Receipt,
  Languages,
  Mic,
  BarChart3,
  LineChart,
  Settings,
  Speaker,
  Radio,
  Server,
  ChevronDown,
  LogOut,
  RotateCcw,
  Wallet,
  ShieldCheck,
  User,
  CheckCircle2,
  GitFork,
  PhoneCall,
  Palette,
  Code2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  image?: string;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const adminNavSections: NavGroup[] = [
  {
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, image: '/icons/dashboard.svg' },
    ],
  },
  {
    title: 'Voice Broadcast & Engine',
    items: [
      { name: 'Campaigns', href: '/calling/campaigns', icon: Megaphone, badge: 'broadcast', image: '/icons/broadcast.jpg' },
      { name: 'Instant Voice OTP', href: '/calling/otp', icon: Radio, badge: 'Live', image: '/icons/otp.svg' },
      { name: 'Call Detail Records', href: '/calling/calls', icon: History, image: '/icons/cdr.svg' },
      { name: 'Audio Prompt Library', href: '/calling/audio', icon: FileAudio, image: '/icons/audio.svg' },
    ],
  },
  {
    title: 'Outbound IVR & Workflows',
    items: [
      { name: 'Order Confirmation', href: '/ivr/orders', icon: CheckCircle2, badge: 'Auto IVR', image: '/icons/ivr.svg' },
      { name: 'IVR Flow Designer', href: '/ivr/flows', icon: GitFork, badge: 'Bangla', image: '/icons/flows.svg' },
      { name: 'Customer Callbacks', href: '/ivr/callbacks', icon: PhoneCall, image: '/icons/callbacks.svg' },
    ],
  },
  {
    title: 'Resellers & Accounts',
    items: [
      { name: 'Reseller Hierarchy', href: '/resellers', icon: Users2, badge: 'Tree', image: '/icons/resellers.svg' },
      { name: 'Customer Accounts', href: '/customers', icon: UserCheck, badge: 'Users', image: '/icons/customers.svg' },
      { name: 'White Label Branding', href: '/resellers/branding', icon: Palette, badge: 'Portal', image: '/icons/branding.svg' },
      { name: 'Tariffs & Rate Cards', href: '/pricing', icon: BadgePercent, image: '/icons/tariffs.svg' },
    ],
  },
  {
    title: 'Audience & Contacts',
    items: [
      { name: 'Contact Groups', href: '/audience/groups', icon: FolderTree, image: '/icons/groups.svg' },
      { name: 'All Contacts', href: '/audience/contacts', icon: Users, image: '/icons/contacts.svg' },
    ],
  },
  {
    title: 'Finance & Ledger',
    items: [
      { name: 'Corporate Wallet', href: '/wallet', icon: Wallet, image: '/icons/wallet.svg' },
      { name: 'Deposit Requests', href: '/finance/deposits', icon: ArrowDownLeft, image: '/icons/deposits.svg' },
      { name: 'Transaction Ledger', href: '/finance/transactions', icon: Receipt, image: '/icons/ledger.svg' },
    ],
  },
  {
    title: 'Reports & Analytics',
    items: [
      { name: 'Sales & Gross Profit', href: '/reports', icon: BarChart3, badge: 'Profit', image: '/icons/reports.svg' },
      { name: 'Usage & Carrier Trends', href: '/reports/usage', icon: LineChart, image: '/icons/usage.svg' },
    ],
  },
  {
    title: 'Settings & Telecom',
    items: [
      { name: 'FreeSWITCH ESL Nodes', href: '/settings/servers', icon: Server, badge: 'FreeSWITCH', image: '/icons/servers.svg' },
      { name: 'SIP Trunks & DIDs', href: '/settings/callers', icon: Radio, image: '/icons/trunks.svg' },
      { name: 'Calling Engine', href: '/settings/calling', icon: Settings, image: '/icons/calling.svg' },
      { name: 'Neural TTS & Voices', href: '/settings/tts', icon: Speaker, image: '/icons/tts.svg' },
      { name: 'Developer REST API', href: '/developers/tokens', icon: Code2, badge: 'API', image: '/icons/api.svg' },
    ],
  },
];

const customerNavSections: NavGroup[] = [
  {
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, image: '/icons/dashboard.svg' },
    ],
  },
  {
    title: 'Voice Broadcasting',
    items: [
      { name: 'Campaigns', href: '/calling/campaigns', icon: Megaphone, badge: 'broadcast', image: '/icons/broadcast.jpg' },
      { name: 'Instant Voice OTP', href: '/calling/otp', icon: Radio, image: '/icons/otp.svg' },
      { name: 'Call History (CDR)', href: '/calling/calls', icon: History, image: '/icons/cdr.svg' },
      { name: 'Audio Library', href: '/calling/audio', icon: FileAudio, image: '/icons/audio.svg' },
    ],
  },
  {
    title: 'Outbound IVR',
    items: [
      { name: 'Order Confirmation', href: '/ivr/orders', icon: CheckCircle2, badge: 'Auto IVR', image: '/icons/ivr.svg' },
      { name: 'IVR Flow Settings', href: '/ivr/flows', icon: GitFork, image: '/icons/flows.svg' },
      { name: 'Customer Callbacks', href: '/ivr/callbacks', icon: PhoneCall, image: '/icons/callbacks.svg' },
    ],
  },
  {
    title: 'Audience & Contacts',
    items: [
      { name: 'Contact Groups', href: '/audience/groups', icon: FolderTree, image: '/icons/groups.svg' },
      { name: 'All Contacts', href: '/audience/contacts', icon: Users, image: '/icons/contacts.svg' },
    ],
  },
  {
    title: 'Billing & Wallet',
    items: [
      { name: 'Corporate Wallet', href: '/wallet', icon: Wallet, image: '/icons/wallet.svg' },
      { name: 'Recharge Requests', href: '/finance/deposits', icon: ArrowDownLeft, image: '/icons/deposits.svg' },
      { name: 'Transaction History', href: '/finance/transactions', icon: Receipt, image: '/icons/ledger.svg' },
    ],
  },
  {
    title: 'Reports & Developer',
    items: [
      { name: 'Usage & Billing', href: '/reports/usage', icon: LineChart, image: '/icons/usage.svg' },
      { name: 'Developer API Tokens', href: '/developers/tokens', icon: Code2, badge: 'API', image: '/icons/api.svg' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { activeUser, isImpersonating, exitImpersonation, logout } = useAuth();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isCustomer = activeUser?.role === 'CUSTOMER';
  const navSections = isCustomer ? customerNavSections : adminNavSections;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-slate-200 z-50 flex flex-col justify-between overflow-y-auto bg-white shadow-sm font-sans">
      <div>
        {/* Brand Header with Photo Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 bg-white sticky top-0 z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-indigo-500/20 ring-1 ring-slate-200 flex-shrink-0 group">
              <img
                src="/voicepro-logo.jpg"
                alt="VoicePro Logo"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>VOICEPRO</span>
                <span className="text-[9px] uppercase tracking-wider bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                  ENTERPRISE
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide truncate">
                {isCustomer ? 'Corporate Portal' : 'Carrier Voice PBX'}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-3">
          {navSections.map((sec, idx) => {
            const hasTitle = !!sec.title;
            const isCollapsed = hasTitle ? collapsed[sec.title!] : false;

            return (
              <div key={sec.title || `sec-${idx}`} className="space-y-1">
                {hasTitle && (
                  <button
                    type="button"
                    onClick={() => toggle(sec.title!)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-700 transition"
                  >
                    <span>{sec.title}</span>
                    <ChevronDown
                      className={`w-3 h-3 text-slate-400 transition-transform ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                    />
                  </button>
                )}

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {sec.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/' && !item.href.includes('?') && pathname.startsWith(item.href));
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all group ${
                            isActive
                              ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`relative w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 group-hover:scale-110 shadow-sm ${
                                isActive
                                  ? 'ring-2 ring-white ring-offset-1 shadow-md'
                                  : 'ring-1 ring-slate-200/80 group-hover:shadow'
                              }`}
                            >
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center ${
                                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>
                            <span
                              className={`truncate tracking-tight ${
                                isActive ? 'text-white font-bold' : 'text-slate-800 font-semibold'
                              }`}
                            >
                              {item.name}
                            </span>
                          </div>

                          {item.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 transition-colors ${
                                isActive
                                  ? 'bg-white/20 text-white border border-white/30'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 group-hover:border-slate-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Area: FreeSWITCH Status + Role Status */}
      <div className="p-3 m-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 shadow-sm">
        {/* FreeSWITCH Live Status Pill */}
        <Link
          href="/settings/servers"
          className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 text-[11px] transition group hover:border-indigo-300"
          title="FreeSWITCH ESL Engine Online"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-slate-700 group-hover:text-indigo-600 transition">
              FreeSWITCH 1.11.3
            </span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            ESL UP
          </span>
        </Link>

        {/* Account Role & User Info */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Account Role</span>
          {isImpersonating ? (
            <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px]">
              Impersonated
            </span>
          ) : isCustomer ? (
            <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
              Customer Tier
            </span>
          ) : (
            <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px]">
              Carrier Admin
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm ring-2 ring-indigo-500/20 flex-shrink-0">
            <img src="/avatar.jpg" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="text-slate-900 font-bold truncate flex items-center gap-1 text-xs">
              <span className="truncate">{activeUser?.name || 'Administrator'}</span>
              {activeUser?.role === 'SUPER_ADMIN' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
              ) : (
                <User className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
              )}
            </div>
            <div className="text-[11px] text-slate-500 truncate">{activeUser?.email || 'admin@voicepro.com'}</div>
          </div>

          <button
            onClick={logout}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Impersonation Return Button */}
        {isImpersonating && (
          <button
            onClick={exitImpersonation}
            className="w-full py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-black flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Return to Super Admin
          </button>
        )}
      </div>
    </aside>
  );
}
