'use client';

import { useState } from 'react';
import {
  Users2,
  UserPlus,
  ShieldCheck,
  Building,
  CreditCard,
  CheckCircle2,
  XCircle,
  ChevronRight,
  GitFork,
  ArrowRight,
} from 'lucide-react';

interface ResellerNode {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  depth: number;
  balance: number;
  creditLimit: number;
  planName: string;
  children?: ResellerNode[];
}

const mockResellerTree: ResellerNode[] = [
  {
    id: '1',
    name: 'Global Super Admin',
    companyName: 'VoiceBroadcast Enterprise Inc.',
    email: 'admin@voicepro.com',
    phone: '+8801700000001',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    depth: 0,
    balance: 500000.0,
    creditLimit: 1000000.0,
    planName: 'System Wholesale Root',
    children: [
      {
        id: '2',
        name: 'Telecom Service Provider (SP)',
        companyName: 'Dhaka VoIP Telco Ltd.',
        email: 'sp@telecombd.com',
        phone: '+8801700000002',
        role: 'SERVICE_PROVIDER',
        status: 'ACTIVE',
        depth: 1,
        balance: 150000.0,
        creditLimit: 250000.0,
        planName: 'Telco Standard Wholesale 10s',
        children: [
          {
            id: '3',
            name: 'Prime Master Reseller',
            companyName: 'Prime Voice Solutions',
            email: 'master@reseller.com',
            phone: '+8801700000003',
            role: 'MASTER_RESELLER',
            status: 'ACTIVE',
            depth: 2,
            balance: 35000.0,
            creditLimit: 50000.0,
            planName: 'Reseller Commercial Retail 10s',
            children: [
              {
                id: '4',
                name: 'FastDial Sub-Reseller',
                companyName: 'FastDial Agency',
                email: 'sub@reseller.com',
                phone: '+8801700000004',
                role: 'SUB_RESELLER',
                status: 'ACTIVE',
                depth: 3,
                balance: 8500.0,
                creditLimit: 10000.0,
                planName: 'Reseller Commercial Retail 10s',
                children: [
                  {
                    id: '5',
                    name: 'Apex Retailer Customer',
                    companyName: 'Apex Electronics BD',
                    email: 'client@demo.com',
                    phone: '+8801700000005',
                    role: 'CUSTOMER',
                    status: 'ACTIVE',
                    depth: 4,
                    balance: 2450.0,
                    creditLimit: 0.0,
                    planName: 'Reseller Commercial Retail 10s',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export default function ResellerManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [activeTier, setActiveTier] = useState<string>('ALL');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200/80 flex-shrink-0">
            <img src="/icons/resellers.svg" alt="Resellers" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              Multi-Tier Reseller Hierarchy
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Super Admin ➔ Service Provider (SP) ➔ Master Reseller ➔ Sub-Reseller ➔ End Customer
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white keep-white font-semibold text-sm shadow-md shadow-brand-500/20 transition"
        >
          <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0">
            <img src="/icons/customers.svg" alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-white keep-white">Add New Reseller / Customer</span>
        </button>
      </div>

      {/* Tier Filter Pills */}
      <div className="flex items-center gap-2 text-xs font-medium border-b border-gray-800 pb-3">
        {['ALL', 'SERVICE_PROVIDER', 'MASTER_RESELLER', 'SUB_RESELLER', 'CUSTOMER'].map((tier) => (
          <button
            key={tier}
            onClick={() => setActiveTier(tier)}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTier === tier
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 font-bold'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            {tier.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Visual Hierarchy Tree Flow */}
      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <GitFork className="w-4 h-4 text-brand-400" /> Lineage Tree Architecture
          </div>
          <span className="text-xs text-gray-400">Strict Server-Side Isolation Enforced</span>
        </div>

        {/* Render Tree recursively or structured */}
        <div className="space-y-4">
          <TreeNode node={mockResellerTree[0]} />
        </div>
      </div>

      {/* Add Reseller Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-gray-800 p-6 space-y-5 bg-gray-950">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-400" /> Create Reseller / Customer
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Email</label>
                  <input
                    type="email"
                    placeholder="reseller@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Phone (E.164)</label>
                  <input
                    type="text"
                    placeholder="+8801712345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Hierarchy Role</label>
                  <select className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500">
                    <option value="SERVICE_PROVIDER">Service Provider (SP)</option>
                    <option value="MASTER_RESELLER">Master Reseller</option>
                    <option value="SUB_RESELLER">Sub-Reseller</option>
                    <option value="CUSTOMER">Customer</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Pricing Plan</label>
                  <select className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500">
                    <option>Telco Standard Wholesale 10s</option>
                    <option>Reseller Commercial Retail 10s</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Credit Limit (BDT)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TreeNode({ node }: { node: ResellerNode }) {
  const [expanded, setExpanded] = useState(true);

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
    SERVICE_PROVIDER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    MASTER_RESELLER: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    SUB_RESELLER: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    CUSTOMER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="relative pl-6 border-l border-gray-800/80 space-y-3">
      {/* Node Card */}
      <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{node.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleColors[node.role] || ''}`}>
                {node.role.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Depth: {node.depth}</span>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <Building className="w-3 h-3 text-gray-500" /> {node.companyName}
              </span>
              <span>•</span>
              <span>{node.email}</span>
            </div>
          </div>
        </div>

        {/* Right Financials & Status */}
        <div className="flex items-center gap-6 text-xs">
          <div>
            <div className="text-gray-500 text-[10px]">Assigned Plan</div>
            <div className="text-gray-300 font-medium">{node.planName}</div>
          </div>
          <div>
            <div className="text-gray-500 text-[10px]">Wallet Balance</div>
            <div className="text-brand-400 font-bold">৳ {node.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        </div>
      </div>

      {/* Children */}
      {expanded && node.children && node.children.length > 0 && (
        <div className="space-y-3 pt-1">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
