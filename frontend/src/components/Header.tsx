'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  ChevronLeft,
  ChevronDown,
  Plus,
  ShieldCheck,
  User,
  LogOut,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { activeUser, isImpersonating, exitImpersonation, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const mockNotifications = [
    {
      id: '1',
      title: 'Twilio Voice Provider Connected',
      desc: 'Trunk +8809600XXXXXX is active with 100 concurrent channels.',
      time: 'Just now',
      unread: true,
    },
    {
      id: '2',
      title: 'Voice SMS Campaign Finished',
      desc: 'Campaign #104 delivered with 94.2% completion rate.',
      time: '12m ago',
      unread: false,
    },
    {
      id: '3',
      title: 'PayStation Online Recharge',
      desc: '৳1,000.00 wallet recharge settled successfully.',
      time: '1h ago',
      unread: false,
    },
  ];

  return (
    <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40 flex flex-col shadow-xs">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-2 flex items-center justify-between text-xs text-white font-bold shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white animate-bounce" />
            <span>
              Impersonating Customer: <strong>{activeUser?.name}</strong> ({activeUser?.email})
            </span>
          </div>
          <button
            onClick={exitImpersonation}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-black/40 hover:bg-black/60 text-white text-[11px] font-bold transition"
          >
            <RotateCcw className="w-3 h-3" /> Exit Impersonation
          </button>
        </div>
      )}

      <div className="h-16 px-6 lg:px-8 flex items-center justify-between">
        {/* Left: < Back to Dashboard matching mockup */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#2563eb] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Right: Wallet Balance, Bell Icon with Red Dot, User Profile */}
        <div className="flex items-center gap-4">
          {/* Wallet Balance Pill */}
          <div className="flex items-center gap-2 p-1 pl-3 rounded-full bg-slate-50 border border-slate-200 text-xs shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium hidden sm:inline">Balance:</span>
              <span className="text-emerald-600 font-bold tracking-wide">
                ৳{Number(activeUser?.wallet?.balance || 0).toFixed(2)}
              </span>
            </div>
            <Link
              href="/wallet"
              className="px-2.5 py-0.5 rounded-full bg-[#2563eb] hover:bg-blue-700 text-white keep-white font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
              title="Add balance to wallet"
            >
              <Plus className="w-3 h-3 text-white keep-white" />
              <span className="hidden md:inline text-white keep-white">Top-Up</span>
            </Link>
          </div>

          {/* Notifications Flyout */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-2 text-xs"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 px-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#2563eb]" /> Notifications
                  </div>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    Live
                  </span>
                </div>

                <div className="space-y-1.5">
                  {mockNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl transition border ${
                        n.unread
                          ? 'bg-blue-50/50 border-blue-200 text-slate-900'
                          : 'bg-white border-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with Super Admin & Admin label */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 hover:opacity-90 transition focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-slate-200 flex-shrink-0">
                <img src="/avatar.jpg" alt="Super Admin" className="w-full h-full object-cover" />
              </div>
              <div className="text-left hidden sm:block">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {activeUser?.name || 'Super Admin'}
                </h4>
                <p className="text-[10.5px] text-slate-400 font-medium leading-none mt-0.5">
                  Admin
                </p>
              </div>
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1 text-xs"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="p-2.5 border-b border-slate-200">
                  <div className="font-bold text-slate-900">{activeUser?.name || 'Super Admin'}</div>
                  <div className="text-[11px] text-slate-400">{activeUser?.email || 'admin@voicesaas.com'}</div>
                </div>

                <Link
                  href="/wallet"
                  className="block px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Billing & Wallet
                </Link>
                <Link
                  href="/settings"
                  className="block px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Platform Settings
                </Link>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
