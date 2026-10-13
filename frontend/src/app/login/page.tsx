'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Radio,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed. Please verify your credentials.');
        setLoading(false);
        return;
      }

      login(data.accessToken, data.user);
      router.push('/');
    } catch (err) {
      setError('Network error. Unable to reach authentication server.');
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-slate-900 to-indigo-950 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-500/25 mb-2 ring-4 ring-brand-500/10">
            <Radio className="w-7 h-7 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            VoicePro <span className="text-xs uppercase tracking-wider bg-brand-500/20 text-brand-300 font-bold px-2 py-0.5 rounded-full border border-brand-500/30">VSMS</span>
          </h1>
          <p className="text-xs text-gray-400">
            Enterprise Voice Broadcasting & Telephony Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="p-8 rounded-3xl glass-panel border border-gray-800 shadow-2xl bg-gray-950/70 backdrop-blur-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Sign In to Your Account</h2>
            <p className="text-xs text-gray-400">Enter your credentials to manage campaigns and voice broadcasting</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300">Password</label>
                <a href="#" className="text-[11px] text-brand-400 hover:text-brand-300 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-700 bg-gray-900 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
              />
              <label htmlFor="rememberMe" className="text-xs text-gray-400 cursor-pointer">
                Remember me on this browser
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Credentials */}
          <div className="pt-2 border-t border-gray-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-400" /> One-Click Quick Login:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@mail.com', 'admin123')}
                className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-brand-500/50 hover:bg-gray-850 text-left transition group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-brand-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Super Admin
                </div>
                <div className="text-[10px] text-gray-500 truncate">admin@mail.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user@mail.com', 'admin123')}
                className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-brand-500/50 hover:bg-gray-850 text-left transition group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-brand-300">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Customer Account
                </div>
                <div className="text-[10px] text-gray-500 truncate">user@mail.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Register Prompt */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="text-brand-400 hover:text-brand-300 font-bold hover:underline inline-flex items-center gap-1 ml-1"
            >
              Create Account (রেজিস্ট্রেশন করুন) <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>

        {/* Telemetry Footer */}
        <div className="text-center text-[10px] text-gray-500 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Asterisk PJSIP Ready
          </span>
          <span>•</span>
          <span>ARI WebSocket Online</span>
          <span>•</span>
          <span>Port 4000 NestJS</span>
        </div>
      </div>
    </div>
  );
}
