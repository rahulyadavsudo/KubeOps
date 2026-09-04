import React, { useState, useRef, useEffect } from 'react';
import { 
  Server, 
  RotateCcw, 
  Zap, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Cloud,
  Menu,
  X,
  Plus,
  ChevronDown,
  Laptop,
  FileText,
  Terminal,
  Key
} from 'lucide-react';
import { ClusterInfo } from '../types';
import { ConnectionMethod } from './Cluster/ConnectClusterModal';

interface HeaderProps {
  clusters: ClusterInfo[];
  selectedCluster: ClusterInfo;
  onSelectCluster: (cluster: ClusterInfo) => void;
  onOpenAiModal: () => void;
  onOpenConnectClusterModal: (method?: ConnectionMethod) => void;
  onTriggerTrafficSurge: () => void;
  onTriggerFailureRollback: () => void;
  isSimulatingFailure: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  clusters,
  selectedCluster,
  onSelectCluster,
  onOpenAiModal,
  onOpenConnectClusterModal,
  onTriggerTrafficSurge,
  onTriggerFailureRollback,
  isSimulatingFailure,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const [isConnectMenuOpen, setIsConnectMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsConnectMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle & Cluster Info */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
            Cluster:
          </span>
          <div className="relative">
            <select
              id="cluster-selector-dropdown"
              value={selectedCluster.id}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'CONNECT_LOCAL') {
                  onOpenConnectClusterModal('local');
                  return;
                }
                if (val === 'CONNECT_KUBECONFIG') {
                  onOpenConnectClusterModal('kubeconfig-file');
                  return;
                }
                if (val === 'CONNECT_NEW') {
                  onOpenConnectClusterModal('helm');
                  return;
                }
                const c = clusters.find((item) => item.id === val);
                if (c) onSelectCluster(c);
              }}
              className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-900 font-semibold text-xs sm:text-sm rounded-md py-1 px-2.5 pr-7 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.provider.toUpperCase()})
                </option>
              ))}
              <option disabled>──────────</option>
              <option value="CONNECT_LOCAL">⚡ + Connect Local Cluster (Minikube / KinD)...</option>
              <option value="CONNECT_KUBECONFIG">📄 + Import Kubeconfig File (.kube/config)...</option>
              <option value="CONNECT_NEW">+ Connect via Helm Agent / IAM...</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 text-xs">
              ▼
            </div>
          </div>

          {/* Connect Cluster Split Button & Quick Options Dropdown */}
          <div className="relative" ref={menuRef}>
            <div className="inline-flex rounded-md shadow-xs">
              {/* Primary Connect Button */}
              <button
                id="btn-connect-cluster"
                onClick={() => onOpenConnectClusterModal('local')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 py-1 rounded-l-md font-semibold transition-colors cursor-pointer"
                title="Connect a local cluster or import via Kubeconfig"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Connect Cluster</span>
                <span className="md:hidden">Connect</span>
              </button>

              {/* Dropdown Chevron for Quick Options */}
              <button
                type="button"
                id="btn-connect-cluster-dropdown"
                onClick={() => setIsConnectMenuOpen(!isConnectMenuOpen)}
                className="bg-blue-700 hover:bg-blue-800 text-white px-1.5 py-1 rounded-r-md border-l border-blue-600 transition-colors cursor-pointer flex items-center justify-center"
                title="Choose connection method"
                aria-label="Connection options menu"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Ingestion Dropdown Menu */}
            {isConnectMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Ingestion Methods
                </div>

                {/* Option 1: Local Cluster */}
                <button
                  type="button"
                  id="menu-opt-local-cluster"
                  onClick={() => {
                    setIsConnectMenuOpen(false);
                    onOpenConnectClusterModal('local');
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Laptop className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>Connect Local Cluster</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-mono">1-Click</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Minikube, KinD, Docker Desktop, k3s</div>
                  </div>
                </button>

                {/* Option 2: Kubeconfig File */}
                <button
                  type="button"
                  id="menu-opt-kubeconfig-file"
                  onClick={() => {
                    setIsConnectMenuOpen(false);
                    onOpenConnectClusterModal('kubeconfig-file');
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 text-slate-700 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>Add with Kubeconfig</span>
                      <span className="text-[9px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-mono">YAML</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Upload or paste ~/.kube/config</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100"></div>

                {/* Option 3: Helm Agent */}
                <button
                  type="button"
                  onClick={() => {
                    setIsConnectMenuOpen(false);
                    onOpenConnectClusterModal('helm');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-purple-600" />
                  <span>Deploy Helm Agent (Zero-Trust)</span>
                </button>

                {/* Option 4: Cloud IAM */}
                <button
                  type="button"
                  onClick={() => {
                    setIsConnectMenuOpen(false);
                    onOpenConnectClusterModal('cloud-iam');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5 text-sky-600" />
                  <span>Cloud IAM (AWS IRSA / Workload ID)</span>
                </button>
              </div>
            )}
          </div>

          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Healthy
          </span>
        </div>
      </div>

      {/* Right: Multi-Cloud Sync status & Quick Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right hidden lg:block">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
            Multi-Cloud Sync
          </div>
          <div className="text-xs text-slate-600 font-medium">
            AWS · GCP · Azure [Terraform Active]
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Traffic Surge & Real Load Generator */}
          <button
            id="btn-surge-traffic"
            onClick={onTriggerTrafficSurge}
            title="Real HTTP load test, in-cluster K8s job generator & HPA spike benchmark"
            className="hidden sm:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] px-2.5 py-1.5 rounded-md font-semibold uppercase tracking-tight transition-colors cursor-pointer shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Generator</span>
          </button>

          {/* Inject Fault */}
          <button
            id="btn-inject-failure"
            onClick={onTriggerFailureRollback}
            title="Inject Canary 5xx errors to demonstrate automated rollback"
            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md font-semibold uppercase tracking-tight transition-colors cursor-pointer border ${
              isSimulatingFailure
                ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isSimulatingFailure ? 'Rolling Back...' : 'Inject Fault'}</span>
          </button>

          {/* AI SRE Diagnostics */}
          <button
            id="btn-ai-sre-diagnostics"
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] px-3 py-1.5 rounded-md font-bold uppercase tracking-tight transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">AI Diagnostics</span>
            <span className="sm:hidden">AI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
