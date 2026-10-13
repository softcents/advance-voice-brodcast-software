'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogIn,
  Edit3,
  FileText,
  CreditCard,
  Phone,
  Mail,
  Building,
  ShieldCheck,
  KeyRound,
  ExternalLink,
  Eye,
  Sliders,
  DollarSign,
  Clock,
  Volume2,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface CallerItem {
  id: string;
  callerName: string;
  callerNumber: string;
}

interface CustomerItem {
  id: string;
  legacyId?: number;
  name: string;
  email: string;
  phone?: string;
  company: string;
  role: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TERMINATED';
  frontNid?: string | null;
  backNid?: string | null;
  audioType?: string;
  autoApproveAudio?: boolean;
  autoApproveCampaigns?: boolean;
  pulseRate?: number;
  pulseDuration?: number;
  callers?: { id: string; name: string; number: string }[];
  pricingPlan?: { id: string; name: string } | null;
  balance: number;
  callsCount: number;
  campaignsCount?: number;
  audioCount?: number;
  groupsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [callersList, setCallersList] = useState<CallerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerItem | null>(null);
  const [depositCustomer, setDepositCustomer] = useState<CustomerItem | null>(null);
  const [documentCustomer, setDocumentCustomer] = useState<CustomerItem | null>(null);
  const [impersonateCustomer, setImpersonateCustomer] = useState<CustomerItem | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit form inputs
  const [editTab, setEditTab] = useState<'basic' | 'calling' | 'approval'>('basic');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPulseRate, setEditPulseRate] = useState('0.50');
  const [editPulseDuration, setEditPulseDuration] = useState('10');
  const [editAudioType, setEditAudioType] = useState('both');
  const [editAutoApproveAudio, setEditAutoApproveAudio] = useState(false);
  const [editAutoApproveCampaigns, setEditAutoApproveCampaigns] = useState(false);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TERMINATED'>('ACTIVE');
  const [editSelectedCallerIds, setEditSelectedCallerIds] = useState<string[]>([]);

  // Deposit form inputs
  const [depositAmount, setDepositAmount] = useState('1000');
  const [depositNotes, setDepositNotes] = useState('Admin direct wallet credit');

  // Add customer inputs
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('SecretPass123!');
  const [addCompany, setAddCompany] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const [custRes, callersRes] = await Promise.all([
        fetch('/api/resellers/customers', { cache: 'no-store' }),
        fetch('/api/telephony/callers', { cache: 'no-store' }),
      ]);

      if (custRes.ok) {
        const data = await custRes.json();
        setCustomers(data);
      }
      if (callersRes.ok) {
        const cData = await callersRes.json();
        setCallersList(cData);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Open Edit Modal
  const handleOpenEdit = (c: CustomerItem) => {
    setEditCustomer(c);
    setEditTab('basic');
    setEditName(c.name);
    setEditEmail(c.email);
    setEditPhone(c.phone || '');
    setEditCompany(c.company || '');
    setEditPassword('');
    setEditPulseRate(String(c.pulseRate ?? '0.50'));
    setEditPulseDuration(String(c.pulseDuration ?? '10'));
    setEditAudioType(c.audioType || 'both');
    setEditAutoApproveAudio(Boolean(c.autoApproveAudio));
    setEditAutoApproveCampaigns(Boolean(c.autoApproveCampaigns));
    setEditStatus(c.status);
    setEditSelectedCallerIds((c.callers || []).map((x) => x.id));
  };

  // Submit Edit
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/resellers/customers/${editCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          companyName: editCompany,
          password: editPassword.trim() || undefined,
          pulseRate: parseFloat(editPulseRate) || 0.5,
          pulseDuration: parseInt(editPulseDuration, 10) || 10,
          audioType: editAudioType,
          autoApproveAudio: editAutoApproveAudio,
          autoApproveCampaigns: editAutoApproveCampaigns,
          status: editStatus,
          callerIds: editSelectedCallerIds,
        }),
      });

      if (res.ok) {
        setAlertMessage({ type: 'success', text: `Customer ${editName} updated successfully!` });
        setEditCustomer(null);
        fetchCustomers();
      } else {
        const err = await res.json();
        setAlertMessage({ type: 'error', text: err.message || 'Failed to update customer' });
      }
    } catch (err) {
      setAlertMessage({ type: 'error', text: 'Network error occurred while saving customer' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Quick Status Change (Approve, Reject, Ban)
  const handleUpdateStatus = async (customerId: string, newStatus: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TERMINATED') => {
    try {
      const res = await fetch(`/api/resellers/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAlertMessage({ type: 'success', text: `Status updated to ${newStatus}` });
        fetchCustomers();
      }
    } catch (err) {
      setAlertMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  // Submit Deposit
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositCustomer) return;

    const amountNum = parseFloat(depositAmount);
    if (!amountNum || amountNum <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/resellers/customers/${depositCustomer.id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          notes: depositNotes,
        }),
      });

      if (res.ok) {
        setAlertMessage({
          type: 'success',
          text: `৳${amountNum.toFixed(2)} successfully credited to ${depositCustomer.name}'s wallet!`,
        });
        setDepositCustomer(null);
        setDepositAmount('1000');
        fetchCustomers();
      } else {
        const err = await res.json();
        setAlertMessage({ type: 'error', text: err.message || 'Deposit failed' });
      }
    } catch (err) {
      setAlertMessage({ type: 'error', text: 'Network error during deposit' });
    } finally {
      setSubmitting(false);
    }
  };

  // Impersonate / Login As
  const handleConfirmImpersonate = async () => {
    if (!impersonateCustomer) return;

    try {
      const res = await fetch(`/api/auth/impersonate/${impersonateCustomer.id}`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('impersonated_token', data.accessToken);
        localStorage.setItem('impersonated_user', JSON.stringify(data.user));
        // Force redirect to root with active impersonated context
        window.location.href = '/';
      } else {
        setAlertMessage({ type: 'error', text: 'Impersonation failed' });
      }
    } catch (err) {
      setAlertMessage({ type: 'error', text: 'Impersonation request failed' });
    } finally {
      setImpersonateCustomer(null);
    }
  };

  // Filter customers
  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search));

    const matchesStatus =
      statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-bold border transition ${
            alertMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <span>{alertMessage.text}</span>
          <button onClick={() => setAlertMessage(null)} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand-400" /> Customers & Client Accounts (গ্রাহক ব্যবস্থাপনা)
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Complete client administration with instant <strong>Login As User</strong> (Impersonate), KYC NID document verification, custom pulse billing, and wallet deposit controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
            title="Refresh customer records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
          >
            <UserPlus className="w-4 h-4" /> Add New Customer
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, company or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED', 'TERMINATED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3.5 font-semibold">Customer / Company</th>
                <th className="p-3.5 font-semibold">Contact & Phone</th>
                <th className="p-3.5 font-semibold">Calling Pulse</th>
                <th className="p-3.5 font-semibold text-right">Wallet Balance</th>
                <th className="p-3.5 font-semibold text-center">KYC Docs</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    {loading ? 'Loading customer accounts...' : 'No customers matching search criteria.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-800/30 transition group">
                    {/* Name & Company */}
                    <td className="p-3.5">
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-indigo-400" />
                        {c.company}
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="p-3.5">
                      <div className="text-gray-300 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-500" />
                        {c.email}
                      </div>
                      <div className="text-gray-500 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-500" />
                        {c.phone || '-'}
                      </div>
                    </td>

                    {/* Pulse & Audio Settings */}
                    <td className="p-3.5">
                      <div className="font-mono text-white text-xs font-semibold">
                        ৳{Number(c.pulseRate ?? 0.5).toFixed(2)} / {c.pulseDuration ?? 10}s
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase mt-0.5">
                        Audio: <span className="text-indigo-400 font-bold">{c.audioType || 'both'}</span>
                      </div>
                    </td>

                    {/* Wallet Balance */}
                    <td className="p-3.5 text-right font-black text-brand-300 text-sm font-mono">
                      ৳ {Number(c.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* KYC Documents */}
                    <td className="p-3.5 text-center">
                      {c.frontNid || c.backNid ? (
                        <button
                          onClick={() => setDocumentCustomer(c)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold flex items-center gap-1 mx-auto hover:bg-indigo-500/20 transition"
                          title="View uploaded NID identification documents"
                        >
                          <FileText className="w-3 h-3" /> NID Attached
                        </button>
                      ) : (
                        <span className="text-gray-600 text-[11px]">No Docs</span>
                      )}
                    </td>

                    {/* Status Badge & Inline Approval */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : c.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {c.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3" />}
                          {c.status === 'PENDING' && <AlertTriangle className="w-3 h-3" />}
                          {c.status !== 'ACTIVE' && c.status !== 'PENDING' && <XCircle className="w-3 h-3" />}
                          {c.status}
                        </span>

                        {/* One-click Approve for Pending */}
                        {c.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'ACTIVE')}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                            title="Approve Customer Account"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions Toolbar */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. LOGIN AS USER (Impersonate) Button */}
                        <button
                          onClick={() => setImpersonateCustomer(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600/10 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white transition font-bold text-[11px] flex items-center gap-1 shadow-sm"
                          title="Login as User / Impersonate"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Login as</span>
                        </button>

                        {/* 2. Add Balance / Deposit Button */}
                        <button
                          onClick={() => setDepositCustomer(c)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition"
                          title="Add Balance / Recharge Wallet"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>

                        {/* 3. Edit Customer Button */}
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
                          title="Edit Customer Settings & Call Config"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. IMPERSONATE CONFIRMATION MODAL ("Login As User")           */}
      {/* ============================================================== */}
      {impersonateCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Login as User (Impersonate)</h3>
                <p className="text-xs text-red-400/90 font-medium">Full Account Impersonation Privilege</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed bg-gray-950 p-3.5 rounded-xl border border-gray-800">
              This action grants full authenticated access to the customer account for{' '}
              <strong className="text-white">{impersonateCustomer.name}</strong> ({impersonateCustomer.email}).
              It is strictly intended for debugging or technical customer support purposes.
            </p>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setImpersonateCustomer(null)}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImpersonate}
                className="px-5 py-2 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30"
              >
                <LogIn className="w-4 h-4" /> Switch to Customer Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. EDIT CUSTOMER MODAL (Calling Pulse, Callers, Documents)     */}
      {/* ============================================================== */}
      {editCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-brand-400" /> Edit Customer: {editCustomer.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Configure calling pulse rates, caller assignments, automated approvals, and security.
                </p>
              </div>
              <button onClick={() => setEditCustomer(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
              <button
                type="button"
                onClick={() => setEditTab('basic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  editTab === 'basic' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                1. Basic Info
              </button>
              <button
                type="button"
                onClick={() => setEditTab('calling')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  editTab === 'calling' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                2. Calling & Pulse
              </button>
              <button
                type="button"
                onClick={() => setEditTab('approval')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  editTab === 'approval' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                3. Approvals & Status
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              {/* Tab 1: Basic Information */}
              {editTab === 'basic' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-semibold block mb-1">Customer Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-semibold block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-semibold block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+8801xxxxxxxxx"
                        className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-semibold block mb-1">Company / Organization</label>
                      <input
                        type="text"
                        value={editCompany}
                        onChange={(e) => setEditCompany(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Reset Password (Leave empty to keep existing password)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Type new password or generate"
                        className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setEditPassword(Math.random().toString(36).slice(-8) + 'A1!')}
                        className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold whitespace-nowrap"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Calling & Pulse Settings */}
              {editTab === 'calling' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-semibold block mb-1">
                        Pulse Rate (BDT per Pulse)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 font-bold">৳</span>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={editPulseRate}
                          onChange={(e) => setEditPulseRate(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">Cost charged per pulse unit (e.g. 0.50 BDT)</p>
                    </div>

                    <div>
                      <label className="text-gray-300 font-semibold block mb-1">
                        Pulse Duration (Seconds)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={editPulseDuration}
                        onChange={(e) => setEditPulseDuration(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                        required
                      />
                      <p className="text-[11px] text-gray-500 mt-1">Duration of 1 pulse (e.g. 10s, 29s, 60s)</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Allowed Audio Type</label>
                    <select
                      value={editAudioType}
                      onChange={(e) => setEditAudioType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                    >
                      <option value="both">Both (File Upload & Text-to-Speech)</option>
                      <option value="upload">Upload Only</option>
                      <option value="tts">TTS Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1.5">
                      Assigned Caller IDs (ক্লার আইডি নির্বাচন)
                    </label>
                    <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-2 max-h-36 overflow-y-auto">
                      {callersList.length === 0 ? (
                        <p className="text-gray-500 text-[11px]">No callers configured in system.</p>
                      ) : (
                        callersList.map((cl) => {
                          const checked = editSelectedCallerIds.includes(cl.id);
                          return (
                            <label
                              key={cl.id}
                              className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditSelectedCallerIds([...editSelectedCallerIds, cl.id]);
                                  } else {
                                    setEditSelectedCallerIds(editSelectedCallerIds.filter((id) => id !== cl.id));
                                  }
                                }}
                                className="rounded text-brand-500 focus:ring-0 bg-gray-900 border-gray-700"
                              />
                              <span className="font-mono font-bold text-white">{cl.callerNumber}</span>
                              <span className="text-gray-500">({cl.callerName})</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Approvals & Status */}
              {editTab === 'approval' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Account Standing & Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none font-bold"
                    >
                      <option value="ACTIVE" className="text-emerald-400">ACTIVE (Approved & Operational)</option>
                      <option value="PENDING" className="text-amber-400">PENDING (Awaiting KYC Approval)</option>
                      <option value="SUSPENDED" className="text-red-400">SUSPENDED (Temporarily Blocked)</option>
                      <option value="TERMINATED" className="text-gray-500">TERMINATED (Banned / Closed)</option>
                    </select>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-950 border border-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editAutoApproveAudio}
                        onChange={(e) => setEditAutoApproveAudio(e.target.checked)}
                        className="rounded text-brand-500 focus:ring-0 w-4 h-4"
                      />
                      <div>
                        <div className="font-bold text-white">Auto Approve Audio Files</div>
                        <div className="text-[11px] text-gray-500">Allow user to broadcast uploaded audio without manual admin moderation.</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-950 border border-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editAutoApproveCampaigns}
                        onChange={(e) => setEditAutoApproveCampaigns(e.target.checked)}
                        className="rounded text-brand-500 focus:ring-0 w-4 h-4"
                      />
                      <div>
                        <div className="font-bold text-white">Auto Approve Voice Campaigns</div>
                        <div className="text-[11px] text-gray-500">Allow instant campaign dispatch without pending queue review.</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditCustomer(null)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : 'Save Customer Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. KYC NID DOCUMENTS VIEWER MODAL                              */}
      {/* ============================================================== */}
      {documentCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-400" /> KYC Identity Verification: {documentCustomer.name}
                </h3>
                <p className="text-xs text-gray-400">National ID card documents submitted for account approval.</p>
              </div>
              <button onClick={() => setDocumentCustomer(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Front NID Card */}
              <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-200">Front NID Card</span>
                  {documentCustomer.frontNid && (
                    <button
                      onClick={() => setPreviewImage(`/api/resellers/customers/${documentCustomer.id}/documents/front`)}
                      className="text-brand-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Eye className="w-3 h-3" /> Zoom
                    </button>
                  )}
                </div>
                {documentCustomer.frontNid ? (
                  <img
                    src={`/api/resellers/customers/${documentCustomer.id}/documents/front`}
                    alt="Front NID Card"
                    className="w-full h-44 object-contain rounded-lg bg-black border border-gray-800 cursor-pointer hover:opacity-90"
                    onClick={() => setPreviewImage(`/api/resellers/customers/${documentCustomer.id}/documents/front`)}
                  />
                ) : (
                  <div className="h-44 flex items-center justify-center rounded-lg bg-gray-900 text-gray-500 text-xs">
                    No Front NID uploaded
                  </div>
                )}
              </div>

              {/* Back NID Card */}
              <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-200">Back NID Card</span>
                  {documentCustomer.backNid && (
                    <button
                      onClick={() => setPreviewImage(`/api/resellers/customers/${documentCustomer.id}/documents/back`)}
                      className="text-brand-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Eye className="w-3 h-3" /> Zoom
                    </button>
                  )}
                </div>
                {documentCustomer.backNid ? (
                  <img
                    src={`/api/resellers/customers/${documentCustomer.id}/documents/back`}
                    alt="Back NID Card"
                    className="w-full h-44 object-contain rounded-lg bg-black border border-gray-800 cursor-pointer hover:opacity-90"
                    onClick={() => setPreviewImage(`/api/resellers/customers/${documentCustomer.id}/documents/back`)}
                  />
                ) : (
                  <div className="h-44 flex items-center justify-center rounded-lg bg-gray-900 text-gray-500 text-xs">
                    No Back NID uploaded
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <span className="text-xs text-gray-400">
                Current Status: <strong className="text-white">{documentCustomer.status}</strong>
              </span>

              <div className="flex gap-2">
                {documentCustomer.status !== 'ACTIVE' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(documentCustomer.id, 'ACTIVE');
                      setDocumentCustomer(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve KYC & Activate
                  </button>
                )}
                {documentCustomer.status !== 'SUSPENDED' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(documentCustomer.id, 'SUSPENDED');
                      setDocumentCustomer(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject KYC
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. FULLSCREEN IMAGE PREVIEW (Zoom)                             */}
      {/* ============================================================== */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Full NID Document"
            className="max-w-4xl max-h-[85vh] object-contain rounded-xl border border-gray-700 shadow-2xl"
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. ADD BALANCE / DEPOSIT MODAL                                 */}
      {/* ============================================================== */}
      {depositCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Add Wallet Balance (টাকা জমা)
            </h3>

            <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 text-xs space-y-1">
              <div className="text-gray-400">
                Customer: <strong className="text-white">{depositCustomer.name}</strong>
              </div>
              <div className="text-gray-400">
                Current Balance:{' '}
                <strong className="text-brand-300 font-mono">
                  ৳ {Number(depositCustomer.balance || 0).toFixed(2)}
                </strong>
              </div>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Recharge Amount (BDT)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 font-bold">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono font-bold focus:border-brand-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Admin Notes / Transaction Reference</label>
                <input
                  type="text"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  placeholder="e.g. Bank wire ref #8492"
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setDepositCustomer(null)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                >
                  {submitting ? 'Crediting...' : 'Confirm Balance Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. ADD CUSTOMER MODAL                                          */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-400" /> Create Client Account
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!addName || !addEmail) return;
                setSubmitting(true);
                try {
                  const res = await fetch('/api/resellers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: addName,
                      email: addEmail,
                      phone: addPhone,
                      password: addPassword,
                      companyName: addCompany,
                      role: 'CUSTOMER',
                    }),
                  });
                  if (res.ok) {
                    setShowAddModal(false);
                    setAddName('');
                    setAddEmail('');
                    setAddPhone('');
                    setAddCompany('');
                    fetchCustomers();
                    setAlertMessage({ type: 'success', text: 'Customer created successfully!' });
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="text-gray-400 font-semibold block mb-1">Customer Full Name</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="+88017xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={addCompany}
                  onChange={(e) => setAddCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Password</label>
                <input
                  type="text"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono focus:border-brand-500 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
