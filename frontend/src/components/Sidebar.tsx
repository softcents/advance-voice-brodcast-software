'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  GitFork,
  Mic,
  Users,
  Users2,
  Wallet,
  BarChart3,
  Server,
  Code2,
  Settings,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Radio,
  Share2,
  Sliders,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { activeUser, isImpersonating, exitImpersonation, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Voice SMS', href: '/calling/campaigns', icon: Megaphone },
    { name: 'Voice IVR', href: '/ivr/flows', icon: GitFork },
    { name: 'TTS & AI Voice', href: '/settings/tts', icon: Mic },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Resellers', href: '/resellers', icon: Users2 },
    { name: 'Billing & Wallet', href: '/wallet', icon: Wallet },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Providers', href: '/settings/servers', icon: Server },
    { name: 'API & Webhooks', href: '/developers/tokens', icon: Code2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-slate-200/90 z-50 flex flex-col justify-between overflow-y-auto bg-white text-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      <div>
        {/* VoiceSaaS Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200/80 bg-white sticky top-0 z-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Blue VoiceSaaS Logo Mark */}
            <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-white"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <div className="flex items-center text-lg font-black tracking-tight">
              <span className="text-slate-900">Voice</span>
              <span className="text-[#2563eb]">SaaS</span>
            </div>
          </Link>
        </div>

        {/* Navigation Items (Exact 11 Items from Mockup) */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                  isActive
                    ? 'bg-blue-50 text-[#2563eb] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-[#2563eb]' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Super Admin User Footer */}
      <div className="p-4 m-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-slate-200 flex-shrink-0">
              <img src="/avatar.jpg" alt="Super Admin" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {activeUser?.name || 'Super Admin'}
              </h4>
              <p className="text-[10.5px] text-slate-400 font-medium truncate">
                Admin
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {isImpersonating && (
          <button
            onClick={exitImpersonation}
            className="w-full py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Return to Super Admin
          </button>
        )}
      </div>
    </aside>
  );
}
