import React from 'react';
import { 
  GitPullRequest, 
  BarChart3, 
  Zap, 
  Bell, 
  Key, 
  Terminal, 
  Cloud, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Server,
  Plus,
  Network,
  ShieldAlert,
  DollarSign,
  Laptop,
  FileText
} from 'lucide-react';
import { ConnectionMethod } from './Cluster/ConnectClusterModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  firingAlertsCount: number;
  onOpenAiModal: () => void;
  onOpenConnectClusterModal?: (method?: ConnectionMethod) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  firingAlertsCount,
  onOpenAiModal,
  onOpenConnectClusterModal,
}) => {
  const navItems = [
    { id: 'pipeline', label: 'CI/CD & Blue-Green', dotColor: 'bg-blue-400', icon: GitPullRequest },
    { id: 'grafana', label: 'Grafana Metrics', dotColor: 'bg-indigo-400', icon: BarChart3 },
    { id: 'hpa', label: 'HPA Autoscaler', dotColor: 'bg-cyan-400', icon: Zap },
    { 
      id: 'prometheus', 
      label: firingAlertsCount > 0 ? `Alerts (${firingAlertsCount})` : 'Prometheus Alerts', 
      dotColor: firingAlertsCount > 0 ? 'bg-orange-400' : 'bg-emerald-400',
      badgeColor: firingAlertsCount > 0 ? 'text-orange-400' : 'text-slate-400',
      icon: Bell 
    },
    { id: 'security', label: 'Secrets & RBAC', dotColor: 'bg-purple-400', icon: Key },
    { id: 'ebpf', label: 'eBPF Security (Rust)', dotColor: 'bg-rose-400', icon: ShieldAlert },
    { id: 'finops', label: 'FinOps Cost (Go)', dotColor: 'bg-amber-400', icon: DollarSign },
    { id: 'logs', label: 'Logging Hub', dotColor: 'bg-emerald-400', icon: Terminal },
    { id: 'terraform', label: 'Multi-Cloud IaC', dotColor: 'bg-sky-400', icon: Cloud },
    { id: 'mesh', label: 'Microservices Mesh', dotColor: 'bg-violet-400', icon: Network },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20 ring-1 ring-white/10">
          K
        </div>
        <div>
          <span className="text-white font-bold tracking-tight text-sm block">KUBE-DEPLOY OS</span>
          <span className="text-[10px] text-slate-400 font-mono block">Enterprise Platform</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 text-sm overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 pb-1">
          Navigation
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${isActive ? item.dotColor : 'border border-slate-600'}`}></span>
                <span className="truncate">{item.label}</span>
              </div>
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
            </button>
          );
        })}

        {/* Connect New Cluster Button in Sidebar */}
        {onOpenConnectClusterModal && (
          <div className="pt-2 space-y-1">
            <button
              onClick={() => onOpenConnectClusterModal('local')}
              className="w-full p-2.5 rounded-lg border border-slate-700/80 hover:border-blue-500/80 bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Server className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>Connect Cluster</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
            </button>

            {/* Sub-actions for quick access */}
            <div className="grid grid-cols-2 gap-1 px-1">
              <button
                type="button"
                onClick={() => onOpenConnectClusterModal('local')}
                className="text-[10px] text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 rounded py-1 px-1.5 flex items-center gap-1 transition-colors cursor-pointer"
                title="Connect local Minikube / KinD / Docker cluster"
              >
                <Laptop className="w-3 h-3 text-emerald-500" />
                <span className="truncate">Local Cluster</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenConnectClusterModal('kubeconfig-file')}
                className="text-[10px] text-slate-400 hover:text-blue-400 hover:bg-slate-800/80 rounded py-1 px-1.5 flex items-center gap-1 transition-colors cursor-pointer"
                title="Import .kube/config file"
              >
                <FileText className="w-3 h-3 text-blue-500" />
                <span className="truncate">Kubeconfig</span>
              </button>
            </div>
          </div>
        )}

        {/* SRE AI Assistant Button in Sidebar */}
        <div className="pt-2">
          <button
            onClick={onOpenAiModal}
            className="w-full p-2.5 rounded-lg bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-700/40 hover:border-purple-500 text-purple-200 text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer group shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
            <div className="text-left">
              <span className="block font-semibold">AI SRE Diagnostics</span>
              <span className="block text-[10px] text-purple-300/70 font-mono">Gemini Copilot</span>
            </div>
          </button>
        </div>
      </nav>

      {/* Bottom Prometheus Engine Widget */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 p-3 rounded-lg text-[11px] leading-tight border border-slate-800/80">
          <div className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">PROMETHEUS ENGINE</div>
          <div className="text-blue-400 font-mono font-medium">v2.45.0-LTS Active</div>
          <div className="text-slate-500 text-[10px] mt-1">Multi-Region Scrape Sync</div>
        </div>
      </div>
    </aside>
  );
};
