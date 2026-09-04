import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingDown, 
  CheckCircle2, 
  Cpu, 
  HardDrive, 
  Layers, 
  Sparkles, 
  ArrowDownRight, 
  Cloud, 
  Sliders, 
  Zap,
  Info,
  RefreshCw,
  PieChart
} from 'lucide-react';

interface CloudProviderSpend {
  provider: string;
  monthlySpend: number;
  sharePct: number;
  icon: string;
}

interface NamespaceCost {
  namespace: string;
  monthlyCost: number;
  cpuCost: number;
  ramCost: number;
  egressCost: number;
  efficiencyPct: number;
}

interface RightsizingItem {
  id: string;
  workloadName: string;
  namespace: string;
  currentCpu: string;
  recommendedCpu: string;
  currentRam: string;
  recommendedRam: string;
  monthlySavingUsd: number;
  action: string;
  risk: string;
}

export const FinOpsCostView: React.FC = () => {
  const [providers, setProviders] = useState<CloudProviderSpend[]>([
    { provider: 'AWS (EKS)', monthlySpend: 1890.0, sharePct: 55.3, icon: 'aws' },
    { provider: 'GCP (GKE)', monthlySpend: 1240.5, sharePct: 36.3, icon: 'gcp' },
    { provider: 'Azure (AKS)', monthlySpend: 290.0, sharePct: 8.4, icon: 'azure' },
  ]);
  const [namespaces, setNamespaces] = useState<NamespaceCost[]>([
    { namespace: 'production', monthlyCost: 2120.0, cpuCost: 1450.0, ramCost: 520.0, egressCost: 150.0, efficiencyPct: 84.5 },
    { namespace: 'staging', monthlyCost: 680.0, cpuCost: 410.0, ramCost: 210.0, egressCost: 60.0, efficiencyPct: 58.2 },
    { namespace: 'kube-system', monthlyCost: 380.0, cpuCost: 240.0, ramCost: 120.0, egressCost: 20.0, efficiencyPct: 91.0 },
    { namespace: 'monitoring', monthlyCost: 240.5, cpuCost: 150.0, ramCost: 75.5, egressCost: 15.0, efficiencyPct: 76.0 },
  ]);
  const [recommendations, setRecommendations] = useState<RightsizingItem[]>([
    {
      id: 'rec-1',
      workloadName: 'payment-gateway-worker',
      namespace: 'production',
      currentCpu: '2000m',
      recommendedCpu: '650m',
      currentRam: '4096Mi',
      recommendedRam: '1536Mi',
      monthlySavingUsd: 142.5,
      action: 'SCALE_DOWN_REQUEST',
      risk: 'LOW',
    },
    {
      id: 'rec-2',
      workloadName: 'logging-fluentd-collector',
      namespace: 'kube-system',
      currentCpu: '1000m',
      recommendedCpu: '250m',
      currentRam: '2048Mi',
      recommendedRam: '512Mi',
      monthlySavingUsd: 88.0,
      action: 'CONSOLIDATE_DAEMONSET',
      risk: 'LOW',
    },
    {
      id: 'rec-3',
      workloadName: 'analytics-reporting-cron',
      namespace: 'staging',
      currentCpu: '1500m',
      recommendedCpu: '400m',
      currentRam: '3072Mi',
      recommendedRam: '1024Mi',
      monthlySavingUsd: 115.2,
      action: 'HPA_TUNE',
      risk: 'VERY_LOW',
    },
  ]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState<string | null>(null);

  const handleApplyRightsizing = (id: string) => {
    setIsApplying(id);
    setTimeout(() => {
      setAppliedIds(prev => [...prev, id]);
      setIsApplying(null);
    }, 600);
  };

  const totalSavedSoFar = recommendations
    .filter(r => appliedIds.includes(r.id))
    .reduce((acc, r) => acc + r.monthlySavingUsd, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
              Kubernetes Unit Economics & FinOps
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-5 h-5 text-amber-400" />
            FinOps & Cloud Cost Allocation Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Built in <span className="text-blue-400 font-bold">Go (Golang)</span> with Prometheus OpenCost integration. Pinpoints over-provisioned pods, calculates real-time billing across AWS, GCP, and Azure, and automatically recovers idle container waste.
          </p>
        </div>

        {/* Global FinOps Metrics */}
        <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800 p-3 rounded-lg text-xs font-mono shrink-0">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Monthly Spend</span>
            <span className="text-white font-bold text-sm">$3,420.50</span>
          </div>
          <div className="h-7 w-px bg-slate-800"></div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Idle Waste</span>
            <span className="text-rose-400 font-bold text-sm">
              ${(845.20 - totalSavedSoFar).toFixed(2)}
            </span>
          </div>
          <div className="h-7 w-px bg-slate-800"></div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Savings Recovered</span>
            <span className="text-emerald-400 font-bold text-sm">+${totalSavedSoFar.toFixed(2)}/mo</span>
          </div>
        </div>
      </div>

      {/* Cloud Provider & Namespace Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Cloud Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-600" />
              Multi-Cloud Spend Split
            </h3>
            <span className="text-[11px] font-mono text-slate-400">AWS / GCP / Azure</span>
          </div>

          <div className="space-y-3.5">
            {providers.map(p => (
              <div key={p.provider} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{p.provider}</span>
                  <span className="font-mono text-slate-900">${p.monthlySpend.toFixed(2)} ({p.sharePct}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      p.icon === 'aws' ? 'bg-amber-500' : p.icon === 'gcp' ? 'bg-blue-500' : 'bg-sky-400'
                    }`}
                    style={{ width: `${p.sharePct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Daily Cluster Run Rate:</span>
            <span className="font-mono font-bold text-slate-800">$114.01 / day</span>
          </div>
        </div>

        {/* Namespace Unit Economics */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              Namespace Cost Allocation & Resource Efficiency
            </h3>
            <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
              OpenCost Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Namespace</th>
                  <th className="py-2 px-3">Monthly Cost</th>
                  <th className="py-2 px-3">CPU Spend</th>
                  <th className="py-2 px-3">RAM Spend</th>
                  <th className="py-2 px-3">Egress</th>
                  <th className="py-2 px-3 text-right">Efficiency %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {namespaces.map(ns => (
                  <tr key={ns.namespace} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">{ns.namespace}</td>
                    <td className="py-2.5 px-3 font-bold text-blue-600">${ns.monthlyCost.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-600">${ns.cpuCost.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-600">${ns.ramCost.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-500">${ns.egressCost.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        ns.efficiencyPct > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ns.efficiencyPct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 1-Click Automated Rightsizing Recommendations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Automated Pod Rightsizing Recommendations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Based on actual P95 resource consumption over the past 14 days vs current container requests
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md">
            Potential Monthly Recovery: $345.70 / mo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map(rec => {
            const isApplied = appliedIds.includes(rec.id);
            const isLoading = isApplying === rec.id;
            return (
              <div 
                key={rec.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isApplied 
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-xs' 
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-700">
                      {rec.namespace}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      Save ${rec.monthlySavingUsd.toFixed(2)}/mo
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-2">
                    {rec.workloadName}
                  </h4>

                  <div className="space-y-1.5 text-[11px] font-mono text-slate-600 border-t border-b border-slate-200/60 py-2.5 my-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">CPU:</span>
                      <span>
                        <span className="line-through text-rose-500">{rec.currentCpu}</span>
                        {' → '}
                        <span className="font-bold text-emerald-600">{rec.recommendedCpu}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Memory:</span>
                      <span>
                        <span className="line-through text-rose-500">{rec.currentRam}</span>
                        {' → '}
                        <span className="font-bold text-emerald-600">{rec.recommendedRam}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  {isApplied ? (
                    <div className="w-full bg-emerald-100 text-emerald-800 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Limits Updated in Cluster
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApplyRightsizing(rec.id)}
                      disabled={isLoading}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Applying to Pod...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Apply Rightsizing</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
