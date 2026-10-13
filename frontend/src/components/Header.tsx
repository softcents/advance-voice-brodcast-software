'use client';

import { useState } from 'react';
import {
  Bell,
  CreditCard,
  ShieldCheck,
  LogOut,
  AlertTriangle,
  RotateCcw,
  User,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { activeUser, isImpersonating, exitImpersonation, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const initials = activeUser?.name
    ? activeUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'VP';

  return (
    <header className="border-b border-gray-800 glass-panel sticky top-0 z-40 flex flex-col">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-8 py-2.5 flex items-center justify-between text-xs text-white font-bold shadow-lg animate-in slide-in-from-top">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-white animate-bounce flex-shrink-0" />
            <span>
              IMPERSONATION ACTIVE: Currently logged in as Customer{' '}
              <span className="underline decoration-white underline-offset-2 font-black">
                {activeUser?.name}
              </span>{' '}
              ({activeUser?.email}) — Wallet:{' '}
              <span className="bg-black/30 px-2 py-0.5 rounded text-amber-200">
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

      <div className="h-16 px-8 flex items-center justify-between">
        {/* Search / Context Status */}
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-gray-300">
            Asterisk Engine (Docker): <span className="text-emerald-400 font-semibold">Online & PJSIP Ready</span>
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-xs text-gray-400">aaPanel Node Gateway</span>
        </div>

        {/* Right Controls: Balance, Notifications, Profile */}
        <div className="flex items-center gap-4">
          {/* Wallet Pill */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold shadow-inner">
            <CreditCard className="w-3.5 h-3.5 text-brand-400" />
            <span>Wallet:</span>
            <span className="text-white font-bold tracking-wide">
              ৳{Number(activeUser?.wallet?.balance || 0).toFixed(2)} BDT
            </span>
          </div>

          {/* Notifications */}
          <button className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition">
            <Bell className="w-4 h-4" />
          </button>

          {/* Profile Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 pl-2 border-l border-gray-800 hover:opacity-90 transition focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-brand-500/30">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-medium text-white flex items-center gap-1">
                  <span>{activeUser?.name || 'Super Admin'}</span>
                  {activeUser?.role === 'SUPER_ADMIN' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <ChevronDown className="w-3 h-3 text-gray-400 ml-0.5" />
                </div>
                <div className="text-[10px] text-gray-400 truncate max-w-[140px]">
                  {activeUser?.email || 'admin@voicepro.com'}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-gray-900/95 border border-gray-800 shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 space-y-1"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="p-2 border-b border-gray-800 text-xs">
                  <div className="font-bold text-white">{activeUser?.name}</div>
                  <div className="text-[11px] text-gray-400 truncate">{activeUser?.email}</div>
                  <div className="mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      {activeUser?.role || 'SUPER_ADMIN'}
                    </span>
                  </div>
                </div>

                {isImpersonating && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      exitImpersonation();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Exit Impersonation
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition"
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
