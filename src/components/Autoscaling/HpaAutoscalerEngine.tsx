import React, { useState } from 'react';
import { 
  Zap, 
  Server, 
  Cpu, 
  Activity, 
  TrendingUp, 
  Layers, 
  Settings2, 
  ShieldCheck, 
  ArrowUpRight, 
  Clock
} from 'lucide-react';
import { ServiceDeployment } from '../../types';

interface HpaAutoscalerEngineProps {
  service: ServiceDeployment;
  onUpdateService: (updated: Partial<ServiceDeployment>) => void;
  onSimulateTrafficBurst: (rps: number) => void;
}

export const HpaAutoscalerEngine: React.FC<HpaAutoscalerEngineProps> = ({
  service,
  onUpdateService,
  onSimulateTrafficBurst,
}) => {
  const [simulatedRps, setSimulatedRps] = useState<number>(service.currentRps);

  const handleRpsChange = (newRps: number) => {
    setSimulatedRps(newRps);
    onSimulateTrafficBurst(newRps);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                Horizontal Pod Autoscaling (HPA v2 & KEDA) Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Reactive and predictive autoscaling based on CPU utilization and custom Ingress Request Per Second (RPS) metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold uppercase">
              HPA Controller: ACTIVE
            </span>
          </div>
        </div>

        {/* HPA Mathematical Formula Box */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Algorithm: </span>
            <code className="text-blue-700 font-mono font-bold ml-1">
              desiredReplicas = ceil[ currentReplicas × ( currentMetric / targetMetric ) ]
            </code>
          </div>
          <div className="text-slate-600 font-mono text-[11px]">
            Target CPU: {service.targetCpuPercent}% · Target RPS: {service.targetRps} req/s
          </div>
        </div>
      </div>

      {/* Interactive Load Surge Simulator & Tuning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Load Surge Simulator Controls */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Traffic Load Surge Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate traffic surges to observe HPA pod replica scaling in real time.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Simulated Request Load:</span>
              <span className="text-blue-600 font-mono font-bold">{simulatedRps.toLocaleString()} RPS</span>
            </div>
            <input
              type="range"
              min="500"
              max="6000"
              step="250"
              value={simulatedRps}
              onChange={(e) => handleRpsChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>500 RPS (Low)</span>
              <span>2,500 RPS (Nominal)</span>
              <span>6,000 RPS (Surge)</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase text-[10px]">Load Profiles:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleRpsChange(900)}
                className="px-2.5 py-1.5 rounded text-xs font-bold uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Normal (900)
              </button>
              <button
                onClick={() => handleRpsChange(2800)}
                className="px-2.5 py-1.5 rounded text-xs font-bold uppercase bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
              >
                Spike (2.8k)
              </button>
              <button
                onClick={() => handleRpsChange(5200)}
                className="px-2.5 py-1.5 rounded text-xs font-bold uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
              >
                Surge (5.2k)
              </button>
            </div>
          </div>

          {/* HPA Policy Configuration */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-blue-600" />
              HPA Spec Configuration
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Min Replicas</span>
                <span className="font-mono text-slate-800 font-bold">{service.minReplicas} pods</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Max Replicas</span>
                <span className="font-mono text-blue-600 font-bold">{service.maxReplicas} pods</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Scale-Up Policy</span>
                <span className="font-mono text-emerald-600 font-bold">100% / 15s</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Scale-Down Window</span>
                <span className="font-mono text-slate-700 font-bold">300s (5m)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Pod Matrix Visualization */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                Active Pod Instances in Deployment ({service.currentReplicas} of {service.maxReplicas} Max Replicas)
              </h3>
              <p className="text-xs text-slate-500">
                Pod lifecycle and resource distribution managed by Kube-Controller-Manager
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                Avg CPU: {service.currentCpuPercent}%
              </span>
            </div>
          </div>

          {/* Pod Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: service.currentReplicas }).map((_, index) => {
              const podName = `${service.name}-${index < 4 ? 'blue' : 'green'}-${Math.abs(Math.sin(index + 1) * 10000).toFixed(0).slice(0, 5)}`;
              const cpuUsage = Math.min(95, Math.max(30, Math.round(service.currentCpuPercent + (Math.sin(index) * 8))));
              const memUsage = Math.min(88, Math.max(40, Math.round(55 + (Math.cos(index) * 12))));

              return (
                <div
                  key={index}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 hover:border-blue-300 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">Pod #{index + 1}</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-800 truncate font-semibold">
                    {podName}
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>CPU</span>
                      <span className="font-mono text-slate-800 font-semibold">{cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cpuUsage > 80 ? 'bg-rose-500' : 'bg-blue-600'}`}
                        style={{ width: `${cpuUsage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Memory</span>
                      <span className="font-mono text-slate-800 font-semibold">{memUsage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${memUsage}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cluster Node Capacity & Karpenter Scaling Notice */}
          <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-slate-800 font-semibold">Karpenter Cluster Autoscaler: </span>
                <span className="text-slate-500">
                  {service.currentReplicas > 12 
                    ? 'Autoscaling triggered node provisioning: +2 m6i.xlarge nodes added to node pool.' 
                    : 'Current worker node capacity sufficient for running pods.'}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
              Provisioning Delay: 28s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
