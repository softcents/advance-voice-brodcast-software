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
  ShieldCheck,
  GitFork,
  Layers,
  PhoneIncoming,
  Mic,
  Languages,
  Radio,
  Wallet,
  ArrowDownLeft,
  Receipt,
  BadgePercent,
  BarChart3,
  LineChart,
  FileSpreadsheet,
  Users2,
  Palette,
  Server,
  Sliders,
  Code2,
  Settings,
  ChevronDown,
  LogOut,
  RotateCcw,
  Search,
  Activity,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Customers', href: '/customers', icon: UserCheck },
    ],
  },
  {
    title: 'Audience & Contacts',
    items: [
      { name: 'Contact Groups', href: '/audience/groups', icon: FolderTree },
      { name: 'Bulk Contacts', href: '/audience/contacts', icon: Users },
    ],
  },
  {
    title: 'Voice Broadcast',
    items: [
      { name: 'Voice Campaigns', href: '/calling/campaigns', icon: Megaphone },
      { name: 'Live Call Monitor', href: '/calling/calls', icon: History, badge: 'Live', badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      { name: 'Audio Studio', href: '/calling/audio', icon: FileAudio },
      { name: 'Voice OTP (2FA)', href: '/calling/otp', icon: ShieldCheck, badge: 'OTP', badgeColor: 'bg-amber-100 text-amber-700 border-amber-200' },
    ],
  },
  {
    title: 'Interactive IVR',
    items: [
      { name: 'IVR Flow Builder', href: '/ivr/flows', icon: GitFork, badge: 'Visual', badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
      { name: 'Voice IVR Orders', href: '/ivr/orders', icon: Layers },
      { name: 'DTMF Callbacks', href: '/ivr/callbacks', icon: PhoneIncoming },
    ],
  },
  {
    title: 'Text To Speech (TTS)',
    items: [
      { name: 'Neural TTS Studio', href: '/tts', icon: Mic, badge: 'AI', badgeColor: 'bg-purple-100 text-purple-700 border-purple-200' },
      { name: 'Languages', href: '/tts/languages', icon: Languages },
      { name: 'Voice Artists', href: '/tts/artists', icon: Radio },
    ],
  },
  {
    title: 'Billing & Finance',
    items: [
      { name: 'Balance & Wallet', href: '/wallet', icon: Wallet },
      { name: 'Deposits', href: '/finance/deposits', icon: ArrowDownLeft },
      { name: 'Transactions Ledger', href: '/finance/transactions', icon: Receipt },
      { name: 'Pricing & Rate Cards', href: '/pricing', icon: BadgePercent },
    ],
  },
  {
    title: 'Reports & Analytics',
    items: [
      { name: 'Sales & Profit', href: '/reports', icon: BarChart3, badge: 'Profit', badgeColor: 'bg-blue-100 text-blue-700 border-blue-200' },
      { name: 'Usage & Billing', href: '/reports/usage', icon: LineChart },
      { name: 'Call Details (CDR)', href: '/reports?tab=cdr', icon: FileSpreadsheet, badge: 'Excel', badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    ],
  },
  {
    title: 'Enterprise & Resellers',
    items: [
      { name: 'Hierarchy Tree', href: '/resellers', icon: Users2, badge: 'Multi-Tier', badgeColor: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
      { name: 'White-Label Branding', href: '/resellers/branding', icon: Palette },
    ],
  },
  {
    title: 'Telecom & Settings',
    items: [
      { name: 'FreeSWITCH & Trunks', href: '/settings/servers', icon: Server, badge: 'FreeSWITCH', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      { name: 'Caller IDs & DIDs', href: '/settings/callers', icon: Radio },
      { name: 'Calling Config', href: '/settings/calling', icon: Sliders },
      { name: 'TTS Engine Config', href: '/settings/tts', icon: Mic },
      { name: 'API & Webhooks', href: '/developers/tokens', icon: Code2, badge: 'REST', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' },
      { name: 'System Settings', href: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { activeUser, isImpersonating, exitImpersonation, logout } = useAuth();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href.includes('?')) {
      const [pathPart] = href.split('?');
      return pathname === pathPart;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Filter sections based on search query
  const filteredSections = navSections
    .map((section) => {
      if (!searchQuery.trim()) return section;
      const filteredItems = section.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredItems.length === 0) return null;
      return { ...section, items: filteredItems };
    })
    .filter(Boolean) as NavSection[];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-slate-200/90 z-50 flex flex-col justify-between bg-white text-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] font-sans">
      {/* Brand Header */}
      <div className="flex-shrink-0 border-b border-slate-200/80 bg-white sticky top-0 z-10 px-5 pt-4 pb-3 space-y-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563eb] to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform flex-shrink-0">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center text-lg font-black tracking-tight leading-none">
              <span className="text-slate-900">Voice</span>
              <span className="text-[#2563eb]">SaaS</span>
            </div>
            <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mt-0.5">
              Enterprise PBX
            </span>
          </div>
        </Link>

        {/* Quick Search Menu Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menus (e.g. CDR, IVR)..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 placeholder-slate-400 transition"
          />
        </div>
      </div>

      {/* Navigation Sections (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
        {filteredSections.map((sec, idx) => {
          const hasTitle = !!sec.title;
          const isCollapsed = hasTitle ? collapsed[sec.title!] : false;

          return (
            <div key={sec.title || `sec-${idx}`} className="space-y-1">
              {hasTitle && (
                <button
                  type="button"
                  onClick={() => toggleSection(sec.title!)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-700 transition group select-none"
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
                    const active = isItemActive(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          active
                            ? 'bg-blue-50 text-[#2563eb] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 transition-colors ${
                              active ? 'text-[#2563eb]' : 'text-slate-400'
                            }`}
                            strokeWidth={active ? 2.5 : 2}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-full border leading-none flex-shrink-0 ml-1.5 ${
                              active
                                ? 'bg-[#2563eb] text-white border-[#2563eb]'
                                : item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
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

      {/* Footer Area: FreeSWITCH Status + Super Admin Profile */}
      <div className="flex-shrink-0 border-t border-slate-200/80 bg-white p-3 space-y-2">
        {/* FreeSWITCH Live Engine Card */}
        <Link
          href="/settings/servers"
          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 text-[11px] transition group"
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
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-slate-200 flex-shrink-0 bg-blue-100 flex items-center justify-center font-black text-blue-700">
              {activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-slate-900 truncate">
                {activeUser?.name || 'Super Admin'}
              </h4>
              <p className="text-[10px] text-slate-400 font-bold truncate">
                {activeUser?.role || 'Admin'}
              </p>
            </div>
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
