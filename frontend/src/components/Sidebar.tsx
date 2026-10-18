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
  GitFork,
  Code2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavGroup {
  title?: string;
  items: {
    name: string;
    href: string;
    icon: any;
    badge?: string;
  }[];
}

const adminNavSections: NavGroup[] = [
  {
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Customers', href: '/customers', icon: UserCheck },
    ],
  },
  {
    title: 'Audience',
    items: [
      { name: 'Groups', href: '/audience/groups', icon: FolderTree },
      { name: 'Contacts', href: '/audience/contacts', icon: Users },
    ],
  },
  {
    title: 'Calling',
    items: [
      { name: 'Campaigns', href: '/calling/campaigns', icon: Megaphone },
      { name: 'Calls', href: '/calling/calls', icon: History },
      { name: 'Audio', href: '/calling/audio', icon: FileAudio },
      { name: 'Voice IVR', href: '/ivr/flows', icon: GitFork, badge: 'Flows' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { name: 'Deposits', href: '/finance/deposits', icon: ArrowDownLeft },
      { name: 'Transactions', href: '/finance/transactions', icon: Receipt },
      { name: 'My Wallet', href: '/wallet', icon: Wallet },
    ],
  },
  {
    title: 'Text To Speech',
    items: [
      { name: 'Languages', href: '/tts/languages', icon: Languages },
      { name: 'Artists', href: '/tts/artists', icon: Mic },
    ],
  },
  {
    title: 'Settings',
    items: [
      { name: 'Calling', href: '/settings/calling', icon: Settings },
      { name: 'TTS', href: '/settings/tts', icon: Speaker },
      { name: 'Callers', href: '/settings/callers', icon: Radio },
      { name: 'Servers', href: '/settings/servers', icon: Server, badge: 'FreeSWITCH' },
      { name: 'API & Webhooks', href: '/developers/tokens', icon: Code2, badge: 'REST' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { name: 'Sales & Profit', href: '/reports', icon: BarChart3, badge: 'Profit' },
      { name: 'Usage & Billing', href: '/reports/usage', icon: LineChart, badge: 'Client' },
      { name: 'Call Details (CDR)', href: '/reports?tab=cdr', icon: History, badge: 'Excel' },
    ],
  },
  {
    title: 'Enterprise Suite',
    items: [
      { name: 'Hierarchy Tree', href: '/resellers', icon: Users2, badge: 'Multi-Tier' },
      { name: 'Pricing Plans', href: '/pricing', icon: BadgePercent },
    ],
  },
];

const customerNavSections: NavGroup[] = [
  {
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Audience',
    items: [
      { name: 'Groups', href: '/audience/groups', icon: FolderTree },
      { name: 'Contacts', href: '/audience/contacts', icon: Users },
    ],
  },
  {
    title: 'Voice Broadcasting',
    items: [
      { name: 'Campaigns', href: '/calling/campaigns', icon: Megaphone },
      { name: 'Call Logs', href: '/calling/calls', icon: History },
      { name: 'Audio Library', href: '/calling/audio', icon: FileAudio },
      { name: 'Voice IVR', href: '/ivr/flows', icon: GitFork },
    ],
  },
  {
    title: 'Billing & Finance',
    items: [
      { name: 'My Deposits', href: '/finance/deposits', icon: ArrowDownLeft },
      { name: 'Transactions', href: '/finance/transactions', icon: Receipt },
      { name: 'Recharge Wallet', href: '/wallet', icon: Wallet },
    ],
  },
  {
    title: 'Reports',
    items: [
      { name: 'Usage & Billing', href: '/reports/usage', icon: LineChart, badge: 'Client' },
      { name: 'Call Details (CDR)', href: '/reports?tab=cdr', icon: History, badge: 'CDR' },
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
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-slate-200/90 z-50 flex flex-col justify-between overflow-y-auto bg-white text-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] font-sans">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200/80 bg-white sticky top-0 z-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center text-lg font-black tracking-tight leading-none">
                <span className="text-slate-900">Voice</span>
                <span className="text-[#2563eb]">SaaS</span>
              </div>
              <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mt-0.5">
                {isCustomer ? 'Customer Portal' : 'Enterprise PBX'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-4">
          {navSections.map((sec, idx) => {
            const hasTitle = !!sec.title;
            const isCollapsed = hasTitle ? collapsed[sec.title!] : false;

            return (
              <div key={sec.title || `sec-${idx}`} className="space-y-1">
                {hasTitle && (
                  <button
                    type="button"
                    onClick={() => toggle(sec.title!)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-700 transition group select-none"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">{sec.title}</span>
                    <ChevronDown
                      className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90 text-slate-500' : ''
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
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-blue-50 text-[#2563eb] font-extrabold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 flex-shrink-0 transition-colors ${
                                isActive ? 'text-[#2563eb]' : 'text-slate-400'
                              }`}
                              strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-full border leading-none flex-shrink-0 ml-1.5 ${
                                isActive
                                  ? 'bg-[#2563eb] text-white border-[#2563eb]'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
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
      <div className="p-3 m-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs shadow-xs space-y-2">
        {/* FreeSWITCH Live Status Pill */}
        <Link
          href="/settings/servers"
          className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 text-[11px] transition group hover:border-blue-200"
          title="FreeSWITCH ESL Engine Online"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-slate-700 group-hover:text-[#2563eb] transition">
              FreeSWITCH 1.11.3
            </span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            ESL UP
          </span>
        </Link>

        {/* User Card */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-slate-200 flex-shrink-0 bg-blue-100 flex items-center justify-center font-black text-blue-700">
              {activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-slate-900 truncate">
                {activeUser?.name || 'Super Admin'}
              </h4>
              <p className="text-[10.5px] text-slate-400 font-bold truncate">
                {isCustomer ? 'Customer' : 'Super Admin'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
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
