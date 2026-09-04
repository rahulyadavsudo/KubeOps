import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  Layers, 
  FileText, 
  Activity, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download
} from 'lucide-react';
import { PipelineStage } from '../../types';

interface StageDetailModalProps {
  stage: PipelineStage | null;
  isOpen: boolean;
  onClose: () => void;
  onRerunStage: (stageId: string) => void;
}

export const StageDetailModal: React.FC<StageDetailModalProps> = ({
  stage,
  isOpen,
  onClose,
  onRerunStage
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'manifest' | 'metrics'>('logs');
  const [isRerunning, setIsRerunning] = useState(false);

  if (!isOpen || !stage) return null;

  // Rich metadata per stage
  const getStageContent = (id: string) => {
    switch (id) {
      case 'git':
        return {
          command: 'git log -1 --stat && git-crypt status && argo-rollouts version',
          artifacts: ['commit-sha: a89f01c82e', 'branch: main', 'gitops-sync: synchronized'],
          logs: [
            '[00:00.12] [GitOps Webhook] Incoming push event received from repository github.com/enterprise/finance-service',
            '[00:00.34] [GitOps Auth] Verified GPG commit signature: 0x4E92B910 (Verified User: ops-lead@cluster.local)',
            '[00:00.61] [GitOps Engine] ArgoCD Application "finance-prod" triggered auto-sync',
            '[00:00.95] [GitOps Diff] Diff detected in k8s/base/deployment.yaml (image: finance-service:v2.4.0 -> v2.4.1)',
            '[00:01.20] [GitOps Commit] Successfully acknowledged webhook. Pipeline dispatched to runner cluster-agent-01.'
          ],
          manifest: `apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: finance-service-rollout
  namespace: finance
spec:
  replicas: 10
  strategy:
    blueGreen:
      activeService: finance-service-blue
      previewService: finance-service-green
      autoPromotionEnabled: false
      antiAffinity:
        preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                  - key: app
                    operator: In
                    values: [finance-service]`,
          metrics: [
            { label: 'Commit Hash', value: 'a89f01c82e' },
            { label: 'Author', value: 'Core Platform Engineering' },
            { label: 'Webhook Latency', value: '42ms' },
            { label: 'Git-Crypt Status', value: 'Encrypted Secrets OK' }
          ]
        };

      case 'scan':
        return {
          command: 'trivy image --severity HIGH,CRITICAL --security-checks vuln,config finance-service:v2.4.1',
          artifacts: ['trivy-results.sarif', 'cyclonedx-sbom.json', 'cosign.sig'],
          logs: [
            '[00:00.05] [Trivy Scanner] Initializing database download (GHCR vulnerability cache v2)...',
            '[00:02.10] [Trivy Scanner] Scanning base image: node:20-alpine (sha256:e3b0c44298fc...)',
            '[00:05.40] [Trivy Scanner] Analyzing OS packages (Alpine Linux v3.19)... 0 vulnerabilities found.',
            '[00:09.15] [Trivy Scanner] Analyzing application dependencies (package-lock.json)... 1,420 packages scanned.',
            '[00:12.80] [Trivy Scanner] Critical: 0 | High: 0 | Medium: 0 | Low: 0',
            '[00:13.90] [Cosign Signing] Signing container digest with KMS key arn:aws:kms:us-east-1:123456789:key/cosign-prod',
            '[00:14.80] [Cosign Signature] Signature verified. Container image verified against supply-chain admission policy.'
          ],
          manifest: `apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: cosign-enforcement-webhook
webhooks:
  - name: verify-signature.cosign.sigstore.dev
    rules:
      - apiGroups: [""]
        apiVersions: ["v1"]
        operations: ["CREATE", "UPDATE"]
        resources: ["pods"]
    failurePolicy: Fail`,
          metrics: [
            { label: 'Critical CVEs', value: '0' },
            { label: 'High CVEs', value: '0' },
            { label: 'Total Packages', value: '1,420' },
            { label: 'Supply Chain SBOM', value: 'SPDX 2.3 Compliant' }
          ]
        };

      case 'iac':
        return {
          command: 'terraform plan -detailed-exitcode -out=tfplan.binary && tfsec .',
          artifacts: ['tfplan.binary', 'cost-estimation.json', 'drift-report.txt'],
          logs: [
            '[00:00.20] [Terraform Core] Initializing HashiCorp AWS, Google, and Kubernetes providers...',
            '[00:02.50] [State Lock] Acquired lock on DynamoDB table "terraform-locks-prod"',
            '[00:04.10] [Terraform Cloud] Evaluating 48 infrastructure resources across multi-cloud clusters...',
            '[00:06.30] [Terraform Plan] EKS NodeGroup "general-compute": 0 to add, 0 to change, 0 to destroy',
            '[00:07.40] [Infracost] Estimated delta monthly cost: $0.00 / month (No new cloud compute instantiated)',
            '[00:08.40] [State Unlock] Released state lock. Plan verification passed.'
          ],
          manifest: `resource "aws_eks_node_group" "prod_compute" {
  cluster_name    = "kubeops-prod-us-east"
  node_group_name = "general-v3"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = module.vpc.private_subnets

  scaling_config {
    desired_size = 8
    max_size     = 24
    min_size     = 4
  }

  instance_types = ["m6i.xlarge"]
  capacity_type  = "ON_DEMAND"
}`,
          metrics: [
            { label: 'Terraform Version', value: 'v1.7.5' },
            { label: 'Resources Checked', value: '48' },
            { label: 'Infrastructure Drift', value: '0% Drift' },
            { label: 'Monthly Cost Delta', value: '$0.00' }
          ]
        };

      case 'green-deploy':
        return {
          command: 'kubectl apply -f k8s/green-deployment.yaml && kubectl rollout status deployment/finance-service-green -n finance',
          artifacts: ['green-deployment.yaml', 'k8s-events.log', 'endpointslice.json'],
          logs: [
            '[00:00.10] [Kubectl Apply] deployment.apps/finance-service-green configured in namespace "finance"',
            '[00:04.20] [K8s Scheduler] Pod finance-service-green-7f89b-x9q21 scheduled on node ip-10-0-12-84.ec2.internal',
            '[00:10.50] [K8s Kubelet] Container image finance-service:v2.4.1 pulled in 6.3s',
            '[00:16.80] [K8s Probes] Initializing readiness probe httpGet:8080/health (initialDelay: 10s)',
            '[00:24.10] [K8s Probes] Readiness probe passed (status: 200 OK) for 8/8 replicas',
            '[00:32.00] [Rollout Status] deployment "finance-service-green" successfully rolled out with 8 pods running.'
          ],
          manifest: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-service-green
  namespace: finance
  labels:
    app: finance-service
    version: "2.4.1"
    track: green
spec:
  replicas: 8
  selector:
    matchLabels:
      app: finance-service
      version: "2.4.1"
  template:
    metadata:
      labels:
        app: finance-service
        version: "2.4.1"
    spec:
      containers:
        - name: app
          image: finance-service:v2.4.1
          resources:
            requests:
              cpu: 250m
              memory: 256Mi`,
          metrics: [
            { label: 'Replicas Ready', value: '8 / 8' },
            { label: 'Pod Startup Time', value: '14.2s avg' },
            { label: 'Namespace', value: 'finance' },
            { label: 'Readiness Probe', value: 'HTTP 200 OK' }
          ]
        };

      case 'canary-gate':
        return {
          command: 'promql-query --expr="sum(rate(http_requests_total{status=~\"5..\",track=\"green\"}[2m])) / sum(rate(http_requests_total{track=\"green\"}[2m])) * 100" --threshold=2.0',
          artifacts: ['canary-slo-report.json', 'prometheus-timeseries.promql'],
          logs: [
            '[00:00.00] [Prometheus SLO Gate] Connecting to Prometheus server at http://prometheus-k8s.monitoring:9090',
            '[00:01.20] [SLO Metric 1] Sampling Green Candidate HTTP 5xx Error Rate...',
            '[00:03.40] [SLO Metric 1] Current: 0.08% | Maximum Allowed Threshold: 2.00% (PASSED)',
            '[00:05.80] [SLO Metric 2] Sampling Green Candidate P99 Latency Histogram...',
            '[00:07.10] [SLO Metric 2] Current: 142ms | Maximum Allowed Threshold: 450ms (PASSED)',
            '[00:09.50] [Continuous Eval] Sampling interval: every 15 seconds. 24/24 evaluation checks healthy.',
            '[00:10.00] [Gate Decision] Canary SLO conditions verified. Safe to proceed with automated traffic shift.'
          ],
          manifest: `apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: canary-slo-health-gate
  namespace: finance
spec:
  groups:
    - name: canary-slo
      rules:
        - alert: CanaryErrorThresholdExceeded
          expr: sum(rate(http_requests_total{status=~"5..", track="green"}[2m])) / sum(rate(http_requests_total{track="green"}[2m])) * 100 > 2.0
          for: 30s
          labels:
            severity: critical
            action: trigger-automated-rollback`,
          metrics: [
            { label: 'Error Rate (5xx)', value: '0.08% (Goal: < 2.0%)' },
            { label: 'P99 Latency', value: '142ms (Goal: < 450ms)' },
            { label: 'Sample Window', value: '2m sliding' },
            { label: 'Health Status', value: 'Healthy (Passing)' }
          ]
        };

      case 'promote':
      default:
        return {
          command: 'istioctl pc route ingressgateway -n istio-system && kubectl apply -f istio/virtual-service-weights.yaml',
          artifacts: ['virtual-service-weights.yaml', 'destination-rule.yaml', 'envoy-config-dump.json'],
          logs: [
            '[00:00.10] [Istio Controller] Ingress Gateway envoy proxy synced with discovery service (Pilot)',
            '[00:00.40] [Traffic Shift] Applying VirtualService update in namespace "finance"...',
            '[00:01.00] [Routing Weights] Blue (v2.4.0): 90% weight | Green (v2.4.1): 10% weight',
            '[00:01.50] [Envoy Clusters] Connection pools configured with circuit breaker (maxConnections: 1024)',
            '[00:02.10] [Automated Rollback Safeguard] Active. If 5xx spikes above 2%, traffic immediately reverts 100% to Blue.',
            '[00:02.80] [Status] Traffic shift deployed. Ready for 100% promotion when green verification completes.'
          ],
          manifest: `apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: finance-service-routing
  namespace: finance
spec:
  hosts:
    - finance.production.internal
  http:
    - route:
        - destination:
            host: finance-service
            subset: blue
          weight: 90
        - destination:
            host: finance-service
            subset: green
          weight: 10`,
          metrics: [
            { label: 'Active Strategy', value: 'Canary Weighted Shift' },
            { label: 'Blue Weight', value: '90%' },
            { label: 'Green Weight', value: '10%' },
            { label: 'Auto-Rollback', value: 'Enabled (< 2.0% 5xx)' }
          ]
        };
    }
  };

  const content = getStageContent(stage.id);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(content.logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRerun = () => {
    setIsRerunning(true);
    onRerunStage(stage.id);
    setTimeout(() => {
      setIsRerunning(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              stage.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
              stage.status === 'running' ? 'bg-blue-100 text-blue-700 animate-pulse' :
              stage.status === 'failed' ? 'bg-rose-100 text-rose-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {stage.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
               stage.status === 'failed' ? <AlertTriangle className="w-4 h-4" /> :
               <Clock className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">{stage.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  stage.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                  stage.status === 'running' ? 'bg-blue-100 text-blue-700' :
                  stage.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {stage.status}
                </span>
                {stage.duration && (
                  <span className="text-[10px] font-mono text-slate-400">
                    ({stage.duration})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{stage.details}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRerun}
              disabled={isRerunning}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRerunning ? 'animate-spin' : ''}`} />
              <span>{isRerunning ? 'Re-running...' : 'Re-run Stage'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Command Runner Box */}
        <div className="px-6 py-3 bg-slate-900 text-slate-200 font-mono text-xs flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-emerald-400 font-bold">$</span>
            <span className="text-slate-300 select-all whitespace-nowrap">{content.command}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(content.command);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 ml-3 shrink-0 cursor-pointer"
            title="Copy command"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>Copy</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Execution Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manifest'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Manifest / Policy Config</span>
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry & Key Metrics</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Output Stream ({content.logs.length} lines)</span>
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to clipboard' : 'Copy raw logs'}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-900 rounded-lg font-mono text-[11px] text-slate-300 space-y-1.5 overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                {content.logs.map((line, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-slate-500 select-none">{String(idx + 1).padStart(2, '0')}</span>
                    <span className={
                      line.includes('Critical: 0') || line.includes('PASSED') || line.includes('Successfully') || line.includes('Signature verified')
                        ? 'text-emerald-400 font-medium'
                        : line.includes('Sampling') || line.includes('Evaluating')
                        ? 'text-blue-300'
                        : 'text-slate-300'
                    }>
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Active Resource Manifest (YAML)</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(content.manifest);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy YAML'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 rounded-lg font-mono text-[11px] text-emerald-300 overflow-x-auto border border-slate-800 shadow-inner">
                <code>{content.manifest}</code>
              </pre>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {content.metrics.map((m, idx) => (
                <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {m.label}
                  </div>
                  <div className="text-sm font-semibold font-mono text-slate-800 mt-1">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Cluster Runner: <code className="font-mono text-slate-700">agent-prod-01</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
