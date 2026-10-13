'use client';

import {
  Server,
  Radio,
  CheckCircle2,
  HardDrive,
  Cpu,
  Layers,
  Activity,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function SettingsHealthPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Server className="w-6 h-6 text-brand-400" /> Asterisk Engine & Infrastructure Telemetry
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Dockerized Asterisk PBX, SIP Trunks, aaPanel native services (Redis, RabbitMQ, PostgreSQL), and Node.js gateway.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl glass-panel border border-gray-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-semibold uppercase">Asterisk PBX</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Docker Running
            </span>
          </div>
          <div className="text-xl font-black text-white">Asterisk 20 LTS</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Port: <strong className="text-brand-300">5060 (SIP), 8088 (ARI)</strong></div>
            <div>RTP: <strong className="text-gray-300">10000 - 10200 UDP</strong></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-gray-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-semibold uppercase">PostgreSQL</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              aaPanel Native
            </span>
          </div>
          <div className="text-xl font-black text-white">PostgreSQL 16</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Port: <strong className="text-brand-300">5432</strong></div>
            <div>Transactions: <strong className="text-emerald-400">ACID Serializable</strong></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-gray-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-semibold uppercase">Message Broker</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              aaPanel Native
            </span>
          </div>
          <div className="text-xl font-black text-white">RabbitMQ 3.12</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Port: <strong className="text-brand-300">5672 (AMQP)</strong></div>
            <div>Queues: <strong className="text-gray-300">call.dispatch, reports</strong></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-gray-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-semibold uppercase">Distributed State</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              aaPanel Native
            </span>
          </div>
          <div className="text-xl font-black text-white">Redis 7.0</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Port: <strong className="text-brand-300">6379</strong></div>
            <div>Latency: <strong className="text-emerald-400">&lt; 1 ms</strong></div>
          </div>
        </div>
      </div>

      {/* SIP Trunks Configuration Table */}
      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-400" /> Active SIP Trunks & Concurrency Limits
          </h3>
          <span className="text-xs text-emerald-400 font-medium">All Trunks Registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3.5 font-semibold">Trunk Identifier</th>
                <th className="p-3.5 font-semibold">Caller ID Name</th>
                <th className="p-3.5 font-semibold">Caller ID Number</th>
                <th className="p-3.5 font-semibold">Max Concurrency</th>
                <th className="p-3.5 font-semibold">Active Channels</th>
                <th className="p-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {[
                { name: 'GP-VOIP-TRUNK-01', cid: 'PromoAlert', num: '+8809612001122', max: 60, active: 32 },
                { name: 'ROBI-VOIP-TRUNK-02', cid: 'OTPVerification', num: '+8809612003344', max: 40, active: 18 },
                { name: 'BL-VOIP-TRUNK-03', cid: 'ApexAlert', num: '+8809612005566', max: 30, active: 10 },
              ].map((trunk, i) => (
                <tr key={i} className="hover:bg-gray-800/30 transition">
                  <td className="p-3.5 font-mono text-white font-bold">{trunk.name}</td>
                  <td className="p-3.5 text-gray-300">{trunk.cid}</td>
                  <td className="p-3.5 font-mono text-brand-300 font-semibold">{trunk.num}</td>
                  <td className="p-3.5 text-gray-200">{trunk.max} concurrent calls</td>
                  <td className="p-3.5">
                    <span className="text-emerald-400 font-bold">{trunk.active}</span> / {trunk.max}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Operational
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
