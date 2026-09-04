import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ExecutiveKpiSummary } from './components/ExecutiveKpiSummary';
import { DeploymentPipelineView } from './components/Pipeline/DeploymentPipelineView';
import { GrafanaDashboardView } from './components/Observability/GrafanaDashboardView';
import { HpaAutoscalerEngine } from './components/Autoscaling/HpaAutoscalerEngine';
import { PrometheusAlertsView } from './components/Prometheus/PrometheusAlertsView';
import { RbacAndSecretsView } from './components/Security/RbacAndSecretsView';
import { CentralizedLoggingView } from './components/Logging/CentralizedLoggingView';
import { TerraformMultiCloudHub } from './components/IaC/TerraformMultiCloudHub';
import { SreAiAssistantModal } from './components/SRE/SreAiAssistantModal';
import { ConnectClusterModal, ConnectionMethod } from './components/Cluster/ConnectClusterModal';
import { MicroservicesMeshView } from './components/Microservices/MicroservicesMeshView';
import { EbpfSecurityView } from './components/Security/EbpfSecurityView';
import { FinOpsCostView } from './components/FinOps/FinOpsCostView';
import { 
  INITIAL_CLUSTERS, 
  INITIAL_SERVICES, 
  INITIAL_ALERTS, 
  INITIAL_LOGS, 
  INITIAL_RBAC_ROLES, 
  INITIAL_SECRETS,
  INITIAL_TERRAFORM_TEMPLATES
} from './data/mockClusterData';
import { 
  ClusterInfo, 
  ServiceDeployment, 
  PrometheusAlert, 
  LogEntry, 
  MetricDataPoint, 
  PipelineStage,
  EncryptedSecret,
  RbacRole,
  TerraformTemplate
} from './types';
import { LoadGeneratorModal } from './components/Traffic/LoadGeneratorModal';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
  { id: 'git', title: 'GitOps Commit & Webhook', status: 'success', duration: '1.2s', details: 'Commit a89f01c approved on main branch', iconName: 'git' },
  { id: 'scan', title: 'Trivy Security Scan', status: 'success', duration: '14.8s', details: '0 Critical, 0 High vulnerabilities found', iconName: 'shield' },
  { id: 'iac', title: 'Multi-Cloud Terraform Dry-Run', status: 'success', duration: '8.4s', details: 'No infrastructure drift detected in EKS/GKE', iconName: 'cloud' },
  { id: 'green-deploy', title: 'Deploy Green Candidate', status: 'success', duration: '32s', details: '8/8 pods ready in finance namespace', iconName: 'server' },
  { id: 'canary-gate', title: 'Prometheus Canary Health Gate', status: 'running', duration: 'evaluating', details: 'Sampling P99 latency (< 450ms) and 5xx (< 2%)', iconName: 'activity' },
  { id: 'promote', title: 'Traffic Promotion / Rollback', status: 'idle', details: 'Awaiting canary SLO verification', iconName: 'sliders' },
];

