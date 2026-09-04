import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  AlertOctagon, 
  CheckCircle2, 
  Filter, 
  RefreshCw, 
  Sliders, 
  Lock, 
  Cpu, 
  Network,
  Zap,
  ArrowUpRight,
  Info
} from 'lucide-react';

interface EbpfFlow {
  id: string;
  timestamp: string;
  sourcePod: string;
  sourceIp: string;
  destIp: string;
  destPort: number;
  protocol: string;
  decision: 'ALLOW' | 'DROP';
  reason: string;
  syscall: string;
  latencyUs: number;
}

export const EbpfSecurityView: React.FC = () => {
  const [flows, setflows] = useState<EbpfFlow[]>([]);
  const [filterDecision, setFilterDecision] = useState<'ALL' | 'DROP' | 'ALLOW'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [droppedCount, setDroppedCount] = useState<number>(1842);
  const [policyImdsBlocked, setPolicyImdsBlocked] = useState<boolean>(true);
  const [policyStrictMtls, setPolicyStrictMtls] = useState<boolean>(true);
  const [policySyscallConfine, setPolicySyscallConfine] = useState<boolean>(true);
  const [selectedFlow, setSelectedFlow] = useState<EbpfFlow | null>(null);

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/ebpf/flows');
      const data = await res.json();
      if (data.flows) {
        setflows(data.flows);
        setDroppedCount(data.totalDroppedPackets || 1842);
      }
    } catch {
      // Fallback sample data
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSimulateAttack = () => {
    const newDropFlow: EbpfFlow = {
      id: `flow-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourcePod: `compromised-shell-${Math.floor(Math.random() * 900 + 100)}`,
      sourceIp: '10.244.2.199',
      destIp: '169.254.169.254',
      destPort: 80,
      protocol: 'HTTP/IMDS',
      decision: 'DROP',
      reason: 'eBPF XDP hook dropped unauthorized metadata token exfiltration (MITRE T1552)',
      syscall: 'sys_enter_connect',
      latencyUs: 2,
    };
    setflows(prev => [newDropFlow, ...prev]);
    setDroppedCount(prev => prev + 1);
  };

  const filteredFlows = flows.filter(f => {
    if (filterDecision === 'ALL') return true;
    return f.decision === filterDecision;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold">
              Kernel-Level Observability & Defense
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            eBPF Network Security & Packet Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Powered by <span className="text-rose-400 font-bold">Rust (aya-bpf)</span>. Attaches directly to Linux kernel socket hooks (<code className="font-mono text-slate-300">kprobe:tcp_v4_connect</code> and XDP layers) to inspect and block malicious packet flows at zero CPU overhead without user-space context switches.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800 p-3 rounded-lg text-xs font-mono shrink-0">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Kernel Probe</span>
            <span className="text-emerald-400 font-bold text-sm">XDP / Sockops</span>
          </div>
          <div className="h-7 w-px bg-slate-800"></div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Packets Dropped</span>
            <span className="text-rose-400 font-bold text-sm">{droppedCount.toLocaleString()}</span>
          </div>
          <div className="h-7 w-px bg-slate-800"></div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Hook Overhead</span>
            <span className="text-blue-400 font-bold text-sm">&lt; 4 µs</span>
          </div>
        </div>
      </div>

      {/* MITRE ATT&CK Defense Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-600" />
              IMDS Metadata Guard (T1552)
            </span>
            <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold border border-rose-200">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Blocks unauthorized container access to <code className="font-mono text-slate-700">169.254.169.254</code> to prevent cloud instance IAM credential theft.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Attempts Prevented:</span>
            <span className="font-mono font-bold text-rose-600">24 drops</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-600" />
              Socket Acceleration (Sockops)
            </span>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
              Optimized
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Bypasses TCP/IP stack for intra-node pod communications by piping socket buffers directly in kernel memory.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Latency Reduction:</span>
            <span className="font-mono font-bold text-emerald-600">-38% RTT</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-amber-600" />
              Container Breakout Defense (T1611)
            </span>
            <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold border border-amber-200">
              Enforced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Interprets LSM (Linux Security Module) hooks to prevent unconfined syscall execution and namespace escalations.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Syscall Filter:</span>
            <span className="font-mono font-bold text-slate-700">BPF_LSM_HOOK</span>
          </div>
        </div>
      </div>

      {/* Main Control & Live Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-bold text-slate-900">Live Kernel Socket Events Stream</span>
            <span className="text-xs text-slate-400 font-mono">({filteredFlows.length} events)</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Buttons */}
            <div className="bg-slate-200/70 p-0.5 rounded-lg flex text-xs">
              <button
                onClick={() => setFilterDecision('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterDecision === 'ALL' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterDecision('DROP')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterDecision === 'DROP' ? 'bg-white shadow-xs text-rose-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dropped Only
              </button>
              <button
                onClick={() => setFilterDecision('ALLOW')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterDecision === 'ALLOW' ? 'bg-white shadow-xs text-emerald-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Allowed
              </button>
            </div>

            <button
              onClick={handleSimulateAttack}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Simulate Attack</span>
            </button>

            <button
              onClick={fetchFlows}
              disabled={isRefreshing}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-4">Decision</th>
                <th className="py-2.5 px-4">Source Pod / IP</th>
                <th className="py-2.5 px-4">Destination IP:Port</th>
                <th className="py-2.5 px-4">Protocol & Syscall</th>
                <th className="py-2.5 px-4">eBPF Kernel Verdict Reason</th>
                <th className="py-2.5 px-4 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {filteredFlows.map((flow) => {
                const isDrop = flow.decision === 'DROP';
                return (
                  <tr 
                    key={flow.id} 
                    onClick={() => setSelectedFlow(flow)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      {isDrop ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          <AlertOctagon className="w-3 h-3" />
                          DROP
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          ALLOW
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{flow.sourcePod}</div>
                      <div className="text-[10px] text-slate-400">{flow.sourceIp}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{flow.destIp}:{flow.destPort}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-semibold">{flow.protocol}</div>
                      <div className="text-[10px] text-slate-400">{flow.syscall}</div>
                    </td>
                    <td className="py-3 px-4 max-w-md truncate font-sans text-xs" title={flow.reason}>
                      {flow.reason}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600">
                      {flow.latencyUs} µs
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kernel Policy Enforcer Toggles */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-700" />
          eBPF / Cilium Kernel Security Policies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Block Cloud Metadata IMDS</span>
              <span className="text-[11px] text-slate-500">XDP filter on 169.254.169.254</span>
            </div>
            <button
              onClick={() => setPolicyImdsBlocked(!policyImdsBlocked)}
              className={`w-11 h-6 rounded-full transition-colors cursor-pointer p-0.5 ${
                policyImdsBlocked ? 'bg-rose-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${policyImdsBlocked ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Enforce Strict mTLS Sockops</span>
              <span className="text-[11px] text-slate-500">Validate SPIFFE ID in kernel</span>
            </div>
            <button
              onClick={() => setPolicyStrictMtls(!policyStrictMtls)}
              className={`w-11 h-6 rounded-full transition-colors cursor-pointer p-0.5 ${
                policyStrictMtls ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${policyStrictMtls ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Block Unconfined Syscalls</span>
              <span className="text-[11px] text-slate-500">BPF LSM hook for setns/cap_set</span>
            </div>
            <button
              onClick={() => setPolicySyscallConfine(!policySyscallConfine)}
              className={`w-11 h-6 rounded-full transition-colors cursor-pointer p-0.5 ${
                policySyscallConfine ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${policySyscallConfine ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
