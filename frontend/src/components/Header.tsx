'use client';

import { useState, useEffect } from 'react';
import { Bell, CreditCard, ShieldCheck, LogOut, AlertTriangle, UserCheck } from 'lucide-react';

export default function Header() {
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('impersonated_user');
      if (stored) {
        setImpersonatedUser(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleExitImpersonation = () => {
    localStorage.removeItem('impersonated_token');
    localStorage.removeItem('impersonated_user');
    window.location.reload();
  };

  return (
    <header className="border-b border-gray-800 glass-panel sticky top-0 z-40 flex flex-col">
      {/* Impersonation Banner */}
      {impersonatedUser && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-2 flex items-center justify-between text-xs text-white font-bold shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white animate-bounce" />
            <span>
              IMPERSONATION ACTIVE: You are viewing the system as Customer{' '}
              <span className="underline decoration-white underline-offset-2">{impersonatedUser.name}</span> ({impersonatedUser.email})
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-white text-[11px] font-black border border-white/20 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Return to Super Admin
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
              {impersonatedUser
                ? `${Number(impersonatedUser.wallet?.balance || 0).toFixed(2)} BDT`
                : '500,000.00 BDT'}
            </span>
          </div>

          {/* Notifications */}
          <button className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition">
            <Bell className="w-4 h-4" />
          </button>

          {/* Profile Avatar */}
          <div className="flex items-center gap-3 pl-2 border-l border-gray-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-brand-500/30">
              {impersonatedUser ? impersonatedUser.name.slice(0, 2).toUpperCase() : 'SA'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-medium text-white flex items-center gap-1">
                {impersonatedUser ? impersonatedUser.name : 'Super Admin'}{' '}
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <div className="text-[10px] text-gray-400">
                {impersonatedUser ? impersonatedUser.email : 'admin@voicepro.com'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
