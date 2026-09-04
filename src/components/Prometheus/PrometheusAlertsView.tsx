import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  VolumeX, 
  Sparkles, 
  Search,
  Code,
  Flame
} from 'lucide-react';
import { PrometheusAlert } from '../../types';

interface PrometheusAlertsViewProps {
  alerts: PrometheusAlert[];
  onSilenceAlert: (id: string) => void;
  onDiagnoseAlert: (alert: PrometheusAlert) => void;
  onSimulateNewAlert: () => void;
}

export const PrometheusAlertsView: React.FC<PrometheusAlertsViewProps> = ({
  alerts,
  onSilenceAlert,
  onDiagnoseAlert,
  onSimulateNewAlert,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) && !a.summary.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const firingCount = alerts.filter(a => a.state === 'firing').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-xs">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                Prometheus Alertmanager & SLO Rules Engine
                {firingCount > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                    {firingCount} Firing
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                    All SLOs Compliant
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Continuous real-time Prometheus rules evaluating latency P99, error rate 5xx, and container health
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSimulateNewAlert}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Trigger Synthetic Alert</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search alerts by name or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200 text-xs">
              {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase transition-colors cursor-pointer ${
                    filterSeverity === sev ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {filteredAlerts.length} rules matching
          </span>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 transition-all shadow-xs ${
              alert.state === 'firing'
                ? 'bg-rose-50/50 border-rose-200'
                : alert.state === 'pending'
                ? 'bg-amber-50/50 border-amber-200'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center flex-wrap gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                    alert.severity === 'critical' ? 'bg-rose-100 text-rose-700' :
                    alert.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {alert.severity}
                  </span>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    alert.state === 'firing' ? 'bg-rose-600 text-white' :
                    alert.state === 'pending' ? 'bg-amber-500 text-slate-950' :
                    'bg-slate-100 text-emerald-700'
                  }`}>
                    {alert.state}
                  </span>

                  <h3 className="text-sm font-bold text-slate-900 font-mono">
                    {alert.name}
                  </h3>

                  <span className="text-xs text-slate-500">
                    in <span className="text-blue-600 font-mono font-medium">{alert.namespace} / {alert.service}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-800 font-medium">
                  {alert.summary}
                </p>
                <p className="text-[11px] text-slate-500">
                  {alert.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onDiagnoseAlert(alert)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold uppercase bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>AI Root-Cause</span>
                </button>

                {!alert.silenced ? (
                  <button
                    onClick={() => onSilenceAlert(alert.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span>Silence (30m)</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 italic px-2 py-1">
                    Silenced (30m)
                  </span>
                )}
              </div>
            </div>

            {/* PromQL Query Preview */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-3xl">
                <Code className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="text-slate-400">PromQL:</span>
                <span className="text-slate-700 truncate">{alert.query}</span>
              </div>
              <span className="text-slate-400 shrink-0 ml-2">
                Triggered {alert.triggeredAt}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
