import React, { useState } from 'react';
import { 
  GitPullRequest, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Play, 
  Sliders, 
  Clock, 
  Layers,
  ArrowRight,
  Server,
  Lock,
  UserCheck,
  UploadCloud,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { ServiceDeployment, PipelineStage } from '../../types';
import { StageDetailModal } from './StageDetailModal';
import { DockerHubModal } from './DockerHubModal';

interface DeploymentPipelineViewProps {
  service: ServiceDeployment;
  onUpdateService: (updated: Partial<ServiceDeployment>) => void;
  onTriggerRollback: (reason: string) => void;
  onPromoteGreen: () => void;
  onRunFullPipeline: () => void;
  isPipelineRunning: boolean;
  pipelineStages: PipelineStage[];
}

export const DeploymentPipelineView: React.FC<DeploymentPipelineViewProps> = ({
  service,
  onUpdateService,
  onTriggerRollback,
  onPromoteGreen,
  onRunFullPipeline,
  isPipelineRunning,
  pipelineStages,
}) => {
  const [trafficInput, setTrafficInput] = useState<number>(service.trafficSplit);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [isDockerHubModalOpen, setIsDockerHubModalOpen] = useState<boolean>(false);

  const handleTrafficChange = (val: number) => {
    setTrafficInput(val);
    onUpdateService({ trafficSplit: val });
  };

  return (
    <div className="space-y-6">
      {/* Top Card: Strategy Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                Deployment Pipeline: blue-green-strategy
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                service.status === 'stable' ? 'bg-emerald-100 text-emerald-700' :
                service.status === 'rolling-back' ? 'bg-rose-100 text-rose-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {service.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Service: <span className="text-slate-800 font-mono font-medium">{service.name}</span> (namespace: <span className="text-blue-600 font-mono">{service.namespace}</span>) · Automated Prometheus SLO health verification with zero-downtime traffic switching.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setIsDockerHubModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] sm:text-xs px-3 py-1.5 rounded font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-300 shadow-2xs"
              title="View Dockerfile, push commands, and Kubernetes manifests"
            >
              <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
              <span>Docker Hub & K8s</span>
            </button>

            <button
              id="btn-run-pipeline"
              disabled={isPipelineRunning}
              onClick={onRunFullPipeline}
              className={`text-[10px] sm:text-xs px-3 py-1.5 rounded font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                isPipelineRunning
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isPipelineRunning ? 'Rolling out...' : 'Trigger Rollout'}</span>
            </button>

            <button
              id="btn-manual-rollback"
              onClick={() => onTriggerRollback('Manual SRE Emergency Rollback triggered')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs px-3 py-1.5 rounded font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>Manual Rollback</span>
            </button>

            <button
              id="btn-promote-green"
              onClick={onPromoteGreen}
              disabled={service.trafficSplit === 100}
              className={`text-[10px] sm:text-xs px-3 py-1.5 rounded font-bold uppercase transition-colors cursor-pointer ${
                service.trafficSplit === 100
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              Promote Green
            </button>
          </div>
        </div>

        {/* Visual Blue-Green Rollout Topology Flow */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-around gap-6 border-b border-slate-100 overflow-x-auto">
          {/* Build Box */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="min-h-[26px] flex items-center justify-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">STAGE 01</span>
            </div>
            <div className="w-24 h-24 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center font-bold text-slate-600 shadow-xs p-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">ARTIFACT</span>
              <span className="text-xs font-bold text-slate-700 mt-0.5">BUILD</span>
              <span className="text-[9px] font-mono text-slate-400 mt-1">passed</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 font-semibold">{service.greenVersion}</div>
          </div>

          <div className="hidden md:block h-[2px] w-10 bg-slate-200 mt-4"></div>

          {/* Blue Box */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="min-h-[26px] flex items-center justify-center">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-2xs">
                PRIMARY ACTIVE
              </span>
            </div>
            <div className="w-24 h-24 rounded-xl bg-blue-50 border-2 border-blue-400 flex flex-col items-center justify-center font-bold text-blue-600 shadow-xs p-2">
              <span className="text-[10px] text-blue-500 uppercase tracking-wider font-semibold">STABLE</span>
              <span className="text-sm font-extrabold text-blue-700 mt-0.5">BLUE</span>
              <span className="text-[10px] font-mono text-blue-500 mt-1">v{service.blueVersion}</span>
            </div>
            <div className="text-[10px] font-bold text-blue-600">{100 - service.trafficSplit}% TRAFFIC</div>
          </div>

          <div className="hidden md:block h-[2px] w-10 bg-slate-200 mt-4"></div>

          {/* Green Box - Ample vertical spacing to prevent overlapping */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="min-h-[26px] flex items-center justify-center">
              {service.trafficSplit > 0 ? (
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs whitespace-nowrap flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  CANARY ACTIVE
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 whitespace-nowrap">
                  STANDBY
                </span>
              )}
            </div>
            <div className={`w-24 h-24 rounded-xl bg-emerald-50 border-2 flex flex-col items-center justify-center font-bold text-emerald-600 shadow-xs transition-all p-2 ${
              service.trafficSplit > 0 
                ? 'border-emerald-500 shadow-sm ring-2 ring-emerald-500/20' 
                : 'border-emerald-200 opacity-90'
            }`}>
              <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold">CANDIDATE</span>
              <span className="text-sm font-extrabold text-emerald-700 mt-0.5">GREEN</span>
              <span className="text-[10px] font-mono text-emerald-600 mt-1">v{service.greenVersion}</span>
            </div>
            <div className="text-[10px] font-bold text-emerald-600">{service.trafficSplit}% TRAFFIC</div>
          </div>

          <div className="hidden md:block h-[2px] w-10 bg-slate-200 mt-4"></div>

          {/* Stable Box */}
          <div className="flex flex-col items-center gap-2 opacity-50 shrink-0">
            <div className="min-h-[26px] flex items-center justify-center">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider px-2 py-0.5">NEXT STAGE</span>
            </div>
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center font-bold text-slate-400 italic p-2">
              <span className="text-[10px] uppercase tracking-wider">TARGET</span>
              <span className="text-xs font-bold text-slate-500 mt-0.5">RELEASE</span>
              <span className="text-[9px] font-mono text-slate-400 mt-1">GitOps</span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Promote</div>
          </div>
        </div>

        {/* Traffic Split Slider & Settings */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-blue-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Blue (v{service.blueVersion}): {100 - service.trafficSplit}%
            </span>
            <span className="text-emerald-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              Green (v{service.greenVersion}): {service.trafficSplit}%
            </span>
          </div>

          <input
            id="traffic-split-slider"
            type="range"
            min="0"
            max="100"
            step="5"
            value={service.trafficSplit}
            onChange={(e) => handleTrafficChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px]">Quick presets:</span>
            <div className="flex gap-1.5">
              {[0, 10, 25, 50, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handleTrafficChange(pct)}
                  className={`px-2 py-0.5 text-[10px] rounded font-mono font-semibold transition-all cursor-pointer ${
                    service.trafficSplit === pct
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {pct}% Green
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Security & RBAC Metadata Tags from Design HTML */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-8">
            <div>
              <span className="text-[10px] block text-slate-400 uppercase font-bold tracking-tighter mb-1">
                Secret Mgmt
              </span>
              <span className="text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded inline-flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-400" />
                Vault-Encrypted (AES-256)
              </span>
            </div>
            <div>
              <span className="text-[10px] block text-slate-400 uppercase font-bold tracking-tighter mb-1">
                RBAC Policy
              </span>
              <span className="text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded inline-flex items-center gap-1.5">
                <UserCheck className="w-3 h-3 text-slate-400" />
                Strict-Namespacing-Enabled
              </span>
            </div>
            <div>
              <span className="text-[10px] block text-slate-400 uppercase font-bold tracking-tighter mb-1">
                Prometheus SLO Check
              </span>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                P99 &lt; 450ms · 5xx &lt; 2.0%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CI/CD Stages List Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Automated Release Stages (Argo Rollouts + GitHub Actions)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Evaluated every 15s
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {pipelineStages.map((st, idx) => (
            <button
              key={st.id}
              onClick={() => setSelectedStage(st)}
              className={`p-3 rounded-lg border text-xs text-left transition-all cursor-pointer group hover:scale-[1.02] hover:shadow-md ${
                st.status === 'running' ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs ring-1 ring-blue-400/30' :
                st.status === 'success' ? 'bg-slate-50 hover:bg-white border-slate-200 hover:border-blue-400 text-slate-700' :
                st.status === 'failed' ? 'bg-rose-50 hover:bg-white border-rose-300 hover:border-rose-400 text-rose-900' :
                'bg-slate-50/50 hover:bg-white border-slate-200/60 hover:border-slate-300 text-slate-400'
              }`}
              title="Click to inspect logs, YAML manifest, and live telemetry"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-slate-400 font-bold group-hover:text-blue-600 transition-colors">
                  STAGE 0{idx + 1}
                </span>
                {st.status === 'running' && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                )}
                {st.status === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                )}
                {st.status === 'failed' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
                )}
              </div>
              <div className="font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                {st.title}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                {st.details}
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                {st.duration ? (
                  <span className="text-blue-600 font-mono flex items-center gap-1 font-medium">
                    <Clock className="w-2.5 h-2.5" />
                    {st.duration}
                  </span>
                ) : (
                  <span className="text-slate-400 font-mono">queued</span>
                )}
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-blue-600 flex items-center gap-0.5">
                  Inspect <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stage Detail Logs & Manifest Modal */}
      <StageDetailModal
        stage={selectedStage}
        isOpen={!!selectedStage}
        onClose={() => setSelectedStage(null)}
        onRerunStage={onRunFullPipeline}
      />

      {/* Docker Hub Containerization & Kubernetes Deployment Guide Modal */}
      <DockerHubModal
        isOpen={isDockerHubModalOpen}
        onClose={() => setIsDockerHubModalOpen(false)}
      />
    </div>
  );
};
