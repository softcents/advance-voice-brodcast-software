'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  Plus,
  ShieldCheck,
  User,
  LogOut,
  RotateCcw,
  AlertTriangle,
  Activity,
  Clock,
  Code2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { activeUser, isImpersonating, exitImpersonation, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' BST'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const mockNotifications = [
    {
      id: '1',
      title: 'Carrier Trunk bdpbx-999 Connected',
      desc: 'FreeSWITCH 1.11.3 ESL socket connected with 1000 max sessions.',
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
    <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40 flex flex-col shadow-xs font-sans">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-6 py-2.5 flex items-center justify-between text-xs text-white font-bold shadow-lg animate-in slide-in-from-top">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-white animate-bounce flex-shrink-0" />
            <span>
              IMPERSONATION ACTIVE: Logged in as Customer{' '}
              <span className="underline decoration-white underline-offset-2 font-black">
                {activeUser?.name}
              </span>{' '}
              ({activeUser?.email}) — Wallet:{' '}
              <span className="bg-black/30 px-2 py-0.5 rounded text-amber-200 font-mono">
                ৳{Number(activeUser?.wallet?.balance || 0).toFixed(2)} BDT
              </span>
            </span>
          </div>
          <button
            onClick={exitImpersonation}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/50 hover:bg-black/75 text-white text-[11px] font-black border border-white/20 transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Return to Super Admin
          </button>
        </div>
      )}

      <div className="h-16 px-6 lg:px-8 flex items-center justify-between">
        {/* Left Status: Carrier PBX Engine & Telemetry */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-600">Carrier Trunk:</span>
            <span className="font-bold text-emerald-600">bdpbx-999 • Online</span>
          </div>

          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500">FreeSWITCH Engine:</span>
            <span className="text-slate-800 font-semibold">50 CPS Ready</span>
          </div>

          {currentTime && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-600" />
              <span>{currentTime}</span>
            </div>
          )}
        </div>

        {/* Right Controls: Balance, API Keys, Notifications, Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Wallet Balance Pill */}
          <div className="flex items-center gap-2 p-1 pl-3 rounded-full bg-slate-50 border border-slate-200 text-xs shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium hidden sm:inline">Balance:</span>
              <span className="text-emerald-600 font-bold font-mono tracking-wide">
                ৳{Number(activeUser?.wallet?.balance || 0).toFixed(2)}
              </span>
            </div>
            <Link
              href="/wallet"
              className="px-2.5 py-0.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
              title="Add balance to wallet"
            >
              <Plus className="w-3 h-3 text-white" />
              <span className="hidden md:inline text-white">Top-Up</span>
            </Link>
          </div>

          {/* Quick API Keys Button */}
          <Link
            href="/developers/tokens"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition shadow-xs"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>API Keys</span>
          </Link>

          {/* Notifications Flyout */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition relative shadow-xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-2 text-xs"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-indigo-600" /> System Notifications
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    Live
                  </span>
                </div>

                <div className="space-y-1.5">
                  {mockNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl transition border ${
                        n.unread
                          ? 'bg-indigo-50/50 border-indigo-200 text-slate-900'
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

          {/* User Profile Avatar with Admin Label & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 hover:opacity-90 transition focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-slate-200 flex-shrink-0">
                <img src="/avatar.jpg" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="text-left hidden sm:block">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {activeUser?.name || 'Admin'}
                </h4>
                <p className="text-[10.5px] text-slate-400 font-medium leading-none mt-0.5">
                  {activeUser?.email || 'admin@mail.com'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1 text-xs"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="p-2.5 border-b border-slate-100">
                  <div className="font-bold text-slate-900">{activeUser?.name || 'Administrator'}</div>
                  <div className="text-[11px] text-slate-400">{activeUser?.email || 'admin@voicepro.com'}</div>
                  <div className="mt-1">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {activeUser?.role || 'Carrier Admin'}
                    </span>
                  </div>
                </div>

                <Link
                  href="/wallet"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Corporate Wallet
                </Link>
                <Link
                  href="/settings/servers"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  FreeSWITCH Trunks & Gateways
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Platform Settings
                </Link>
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
