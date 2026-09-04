import React from 'react';
import { ServiceDeployment } from '../types';

interface ExecutiveKpiSummaryProps {
  service: ServiceDeployment;
}

export const ExecutiveKpiSummary: React.FC<ExecutiveKpiSummaryProps> = ({ service }) => {
  // Latency percentage against SLO threshold
  const latencyPercent = Math.min(100, Math.round((service.latencyP99 / 500) * 100));
  // Error rate percentage against 5%
  const errorPercent = Math.min(100, Math.round((service.errorRate / 3) * 100));
  // HPA efficiency percentage
  const hpaEfficiency = Math.min(99, Math.round(75 + (service.currentCpuPercent / 100) * 20));
  // Pod capacity
  const maxPodCapacity = 150;
  const totalPods = 120 + service.currentReplicas;
  const podPercent = Math.min(100, Math.round((totalPods / maxPodCapacity) * 100));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Avg Latency Card */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
        <div className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-tight">
          Avg Latency (P99)
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {service.latencyP99}
          <span className="text-sm font-normal text-slate-400 ml-0.5">ms</span>
        </div>
        <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${service.latencyP99 > 450 ? 'bg-rose-500' : 'bg-blue-500'}`}
            style={{ width: `${latencyPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Error Rate Card */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
        <div className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-tight">
          5xx Error Rate
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {service.errorRate.toFixed(2)}
          <span className="text-sm font-normal text-slate-400 ml-0.5">%</span>
        </div>
        <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${service.errorRate > 2.0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.max(8, errorPercent)}%` }}
          ></div>
        </div>
      </div>

      {/* HPA Efficiency Card */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
        <div className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-tight">
          HPA Efficiency
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {hpaEfficiency}
          <span className="text-sm font-normal text-slate-400 ml-0.5">%</span>
        </div>
        <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${hpaEfficiency}%` }}
          ></div>
        </div>
      </div>

      {/* Active Pods Card */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
        <div className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-tight">
          Active Pods
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {totalPods}
          <span className="text-sm font-normal text-slate-400 ml-0.5">/{maxPodCapacity}</span>
        </div>
        <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-orange-400 transition-all duration-500"
            style={{ width: `${podPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
