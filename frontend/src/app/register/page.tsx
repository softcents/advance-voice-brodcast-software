'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Radio,
  User,
  Mail,
  Phone,
  Building,
  Lock,
  Eye,
  EyeOff,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+8801');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);

  // NID Upload previews (base64 simulated or file URLs)
  const [frontNid, setFrontNid] = useState<string | null>(null);
  const [backNid, setBackNid] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === 'front') {
          setFrontNid(reader.result as string);
        } else {
          setBackNid(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    if (!terms) {
      setError('You must accept the Terms and Conditions to proceed.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          companyName: companyName.trim() || undefined,
          password,
          frontNid: frontNid || 'nid_front_placeholder.jpg',
          backNid: backNid || 'nid_back_placeholder.jpg',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed. Please check your inputs.');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Network error. Unable to contact registration server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-gray-950 via-slate-900 to-indigo-950 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 space-y-6 my-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-500/25 mb-1 ring-4 ring-brand-500/10">
            <Radio className="w-7 h-7 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            VoicePro <span className="text-xs uppercase tracking-wider bg-brand-500/20 text-brand-300 font-bold px-2 py-0.5 rounded-full border border-brand-500/30">VSMS</span>
          </h1>
          <p className="text-xs text-gray-400">
            Client Self-Registration & KYC Verification Form
          </p>
        </div>

        {/* Success View */}
        {success ? (
          <div className="p-8 rounded-3xl glass-panel border border-emerald-500/30 shadow-2xl bg-gray-950/80 backdrop-blur-xl text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Registration Submitted Successfully!</h2>
              <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{name}</strong>! Your account has been created with status{' '}
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  PENDING KYC
                </span>
                . Our compliance team will review your National ID and approve your account shortly.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-800">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
              >
                Go to Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="p-8 rounded-3xl glass-panel border border-gray-800 shadow-2xl bg-gray-950/75 backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-white">Create New Customer Account</h2>
                <p className="text-xs text-gray-400">Filament v5 Form: User, Company & National ID Verification</p>
              </div>
              <Link
                href="/login"
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: User Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> 1. User Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-300">Phone Number (Bangladesh) *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+8801XXXXXXXXX"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Password *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create strong password"
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Company Information */}
              <div className="space-y-4 pt-4 border-t border-gray-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Building className="w-4 h-4" /> 2. Company Information
                </h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Company / Organization Name</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g., Telecom Broadcast Corp"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: National ID Upload */}
              <div className="space-y-4 pt-4 border-t border-gray-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> 3. National ID Upload (KYC Requirement)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front NID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Front Side of NID *</label>
                    <div className="border border-dashed border-gray-700 hover:border-brand-500 rounded-2xl p-4 text-center bg-gray-900/50 cursor-pointer relative transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'front')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {frontNid ? (
                        <div className="space-y-2">
                          <img
                            src={frontNid}
                            alt="Front NID Preview"
                            className="h-24 mx-auto rounded-lg object-cover border border-emerald-500/40"
                          />
                          <p className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Front image uploaded
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-3">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                          <div className="text-xs text-gray-300 font-medium">Upload Front Side</div>
                          <div className="text-[10px] text-gray-500">PNG, JPG up to 2MB</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Back NID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Back Side of NID *</label>
                    <div className="border border-dashed border-gray-700 hover:border-brand-500 rounded-2xl p-4 text-center bg-gray-900/50 cursor-pointer relative transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'back')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {backNid ? (
                        <div className="space-y-2">
                          <img
                            src={backNid}
                            alt="Back NID Preview"
                            className="h-24 mx-auto rounded-lg object-cover border border-emerald-500/40"
                          />
                          <p className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Back image uploaded
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-3">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                          <div className="text-xs text-gray-300 font-medium">Upload Back Side</div>
                          <div className="text-[10px] text-gray-500">PNG, JPG up to 2MB</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Terms */}
              <div className="pt-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="termsCheckbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="rounded border-gray-700 bg-gray-900 text-brand-600 focus:ring-brand-500 h-4 w-4 mt-0.5"
                  />
                  <label htmlFor="termsCheckbox" className="text-xs text-gray-400 cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="text-brand-400 hover:underline">
                      Terms of Service
                    </a>{' '}
                    and confirm that all provided KYC details and National ID documents are authentic.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Register Account (রেজিস্ট্রেশন করুন)</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-gray-800">
              <p className="text-xs text-gray-400">
                Already registered?{' '}
                <Link href="/login" className="text-brand-400 hover:underline font-bold">
                  Sign in to your account
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
