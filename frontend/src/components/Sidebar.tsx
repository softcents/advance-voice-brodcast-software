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
    ],
  },
  {
    title: 'Finance',
    items: [
      { name: 'Deposits', href: '/finance/deposits', icon: ArrowDownLeft },
      { name: 'Transactions', href: '/finance/transactions', icon: Receipt },
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
      { name: 'Servers', href: '/settings/servers', icon: Server, badge: 'Docker' },
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
    ],
  },
  {
    title: 'Billing & Finance',
    items: [
      { name: 'My Deposits', href: '/finance/deposits', icon: ArrowDownLeft },
      { name: 'Transactions', href: '/finance/transactions', icon: Receipt },
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
    <aside className="fixed left-0 top-0 bottom-0 w-64 glass-panel border-r border-gray-800 z-50 flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-800/80 bg-gray-950/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              VoicePro <span className="text-[10px] uppercase tracking-wider bg-brand-500/20 text-brand-300 font-semibold px-2 py-0.5 rounded-full border border-brand-500/30">VSMS</span>
            </h1>
            <p className="text-xs text-gray-400">
              {isCustomer ? 'Customer Portal' : 'Enterprise Voice PBX'}
            </p>
          </div>
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
                    onClick={() => toggle(sec.title!)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 hover:text-white transition"
                  >
                    <span>{sec.title}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                )}

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {sec.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-600/25'
                              : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
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

      {/* Footer Role & Profile Status */}
      <div className="p-3 m-3 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-[11px]">Active Mode</span>
          {isImpersonating ? (
            <span className="text-amber-300 font-bold bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px]">
              Impersonated
            </span>
          ) : isCustomer ? (
            <span className="text-emerald-400 font-bold bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px]">
              Customer
            </span>
          ) : (
            <span className="text-indigo-400 font-bold bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full text-[10px]">
              Super Admin
            </span>
          )}
        </div>

        <div className="space-y-0.5">
          <div className="text-gray-200 font-bold truncate flex items-center gap-1.5">
            {isCustomer ? <User className="w-3.5 h-3.5 text-brand-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
            <span className="truncate">{activeUser?.name || 'User'}</span>
          </div>
          <div className="text-[11px] text-gray-500 truncate">{activeUser?.email || 'admin@voicepro.com'}</div>
        </div>

        {isCustomer && (
          <div className="flex items-center justify-between text-[11px] bg-black/40 px-2 py-1 rounded-lg border border-gray-800/80">
            <span className="text-gray-400 flex items-center gap-1">
              <Wallet className="w-3 h-3 text-emerald-400" /> Wallet:
            </span>
            <span className="font-bold text-emerald-400">
              ৳{Number(activeUser?.wallet?.balance || 0).toFixed(2)}
            </span>
          </div>
        )}

        <div className="pt-1.5 border-t border-gray-800 flex items-center justify-between">
          {isImpersonating ? (
            <button
              onClick={exitImpersonation}
              className="w-full py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Return to Admin
            </button>
          ) : (
            <button
              onClick={logout}
              className="w-full py-1.5 px-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" /> Sign Out
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