export default function App() {
  const [clusters, setClusters] = useState<ClusterInfo[]>(INITIAL_CLUSTERS);
  const [selectedCluster, setSelectedCluster] = useState<ClusterInfo>(INITIAL_CLUSTERS[0]);
  const [services, setServices] = useState<ServiceDeployment[]>(INITIAL_SERVICES);
  const [activeServiceId, setActiveServiceId] = useState<string>(INITIAL_SERVICES[0].id);
  const [activeTab, setActiveTab] = useState<string>('pipeline');
  const [alerts, setAlerts] = useState<PrometheusAlert[]>(INITIAL_ALERTS);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [roles] = useState<RbacRole[]>(INITIAL_RBAC_ROLES);
  const [secrets, setSecrets] = useState<EncryptedSecret[]>(INITIAL_SECRETS);
  const [templates] = useState<TerraformTemplate[]>(INITIAL_TERRAFORM_TEMPLATES);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isConnectClusterOpen, setIsConnectClusterOpen] = useState<boolean>(false);
  const [isLoadGeneratorOpen, setIsLoadGeneratorOpen] = useState<boolean>(false);
  const [connectClusterMethod, setConnectClusterMethod] = useState<ConnectionMethod>('local');
  const [isPipelineRunning, setIsPipelineRunning] = useState<boolean>(false);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(INITIAL_PIPELINE_STAGES);
  const [isSimulatingFailure, setIsSimulatingFailure] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const activeService = services.find((s) => s.id === activeServiceId) || services[0];
  const firingAlertsCount = alerts.filter(a => a.state === 'firing').length;

  const handleOpenConnectCluster = (method: ConnectionMethod = 'local') => {
    setConnectClusterMethod(method);
    setIsConnectClusterOpen(true);
  };

  // Handle registering and connecting a new cluster
  const handleConnectNewCluster = (newCluster: ClusterInfo) => {
    setClusters((prev) => [newCluster, ...prev]);
    setSelectedCluster(newCluster);
    showToast(`Cluster "${newCluster.name}" registered successfully with ${newCluster.nodesCount} nodes!`, 'success');
  };

  // Helper to show notifications
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Live Metrics Historical Sliding Window
  const [metricsHistory, setMetricsHistory] = useState<MetricDataPoint[]>(() => {
    const points: MetricDataPoint[] = [];
    const now = Date.now();
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now - i * 5000);
      const timeStr = `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
      points.push({
        timestamp: d.toISOString(),
        time: timeStr,
        p50: 16 + Math.round(Math.random() * 4),
        p95: 38 + Math.round(Math.random() * 8),
        p99: 95 + Math.round(Math.random() * 20),
        rps: 1750 + Math.round(Math.random() * 200),
        errorRate: 0.05 + Math.random() * 0.05,
        cpuPercent: 58 + Math.round(Math.random() * 8),
        memPercent: 62 + Math.round(Math.random() * 4),
        replicas: 8,
      });
    }
    return points;
  });

  // Real-time metric tick simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      const timeStr = `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

      // If failure injection is on, elevate error rate and latency
      const p99 = isSimulatingFailure ? 540 + Math.round(Math.random() * 60) : activeService.latencyP99 + Math.round((Math.random() - 0.5) * 6);
      const p50 = isSimulatingFailure ? 65 : activeService.latencyP50 + Math.round((Math.random() - 0.5) * 2);
      const p95 = isSimulatingFailure ? 240 : activeService.latencyP95 + Math.round((Math.random() - 0.5) * 4);
      const errorRate = isSimulatingFailure ? 3.4 + Math.random() * 0.8 : Math.max(0.01, activeService.errorRate + (Math.random() - 0.5) * 0.02);

      const newPoint: MetricDataPoint = {
        timestamp: d.toISOString(),
        time: timeStr,
        p50,
        p95,
        p99,
        rps: activeService.currentRps + Math.round((Math.random() - 0.5) * 80),
        errorRate,
        cpuPercent: activeService.currentCpuPercent + Math.round((Math.random() - 0.5) * 3),
        memPercent: 64,
        replicas: activeService.currentReplicas,
      };

      setMetricsHistory((prev) => [...prev.slice(1), newPoint]);

      // If failure is simulating and auto-rollback is enabled, execute automated rollback!
      if (
        isSimulatingFailure &&
        activeService.autoRollbackEnabled &&
        (errorRate > activeService.rollbackThresholdErrorRate || p99 > activeService.rollbackThresholdLatencyP99)
      ) {
        triggerAutomatedRollback(`Prometheus health gate breached: 5xx Error Rate was ${errorRate.toFixed(2)}% (threshold: ${activeService.rollbackThresholdErrorRate}%)`);
        setIsSimulatingFailure(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulatingFailure, activeService]);

  // Update active service state
  const handleUpdateService = (updated: Partial<ServiceDeployment>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === activeService.id ? { ...s, ...updated } : s))
    );
  };

  // Automated or manual rollback execution
  const triggerAutomatedRollback = (reason: string) => {
    handleUpdateService({
      trafficSplit: 0,
      status: 'stable',
      errorRate: 0.04,
      latencyP99: 105,
      lastRollbackReason: reason,
    });

    // Append Prometheus Alert
    const rollbackAlert: PrometheusAlert = {
      id: `alert-rollback-${Date.now()}`,
      name: 'AutomatedRollbackExecuted',
      severity: 'critical',
      service: activeService.name,
      namespace: activeService.namespace,
      state: 'firing',
      summary: `Automated Canary rollback triggered on ${activeService.name}`,
      description: reason,
      query: 'sum(rate(http_requests_total{status=~"5.*"}[2m])) / sum(rate(http_requests_total[2m])) > 0.02',
      triggeredAt: 'Just now',
    };
    setAlerts((prev) => [rollbackAlert, ...prev]);

    // Append Log
    setLogs((prev) => [
      {
        id: `log-rollback-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'WARN',
        service: activeService.name,
        pod: 'argo-rollouts-controller',
        namespace: 'argo-rollouts',
        traceId: `trace-${Math.random().toString(16).substring(2, 8)}`,
        message: `EMERGENCY ROLLBACK: Canary aborted. Istio VirtualService weights reverted to 100% Blue (v${activeService.blueVersion}). Reason: ${reason}`,
      },
      ...prev,
    ]);

    showToast(`Automated Rollback Executed! Reverted to 100% Blue (v${activeService.blueVersion}).`, 'error');
  };

  // Promote Green candidate to 100%
  const handlePromoteGreen = () => {
    handleUpdateService({
      trafficSplit: 100,
      blueVersion: activeService.greenVersion,
      status: 'promoted',
    });

    setLogs((prev) => [
      {
        id: `log-promote-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: activeService.name,
        pod: 'argo-rollouts-controller',
        namespace: 'argo-rollouts',
        traceId: `trace-prom-${Math.random().toString(16).substring(2, 8)}`,
        message: `RELEASE PROMOTED: Green candidate v${activeService.greenVersion} successfully promoted to 100% stable traffic. Blue ReplicaSet scheduled for graceful termination.`,
      },
      ...prev,
    ]);

    showToast(`Green v${activeService.greenVersion} promoted to 100% traffic across cluster!`, 'success');
  };

  // Run full CI/CD deployment pipeline
  const handleRunFullPipeline = () => {
    setIsPipelineRunning(true);
    showToast('Starting automated Blue-Green rollout pipeline...', 'info');

    // Simulate progressive stages
    setPipelineStages((prev) =>
      prev.map((s, idx) => (idx === 0 ? { ...s, status: 'running' } : { ...s, status: 'idle' }))
    );

    setTimeout(() => {
      setPipelineStages((prev) =>
        prev.map((s, idx) => (idx === 0 ? { ...s, status: 'success' } : idx === 1 ? { ...s, status: 'running' } : s))
      );
    }, 1200);

    setTimeout(() => {
      setPipelineStages((prev) =>
        prev.map((s, idx) => (idx <= 1 ? { ...s, status: 'success' } : idx === 2 ? { ...s, status: 'running' } : s))
      );
    }, 2400);

    setTimeout(() => {
      setPipelineStages((prev) =>
        prev.map((s, idx) => (idx <= 2 ? { ...s, status: 'success' } : idx === 3 ? { ...s, status: 'running' } : s))
      );
    }, 3600);

    setTimeout(() => {
      setPipelineStages((prev) =>
        prev.map((s, idx) => (idx <= 3 ? { ...s, status: 'success' } : idx === 4 ? { ...s, status: 'running' } : s))
      );
      handleUpdateService({
        trafficSplit: 20,
        status: 'verifying',
      });
    }, 4800);

    setTimeout(() => {
      setIsPipelineRunning(false);
      showToast('Canary deployed to 20% traffic. Prometheus metric analysis in progress.', 'success');
    }, 6000);
  };

  // Failure Injection trigger
  const handleToggleFailureInjection = () => {
    if (!isSimulatingFailure) {
      setIsSimulatingFailure(true);
      handleUpdateService({
        errorRate: 3.6,
        latencyP99: 580,
      });

      setLogs((prev) => [
        {
          id: `log-fault-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          service: activeService.name,
          pod: `${activeService.name}-green-canary`,
          namespace: activeService.namespace,
          traceId: `trace-chaos-${Math.random().toString(16).substring(2, 8)}`,
          message: 'FATAL: Uncaught NullPointerException in PaymentAuthorizationHandler. Canary response code 500. Breach detected.',
        },
        ...prev,
      ]);

      showToast('Fault injected! High error rate (3.6%) and P99 latency (580ms). Auto-rollback will engage shortly.', 'error');
    } else {
      setIsSimulatingFailure(false);
      handleUpdateService({
        errorRate: 0.05,
        latencyP99: 110,
      });
      showToast('Failure simulation cancelled. Service metrics normal.', 'info');
    }
  };

  // HPA Traffic Surge simulation & Live Load Test Application
  const handleApplyHpaScale = (newRps: number, newReplicas: number, newCpu: number) => {
    handleUpdateService({
      currentRps: newRps,
      currentReplicas: newReplicas,
      currentCpuPercent: newCpu,
    });

    setLogs((prev) => [
      {
        id: `log-hpa-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: activeService.name,
        pod: 'kube-controller-manager',
        namespace: activeService.namespace || 'kube-system',
        traceId: `trace-hpa-${Math.random().toString(16).substring(2, 8)}`,
        message: `HPA Decision: Load generator detected traffic at ${newRps} RPS (CPU ${newCpu}%). Scaled pods from ${activeService.currentReplicas} -> ${newReplicas} replicas.`,
      },
      ...prev,
    ]);

    showToast(`HPA scaled ${activeService.name} to ${newReplicas} pods (${newRps} RPS measured)`, 'success');
  };

  const handleSimulateTrafficSurge = (rps?: number) => {
    const targetRps = rps || 4800;
    const newReplicas = Math.min(activeService.maxReplicas, Math.ceil((targetRps / activeService.targetRps) * 8));
    const newCpu = Math.min(92, Math.round(55 + (targetRps / 5000) * 35));
    handleApplyHpaScale(targetRps, newReplicas, newCpu);
  };

  // Secret Rotation
  const handleRotateSecret = (secretId: string) => {
    setSecrets((prev) =>
      prev.map((sec) =>
        sec.id === secretId
          ? { ...sec, lastRotated: 'Just now', version: `v${parseInt((sec.version || 'v1').replace('v', '')) + 1}` }
          : sec
      )
    );
    showToast(`HashiCorp Vault envelope key rotated successfully`, 'success');
  };

  // Silence alert
  const handleSilenceAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, silenced: true } : a))
    );
    showToast('Alert silenced for 30 minutes in Alertmanager', 'info');
  };

  // Synthetic alert trigger
  const handleSimulateNewAlert = () => {
    const newAlert: PrometheusAlert = {
      id: `alert-dyn-${Date.now()}`,
      name: 'HighIngressHttpLatencyP99',
      severity: 'critical',
      service: activeService.name,
      namespace: activeService.namespace,
      state: 'firing',
      summary: `P99 Latency reached 520ms on ${activeService.name}`,
      description: 'Prometheus histogram metric has exceeded the 450ms target threshold for 2 consecutive evaluation intervals.',
      query: 'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[2m])) by (le)) > 450',
      triggeredAt: 'Just now',
    };
    setAlerts((prev) => [newAlert, ...prev]);
    showToast('Synthetic Prometheus Alert Fired!', 'error');
  };

  return (
    <div className="flex h-screen w-screen bg-[#F1F5F9] font-sans overflow-hidden text-slate-800">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border shadow-lg text-xs font-semibold ${
            toastMessage.type === 'error' ? 'bg-white text-rose-700 border-rose-300 shadow-rose-500/10' :
            toastMessage.type === 'success' ? 'bg-white text-emerald-700 border-emerald-300 shadow-emerald-500/10' :
            'bg-white text-slate-800 border-slate-300 shadow-slate-500/10'
          }`}>
            {toastMessage.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-600" /> :
             toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
             <Info className="w-4 h-4 text-blue-600" />}
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-70 cursor-pointer">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-40 md:static md:flex transition-transform duration-200 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
          firingAlertsCount={firingAlertsCount}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          onOpenConnectClusterModal={handleOpenConnectCluster}
        />
      </div>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
        ></div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header
          clusters={clusters}
          selectedCluster={selectedCluster}
          onSelectCluster={setSelectedCluster}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          onOpenConnectClusterModal={handleOpenConnectCluster}
          onTriggerTrafficSurge={() => setIsLoadGeneratorOpen(true)}
          onTriggerFailureRollback={handleToggleFailureInjection}
          isSimulatingFailure={isSimulatingFailure}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Executive KPI Summary Cards */}
          <ExecutiveKpiSummary service={activeService} />

          {/* Active View Module */}
          {activeTab === 'pipeline' && (
            <DeploymentPipelineView
              service={activeService}
              onUpdateService={handleUpdateService}
              onTriggerRollback={triggerAutomatedRollback}
              onPromoteGreen={handlePromoteGreen}
              onRunFullPipeline={handleRunFullPipeline}
              isPipelineRunning={isPipelineRunning}
              pipelineStages={pipelineStages}
            />
          )}

          {activeTab === 'grafana' && (
            <GrafanaDashboardView
              service={activeService}
              services={services}
              metricsHistory={metricsHistory}
              onSelectService={(s) => setActiveServiceId(s.id)}
              onSpikeLoad={() => setIsLoadGeneratorOpen(true)}
            />
          )}

          {activeTab === 'hpa' && (
            <HpaAutoscalerEngine
              service={activeService}
              onUpdateService={handleUpdateService}
              onSimulateTrafficBurst={(rps) => handleSimulateTrafficSurge(rps)}
            />
          )}

          {activeTab === 'prometheus' && (
            <PrometheusAlertsView
              alerts={alerts}
              onSilenceAlert={handleSilenceAlert}
              onDiagnoseAlert={() => setIsAiModalOpen(true)}
              onSimulateNewAlert={handleSimulateNewAlert}
            />
          )}

          {activeTab === 'security' && (
            <RbacAndSecretsView
              secrets={secrets}
              rbacRoles={roles}
              onRotateSecret={handleRotateSecret}
              onAddSecret={(newSec) => {
                setSecrets((prev) => [
                  {
                    ...newSec,
                    id: `sec-${Date.now()}`,
                    lastRotated: 'Just now',
                    kmsKeyId: 'arn:aws:kms:us-east-1:root/k8s-key',
                  },
                  ...prev,
                ]);
                showToast(`Registered and encrypted secret ${newSec.name} in HashiCorp Vault`, 'success');
              }}
            />
          )}

          {activeTab === 'ebpf' && (
            <EbpfSecurityView />
          )}

          {activeTab === 'finops' && (
            <FinOpsCostView />
          )}

          {activeTab === 'logs' && (
            <CentralizedLoggingView
              logs={logs}
              onClearLogs={() => setLogs([])}
              onAddLog={(entry) =>
                setLogs((prev) => [
                  {
                    id: `log-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    ...entry,
                  },
                  ...prev,
                ])
              }
            />
          )}

          {activeTab === 'terraform' && (
            <TerraformMultiCloudHub templates={templates} />
          )}

          {activeTab === 'mesh' && (
            <MicroservicesMeshView />
          )}
        </main>
      </div>

      {/* SRE AI Incident Diagnostics Modal */}
      <SreAiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        service={activeService}
        activeAlert={alerts.find(a => a.state === 'firing') || null}
        onTriggerRollback={triggerAutomatedRollback}
      />

      {/* Connect Kubernetes Cluster Modal */}
      <ConnectClusterModal
        isOpen={isConnectClusterOpen}
        onClose={() => setIsConnectClusterOpen(false)}
        onConnectCluster={handleConnectNewCluster}
        initialMethod={connectClusterMethod}
      />

      {/* Traffic Load Generator & Stress Testing Modal */}
      <LoadGeneratorModal
        isOpen={isLoadGeneratorOpen}
        onClose={() => setIsLoadGeneratorOpen(false)}
        activeService={activeService}
        onApplyHpaScale={handleApplyHpaScale}
      />
    </div>
  );
}
