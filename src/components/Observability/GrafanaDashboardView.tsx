import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Server, 
  TrendingUp, 
  CheckCircle2, 
  BarChart2,
  Sliders
} from 'lucide-react';
import { ServiceDeployment, MetricDataPoint } from '../../types';

interface GrafanaDashboardViewProps {
  service: ServiceDeployment;
  services: ServiceDeployment[];
  metricsHistory: MetricDataPoint[];
  onSelectService: (s: ServiceDeployment) => void;
  onSpikeLoad: () => void;
}

export const GrafanaDashboardView: React.FC<GrafanaDashboardViewProps> = ({
  service,
  services,
  metricsHistory,
  onSelectService,
  onSpikeLoad,
}) => {
  const [timeRange, setTimeRange] = useState<'5m' | '15m' | '1h'>('5m');

  return (
    <div className="space-y-6">
      {/* Grafana Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              Grafana Cluster & Service Observability Dashboard
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                Live Prometheus Datasource
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Visualizing Golden Signals: Latency, Traffic (RPS), Errors, & Saturation (HPA Replicas)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Service Filter dropdown */}
          <div className="flex items-center bg-slate-100 rounded-md px-2.5 py-1 text-xs border border-slate-200">
            <span className="text-slate-400 mr-1.5 font-medium">Service:</span>
            <select
              value={service.id}
              onChange={(e) => {
                const s = services.find((item) => item.id === e.target.value);
                if (s) onSelectService(s);
              }}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id} className="bg-white text-slate-800">
                  {s.name} ({s.namespace})
                </option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200 text-xs">
            {(['5m', '15m', '1h'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  timeRange === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={onSpikeLoad}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] px-3 py-1.5 rounded-md font-bold uppercase transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Spike Load</span>
          </button>
        </div>
      </div>

      {/* 4 Golden Signals KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Signal 1: Latency (P99) */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-tight">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              P99 Latency (Canary SLO)
            </span>
            <span className="font-mono text-[10px] text-slate-400">Target: 450ms</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${
              service.latencyP99 > service.rollbackThresholdLatencyP99 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {service.latencyP99}
            </span>
            <span className="text-xs text-slate-400">ms</span>
            <span className="ml-auto text-[11px] font-mono text-emerald-600 font-medium">
              P50: {service.latencyP50}ms · P95: {service.latencyP95}ms
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                service.latencyP99 > service.rollbackThresholdLatencyP99 ? 'bg-rose-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, (service.latencyP99 / 600) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Signal 2: Error Rate */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-tight">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              5xx Error Rate
            </span>
            <span className="font-mono text-[10px] text-slate-400">Max: {service.rollbackThresholdErrorRate}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${
              service.errorRate > service.rollbackThresholdErrorRate ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {service.errorRate.toFixed(2)}%
            </span>
            <span className={`text-[10px] ml-auto font-bold px-2 py-0.5 rounded-full ${
              service.errorRate > service.rollbackThresholdErrorRate 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {service.errorRate > service.rollbackThresholdErrorRate ? 'FAILING SLO' : 'HEALTHY'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                service.errorRate > service.rollbackThresholdErrorRate ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (service.errorRate / 5) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Signal 3: Throughput (RPS) */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-tight">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Ingress Traffic
            </span>
            <span className="font-mono text-[10px] text-slate-400">Target: {service.targetRps} RPS</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {service.currentRps.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">req/sec</span>
            <span className="ml-auto text-[11px] font-mono text-slate-500">
              {(service.currentRps / service.currentReplicas).toFixed(0)} rps/pod
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (service.currentRps / 5000) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Signal 4: Saturation & HPA Replicas */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-tight">
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              Active Pods (HPA)
            </span>
            <span className="font-mono text-[10px] text-slate-400">Min: {service.minReplicas} / Max: {service.maxReplicas}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {service.currentReplicas}
            </span>
            <span className="text-xs text-slate-400">replicas</span>
            <span className="ml-auto text-[11px] font-mono text-slate-600 font-medium">
              CPU: {service.currentCpuPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${(service.currentReplicas / service.maxReplicas) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Real-time Time Series Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Latency Distribution (P50, P95, P99) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Service Response Latency (P50, P95, P99)
              </h3>
              <p className="text-xs text-slate-500">
                Histogram quantiles tracked in Prometheus with 450ms Rollback Breach line
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> P50
              </span>
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> P95
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> P99
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorP99Light" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorP50Light" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} unit="ms" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <ReferenceLine y={service.rollbackThresholdLatencyP99} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'SLO Breach: 450ms', fill: '#ef4444', fontSize: 10 }} />
                <Area type="monotone" dataKey="p99" stroke="#f59e0b" fillOpacity={1} fill="url(#colorP99Light)" name="P99 Latency (ms)" />
                <Area type="monotone" dataKey="p50" stroke="#10b981" fillOpacity={1} fill="url(#colorP50Light)" name="P50 Latency (ms)" />
                <Line type="monotone" dataKey="p95" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="P95 Latency (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Error Rate & Request Throughput */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Error Rate (%) & RPS Throughput
              </h3>
              <p className="text-xs text-slate-500">
                HTTP 5xx percentage tracked against automated rollback ceiling (2.0%)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> RPS
              </span>
              <span className="flex items-center gap-1 text-rose-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> 5xx Error %
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{ fontSize: 11 }} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <ReferenceLine yAxisId="right" y={service.rollbackThresholdErrorRate} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'SLO Max 2%', fill: '#ef4444', fontSize: 10 }} />
                <Line yAxisId="left" type="monotone" dataKey="rps" stroke="#3b82f6" strokeWidth={2} dot={false} name="Requests/sec" />
                <Line yAxisId="right" type="monotone" dataKey="errorRate" stroke="#ef4444" strokeWidth={2.5} dot={false} name="Error Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-time Microservice Health Status Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              Cluster Microservice Health & Rollout Registry
            </h3>
            <p className="text-xs text-slate-500">
              Real-time telemetry across active deployment workloads in cluster
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {services.length} services monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">SERVICE NAME</th>
                <th className="py-2.5 px-3">NAMESPACE</th>
                <th className="py-2.5 px-3">STRATEGY</th>
                <th className="py-2.5 px-3">ACTIVE VERSION</th>
                <th className="py-2.5 px-3">P99 LATENCY</th>
                <th className="py-2.5 px-3">ERROR RATE</th>
                <th className="py-2.5 px-3">HPA REPLICAS</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {services.map((s) => (
                <tr 
                  key={s.id} 
                  className={`hover:bg-slate-50 transition-colors ${
                    s.id === service.id ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        s.errorRate > s.rollbackThresholdErrorRate ? 'bg-rose-500 animate-ping' :
                        s.status === 'verifying' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></span>
                      {s.name}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-blue-600">{s.namespace}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px]">
                      {s.strategy}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {s.greenVersion || s.blueVersion}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className={s.latencyP99 > s.rollbackThresholdLatencyP99 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                      {s.latencyP99}ms
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className={s.errorRate > s.rollbackThresholdErrorRate ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                      {s.errorRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {s.currentReplicas} pods
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      s.status === 'stable' ? 'bg-emerald-100 text-emerald-700' :
                      s.status === 'verifying' ? 'bg-blue-100 text-blue-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectService(s)}
                      className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
