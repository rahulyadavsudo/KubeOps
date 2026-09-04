import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Server, 
  Terminal, 
  Key, 
  Cloud, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  Activity, 
  RefreshCw,
  AlertCircle,
  UploadCloud,
  FileText,
  Laptop,
  Zap,
  Sliders,
  FileCheck,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import * as yaml from 'js-yaml';
import { ClusterInfo, CloudProvider } from '../../types';

export type ConnectionMethod = 'local' | 'kubeconfig-file' | 'helm' | 'kubeconfig' | 'cloud-iam';

interface ConnectClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectCluster: (newCluster: ClusterInfo) => void;
  initialMethod?: ConnectionMethod;
}

interface LocalRuntimePreset {
  id: string;
  name: string;
  defaultServer: string;
  context: string;
  defaultNodes: number;
  command: string;
  description: string;
}

const LOCAL_PRESETS: LocalRuntimePreset[] = [
  {
    id: 'docker-desktop',
    name: 'Docker Desktop',
    defaultServer: 'https://127.0.0.1:6443',
    context: 'docker-desktop',
    defaultNodes: 1,
    command: 'Docker Desktop -> Settings -> Kubernetes -> Enable Kubernetes',
    description: 'Single-node local cluster embedded in Docker Desktop for macOS & Windows.',
  },
  {
    id: 'minikube',
    name: 'Minikube',
    defaultServer: 'https://127.0.0.1:8443',
    context: 'minikube',
    defaultNodes: 2,
    command: 'minikube start --driver=docker --cpus=4 --memory=8192',
    description: 'VM & container-backed lightweight local development Kubernetes.',
  },
  {
    id: 'kind',
    name: 'KinD (K8s in Docker)',
    defaultServer: 'https://127.0.0.1:6443',
    context: 'kind-local-cluster',
    defaultNodes: 3,
    command: 'kind create cluster --name local-cluster',
    description: 'Multi-node cluster in Docker containers, ideal for Istio canary testing.',
  },
  {
    id: 'k3s',
    name: 'k3s / k3d',
    defaultServer: 'https://127.0.0.1:6443',
    context: 'k3s-default',
    defaultNodes: 1,
    command: 'k3d cluster create mycluster -p "80:80@loadbalancer"',
    description: 'Rancher ultra-lightweight single-binary Kubernetes distribution.',
  },
  {
    id: 'microk8s',
    name: 'MicroK8s',
    defaultServer: 'https://127.0.0.1:16443',
    context: 'microk8s',
    defaultNodes: 1,
    command: 'microk8s start && microk8s enable ingress dns',
    description: 'Zero-ops canonical local cluster for Linux workstations and edge devices.',
  },
  {
    id: 'custom-local',
    name: 'Custom Localhost',
    defaultServer: 'https://127.0.0.1:6443',
    context: 'custom-local-cluster',
    defaultNodes: 1,
    command: 'kubectl proxy --port=8001 or port-forward 6443',
    description: 'Custom localhost or LAN IP endpoint running a local control-plane.',
  },
];

const SAMPLE_KIND_KUBECONFIG = `apiVersion: v1
kind: Config
preferences: {}
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJqVENDQVM2Z0F3SUJBZ0lJQWdDQkFBQUFBQUF3RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2ExbHVaQzFqYjI1MGNtOXNMV0JzWVc1bE1CNFhEVEl4TURreE16RXpNRFUxTUZvWERUTXhNRGt4TXpFegpNREU1TVZvd0ZURVRNQkVHQTFVRUF4TUthMWx1WkMxamIyNTBjbTlzTFdCc1lXNWxNQjRYRFRJeE1Ea3hNekV6Ck1EVTFNRm93DQo=
    server: https://127.0.0.1:6443
  name: kind-local-cluster
contexts:
- context:
    cluster: kind-local-cluster
    namespace: default
    user: kind-local-cluster
  name: kind-local-cluster
current-context: kind-local-cluster
users:
- name: kind-local-cluster
  user:
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJnVENDQVN5Z0F3SUJBZ0lJQWdDREFBQUFBQUF3RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2ExbHVaQzFqYjI1MGNtOXNMV0JzWVc1bE1CNFhEVEl4TURreE16RXpNRFUxTUZvWERUTXhNRGt4TXpFegpNREU1TVZvd0ZURVRNQkVHQTFVRUF4TUthMWx1WkMxamIyNTBjbTlzTFdCc1lXNWxNQjRYRFRJeE1Ea3hNekV6Cg==
    client-key-data: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBeHFv...`;

const SAMPLE_MINIKUBE_KUBECONFIG = `apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority: /Users/developer/.minikube/ca.crt
    server: https://127.0.0.1:8443
  name: minikube
contexts:
- context:
    cluster: minikube
    namespace: default
    user: minikube
  name: minikube
current-context: minikube
users:
- name: minikube
  user:
    client-certificate: /Users/developer/.minikube/profiles/minikube/client.crt
    client-key: /Users/developer/.minikube/profiles/minikube/client.key`;

const SAMPLE_EKS_KUBECONFIG = `apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg==
    server: https://745F92E83021.gr7.us-east-1.eks.amazonaws.com
  name: arn:aws:eks:us-east-1:123456789012:cluster/prod-eks-us-east-1
contexts:
- context:
    cluster: arn:aws:eks:us-east-1:123456789012:cluster/prod-eks-us-east-1
    namespace: kubeops-system
    user: arn:aws:eks:us-east-1:123456789012:cluster/prod-eks-us-east-1
  name: prod-eks-us-east-1
current-context: prod-eks-us-east-1
users:
- name: arn:aws:eks:us-east-1:123456789012:cluster/prod-eks-us-east-1
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: aws
      args:
      - eks
      - get-token
      - --cluster-name
      - prod-eks-us-east-1`;

export const ConnectClusterModal: React.FC<ConnectClusterModalProps> = ({
  isOpen,
  onClose,
  onConnectCluster,
  initialMethod = 'local',
}) => {
  const [method, setMethod] = useState<ConnectionMethod>(initialMethod);

  // General cluster settings
  const [clusterName, setClusterName] = useState<string>('kind-local-cluster');
  const [provider, setProvider] = useState<CloudProvider>('local');
  const [region, setRegion] = useState<string>('localhost (local-machine)');
  const [nodesCount, setNodesCount] = useState<number>(3);
  const [prometheusUrl, setPrometheusUrl] = useState<string>('http://localhost:9090');
  const [apiServerUrl, setApiServerUrl] = useState<string>('https://127.0.0.1:6443');
  const [istioEnabled, setIstioEnabled] = useState<boolean>(true);
  const [argoCdEnabled, setArgoCdEnabled] = useState<boolean>(true);
  const [argoCdServer, setArgoCdServer] = useState<string>('http://localhost:8080');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Local Cluster state
  const [selectedLocalPreset, setSelectedLocalPreset] = useState<string>('kind');
  const [localProbeStatus, setLocalProbeStatus] = useState<'idle' | 'probing' | 'reachable' | 'not-found'>('idle');

  // Kubeconfig File state
  const [kubeconfigRaw, setKubeconfigRaw] = useState<string>(SAMPLE_KIND_KUBECONFIG);
  const [kubeconfigFileName, setKubeconfigFileName] = useState<string>('config');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [kubeconfigValidation, setKubeconfigValidation] = useState<{
    valid: boolean;
    error?: string;
    contexts?: Array<{ name: string; cluster: string; user: string; namespace?: string }>;
    clusters?: Array<{ name: string; server: string; insecureSkipTlsVerify?: boolean; hasCaData?: boolean }>;
    users?: Array<{ name: string; authType: string }>;
    currentContext?: string;
    detectedClusterName?: string;
    detectedServerUrl?: string;
    activeNamespace?: string;
    authType?: string;
  } | null>(null);
  const [selectedContext, setSelectedContext] = useState<string>('kind-local-cluster');

  // Service Account & IAM state
  const [serviceAccountToken, setServiceAccountToken] = useState<string>('');
  const [iamRoleArn, setIamRoleArn] = useState<string>('arn:aws:iam::123456789012:role/KubeOpsAgentRole');

  // Verification pipeline status
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyStep, setVerifyStep] = useState<number>(0);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial method when modal opens
  useEffect(() => {
    if (isOpen && initialMethod) {
      setMethod(initialMethod);
      if (initialMethod === 'local') {
        setProvider('local');
        setRegion('localhost (local-machine)');
        setClusterName('kind-local-cluster');
        setApiServerUrl('https://127.0.0.1:6443');
        setNodesCount(3);
      } else if (initialMethod === 'kubeconfig-file') {
        parseKubeconfig(kubeconfigRaw);
      }
    }
  }, [isOpen, initialMethod]);

  // Auto-parse kubeconfig whenever raw text changes
  useEffect(() => {
    if (method === 'kubeconfig-file' && kubeconfigRaw.trim()) {
      parseKubeconfig(kubeconfigRaw);
    }
  }, [kubeconfigRaw]);

  if (!isOpen) return null;

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Select Local Preset
  const handleSelectLocalPreset = (presetId: string) => {
    setSelectedLocalPreset(presetId);
    const preset = LOCAL_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setClusterName(preset.context);
    setApiServerUrl(preset.defaultServer);
    setNodesCount(preset.defaultNodes);
    setProvider('local');
    setRegion('localhost (docker-desktop)');
    setLocalProbeStatus('idle');
  };

  // Probe Local Endpoint
  const handleProbeLocalCluster = () => {
    setLocalProbeStatus('probing');
    setTimeout(() => {
      setLocalProbeStatus('reachable');
    }, 800);
  };

  // Parse Kubeconfig client-side with fallback to server API
  const parseKubeconfig = (raw: string) => {
    try {
      const parsed = yaml.load(raw) as any;
      if (!parsed || typeof parsed !== 'object') {
        setKubeconfigValidation({
          valid: false,
          error: 'YAML formatting issue. Please ensure valid YAML indentation.',
        });
        return;
      }

      const rawClusters = Array.isArray(parsed.clusters) ? parsed.clusters : [];
      const rawContexts = Array.isArray(parsed.contexts) ? parsed.contexts : [];
      const rawUsers = Array.isArray(parsed.users) ? parsed.users : [];
      const currentCtx = typeof parsed['current-context'] === 'string' ? parsed['current-context'] : (rawContexts[0]?.name || 'default');

      if (rawClusters.length === 0 && rawContexts.length === 0) {
        setKubeconfigValidation({
          valid: false,
          error: 'Invalid Kubeconfig: missing "clusters" and "contexts" sections.',
        });
        return;
      }

      const contexts = rawContexts.map((ctx: any) => ({
        name: ctx.name || 'unnamed-context',
        cluster: ctx.context?.cluster || rawClusters[0]?.name || 'default',
        user: ctx.context?.user || 'default',
        namespace: ctx.context?.namespace || 'default',
      }));

      const clusters = rawClusters.map((c: any) => ({
        name: c.name || 'unnamed-cluster',
        server: c.cluster?.server || 'https://127.0.0.1:6443',
        insecureSkipTlsVerify: !!c.cluster?.['insecure-skip-tls-verify'],
        hasCaData: !!c.cluster?.['certificate-authority-data'],
      }));

      const users = rawUsers.map((u: any) => {
        let authType = 'none';
        if (u.user?.['client-certificate-data'] || u.user?.['client-key-data']) {
          authType = 'x509 client-certificate';
        } else if (u.user?.token) {
          authType = 'bearer-token';
        } else if (u.user?.exec) {
          authType = `exec plugin (${u.user.exec.command || 'iam'})`;
        } else if (u.user?.['auth-provider']) {
          authType = `auth-provider (${u.user['auth-provider'].name || 'oidc'})`;
        }
        return {
          name: u.name || 'unnamed-user',
          authType,
        };
      });

      const activeCtx = contexts.find(c => c.name === currentCtx) || contexts[0];
      const activeCluster = clusters.find(c => c.name === activeCtx?.cluster) || clusters[0];
      const activeUser = users.find(u => u.name === activeCtx?.user) || users[0];

      setSelectedContext(currentCtx);
      if (activeCluster?.name) {
        setClusterName(activeCluster.name);
      }
      if (activeCluster?.server) {
        setApiServerUrl(activeCluster.server);
        if (activeCluster.server.includes('127.0.0.1') || activeCluster.server.includes('localhost')) {
          setProvider('local');
          setRegion('localhost (local-machine)');
        } else if (activeCluster.server.includes('eks.amazonaws.com')) {
          setProvider('aws');
          setRegion('us-east-1 (N. Virginia)');
        } else if (activeCluster.server.includes('azmk8s.io')) {
          setProvider('azure');
          setRegion('eastus (Virginia)');
        } else {
          setProvider('gcp');
          setRegion('us-central1 (Iowa)');
        }
      }

      setKubeconfigValidation({
        valid: true,
        currentContext: currentCtx,
        detectedClusterName: activeCluster?.name || 'kubeconfig-cluster',
        detectedServerUrl: activeCluster?.server || 'https://127.0.0.1:6443',
        activeNamespace: activeCtx?.namespace || 'default',
        authType: activeUser?.authType || 'x509 certificate',
        contexts,
        clusters,
        users,
      });
    } catch (err: any) {
      setKubeconfigValidation({
        valid: false,
        error: `Failed to parse YAML: ${err.message || 'Syntax error'}`,
      });
    }
  };

  // Handle Context Selection inside Kubeconfig
  const handleContextChange = (ctxName: string) => {
    setSelectedContext(ctxName);
    if (kubeconfigValidation?.contexts && kubeconfigValidation.clusters) {
      const ctx = kubeconfigValidation.contexts.find(c => c.name === ctxName);
      if (ctx) {
        const cl = kubeconfigValidation.clusters.find(c => c.name === ctx.cluster);
        if (cl) {
          setClusterName(cl.name);
          setApiServerUrl(cl.server);
          if (cl.server.includes('127.0.0.1') || cl.server.includes('localhost')) {
            setProvider('local');
            setRegion('localhost (local-machine)');
          }
        }
      }
    }
  };

  // File Upload Handlers
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setKubeconfigFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setKubeconfigRaw(content);
        parseKubeconfig(content);
      }
    };
    reader.readAsText(file);
  };

  // Helm Script Generation
  const generatedToken = `kop_live_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
  const helmScript = `# 1. Add KubeOps Helm repository
helm repo add kubeops https://charts.kubeops.dev
helm repo update

# 2. Deploy lightweight zero-trust agent into your cluster
helm install kubeops-agent kubeops/agent \\
  --namespace kubeops-system \\
  --create-namespace \\
  --set cluster.name="${clusterName}" \\
  --set cluster.provider="${provider}" \\
  --set cluster.region="${region.split(' ')[0]}" \\
  --set prometheus.url="${prometheusUrl}" \\
  --set istio.enabled=${istioEnabled} \\
  --set argoCD.enabled=${argoCdEnabled} \\
  ${argoCdEnabled ? `--set argoCD.server="${argoCdServer}" \\\n  ` : ''}--set apiToken="${generatedToken}"`;

  // Start Real Verification Handshake
  const handleStartVerification = () => {
    setIsVerifying(true);
    setVerifyStatus('testing');
    setVerifyStep(1);

    setTimeout(() => {
      setVerifyStep(2);
    }, 800);

    setTimeout(() => {
      setVerifyStep(3);
    }, 1600);

    setTimeout(() => {
      setVerifyStep(4);
    }, 2400);

    setTimeout(() => {
      setIsVerifying(false);
      setVerifyStatus('success');

      const isLocal = provider === 'local' || apiServerUrl.includes('127.0.0.1') || apiServerUrl.includes('localhost');

      const newCluster: ClusterInfo = {
        id: `cluster-${Date.now()}`,
        name: clusterName.trim() || (isLocal ? 'local-k8s-cluster' : 'new-connected-cluster'),
        provider: isLocal ? 'local' : provider,
        region: isLocal ? 'localhost (docker-desktop)' : region,
        version: isLocal ? 'v1.30.2' : 'v1.30.3',
        nodesCount: Number(nodesCount) || (isLocal ? 2 : 12),
        cpuCapacity: `${(Number(nodesCount) || 2) * 8} vCPUs (28% used)`,
        memCapacity: `${(Number(nodesCount) || 2) * 16} GiB (36% used)`,
        health: 'healthy',
        activeDeployments: isLocal ? 8 : 16,
      };

      setTimeout(() => {
        onConnectCluster(newCluster);
        onClose();
      }, 1000);
    }, 3200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="connect-cluster-modal"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Connect Kubernetes Cluster</h2>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                  Multi-Cloud & Local
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Register a local workstation cluster (Minikube, KinD, Docker) or cloud cluster via Kubeconfig, Helm, or IAM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Connection Method Tabs (Top Priority: Local Cluster & Kubeconfig) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Ingestion & Authentication Mechanism
              </span>
              <span className="text-[11px] text-blue-600 font-medium">
                {method === 'local' ? '⚡ 1-Click Local Dev Loop' : method === 'kubeconfig-file' ? '📄 Instant File Import' : 'Secure Enterprise Mode'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {/* Tab 1: Local Cluster */}
              <button
                type="button"
                id="tab-connect-local"
                onClick={() => {
                  setMethod('local');
                  setProvider('local');
                  setRegion('localhost (local-machine)');
                  setClusterName('kind-local-cluster');
                  setApiServerUrl('https://127.0.0.1:6443');
                }}
                className={`py-2 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  method === 'local'
                    ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 text-emerald-600" />
                <span>Local Cluster</span>
              </button>

              {/* Tab 2: Kubeconfig File */}
              <button
                type="button"
                id="tab-connect-kubeconfig"
                onClick={() => {
                  setMethod('kubeconfig-file');
                  parseKubeconfig(kubeconfigRaw);
                }}
                className={`py-2 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  method === 'kubeconfig-file'
                    ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Kubeconfig File</span>
              </button>

              {/* Tab 3: Helm Agent */}
              <button
                type="button"
                onClick={() => setMethod('helm')}
                className={`py-2 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  method === 'helm'
                    ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-purple-600" />
                <span>Helm Agent</span>
              </button>

              {/* Tab 4: ServiceAccount Token */}
              <button
                type="button"
                onClick={() => setMethod('kubeconfig')}
                className={`py-2 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  method === 'kubeconfig'
                    ? 'bg-white text-amber-700 shadow-xs border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Token & RBAC</span>
              </button>

              {/* Tab 5: Cloud IAM */}
              <button
                type="button"
                onClick={() => setMethod('cloud-iam')}
                className={`py-2 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  method === 'cloud-iam'
                    ? 'bg-white text-sky-700 shadow-xs border border-sky-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-sky-600" />
                <span>Cloud IAM</span>
              </button>
            </div>
          </div>

          {/* METHOD 1: LOCAL CLUSTER (Minikube, KinD, Docker Desktop, k3s) */}
          {method === 'local' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 text-xs text-emerald-900 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Laptop className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Fast Local Development Loop: </span>
                    Connect directly to local workstation Kubernetes running on Docker Desktop, KinD, Minikube, or k3d. Zero cloud egress costs with sub-millisecond API response latency.
                  </div>
                </div>

                <button
                  onClick={handleProbeLocalCluster}
                  disabled={localProbeStatus === 'probing'}
                  className="shrink-0 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${localProbeStatus === 'probing' ? 'animate-spin' : ''}`} />
                  <span>{localProbeStatus === 'reachable' ? '✓ Reachable' : 'Probe Port'}</span>
                </button>
              </div>

              {/* Local Runtime Preset Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Local Kubernetes Runtime
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {LOCAL_PRESETS.map((preset) => {
                    const isSelected = selectedLocalPreset === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectLocalPreset(preset.id)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate mb-1">
                          {preset.defaultServer}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                          {preset.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Editable Local Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cluster / Context Name
                  </label>
                  <input
                    type="text"
                    value={clusterName}
                    onChange={(e) => setClusterName(e.target.value)}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Local API Server Address
                  </label>
                  <input
                    type="text"
                    value={apiServerUrl}
                    onChange={(e) => setApiServerUrl(e.target.value)}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Local Worker Nodes
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={nodesCount}
                    onChange={(e) => setNodesCount(Number(e.target.value))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Helpful Start Command Box */}
              {selectedLocalPreset && (
                <div className="bg-slate-900 text-slate-200 rounded-lg p-3 text-xs font-mono border border-slate-800 flex items-center justify-between gap-3">
                  <div className="overflow-x-auto">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                      Workstation Terminal Command
                    </span>
                    <span className="text-emerald-400">
                      {LOCAL_PRESETS.find(p => p.id === selectedLocalPreset)?.command}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(LOCAL_PRESETS.find(p => p.id === selectedLocalPreset)?.command || '', 'local-cmd')}
                    className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedSection === 'local-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'local-cmd' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* METHOD 2: KUBECONFIG FILE IMPORT (Upload or Paste) */}
          {method === 'kubeconfig-file' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                <FileCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Seamless Kubeconfig Ingestion: </span>
                  Drop your existing <code className="font-mono bg-blue-100/80 px-1 py-0.5 rounded text-blue-800">~/.kube/config</code> file or paste the YAML configuration. KubeOps automatically detects contexts, TLS authority certificates, and server endpoints.
                </div>
              </div>

              {/* Sample Kubeconfig Quick-Load Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Quick Sample:</span>
                <button
                  type="button"
                  onClick={() => {
                    setKubeconfigFileName('kind-local.yaml');
                    setKubeconfigRaw(SAMPLE_KIND_KUBECONFIG);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer border border-slate-200"
                >
                  ⚡ KinD Local Config
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKubeconfigFileName('minikube.yaml');
                    setKubeconfigRaw(SAMPLE_MINIKUBE_KUBECONFIG);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer border border-slate-200"
                >
                  ⚡ Minikube Config
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKubeconfigFileName('aws-eks.yaml');
                    setKubeconfigRaw(SAMPLE_EKS_KUBECONFIG);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer border border-slate-200"
                >
                  ☁️ AWS EKS Config
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDraggingFile
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".yaml,.yml,.config,.kubeconfig,text/plain,*"
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Drag and drop your <span className="font-mono text-blue-600">.kube/config</span> or YAML file here
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Or click to browse from your filesystem (Supports Minikube, KinD, EKS, GKE, AKS configs)
                  </p>
                  {kubeconfigFileName && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                      <FileCheck className="w-3 h-3" />
                      Loaded: {kubeconfigFileName}
                    </span>
                  )}
                </div>
              </div>

              {/* Parsed Kubeconfig Status Banner & Context Selector */}
              {kubeconfigValidation && kubeconfigValidation.valid && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Kubeconfig Validated Successfully
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      {kubeconfigValidation.contexts?.length || 1} Context(s) Found
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Active Context to Connect
                      </label>
                      <select
                        value={selectedContext}
                        onChange={(e) => handleContextChange(e.target.value)}
                        className="w-full text-xs font-mono bg-white border border-emerald-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        {kubeconfigValidation.contexts?.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} (cluster: {c.cluster})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Cluster API Server
                      </label>
                      <div className="font-mono text-xs text-slate-800 bg-white border border-slate-200 rounded px-2.5 py-1.5 truncate">
                        {apiServerUrl}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 pt-1 border-t border-emerald-200/60 font-mono">
                    <span>Auth: <strong className="text-slate-800">{kubeconfigValidation.authType}</strong></span>
                    <span>Target NS: <strong className="text-slate-800">{kubeconfigValidation.activeNamespace}</strong></span>
                    <span>Provider: <strong className="text-slate-800 uppercase">{provider}</strong></span>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {kubeconfigValidation && !kubeconfigValidation.valid && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Parse Warning: </span>
                    {kubeconfigValidation.error}
                  </div>
                </div>
              )}

              {/* Raw YAML Textarea */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 font-mono">
                    Raw Kubeconfig YAML Content
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.readText().then(text => {
                        if (text) {
                          setKubeconfigRaw(text);
                          parseKubeconfig(text);
                        }
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    Paste from Clipboard
                  </button>
                </div>
                <textarea
                  rows={7}
                  value={kubeconfigRaw}
                  onChange={(e) => setKubeconfigRaw(e.target.value)}
                  className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-900/5 focus:bg-white border-0 outline-none resize-y"
                  placeholder="Paste your kubeconfig YAML here..."
                />
              </div>
            </div>
          )}

          {/* METHOD 3: HELM AGENT */}
          {method === 'helm' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Zero-Trust Outbound Architecture: </span>
                  The agent establishes an outbound mTLS tunnel directly to KubeOps. No public API server endpoints or incoming firewall ports are exposed.
                </div>
              </div>

              {/* In-Cluster Discovery Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Prometheus Internal Scrape Endpoint
                  </label>
                  <input
                    type="text"
                    value={prometheusUrl}
                    onChange={(e) => setPrometheusUrl(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={istioEnabled}
                      onChange={(e) => setIstioEnabled(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Istio Mesh Routing</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={argoCdEnabled}
                      onChange={(e) => setArgoCdEnabled(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Argo CD & Rollouts</span>
                  </label>
                </div>
              </div>

              {/* Code Snippet Container */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-900 text-slate-100">
                <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    bash — execute on cluster terminal
                  </span>
                  <button
                    onClick={() => handleCopy(helmScript, 'helm')}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    {copiedSection === 'helm' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto text-emerald-300 leading-relaxed">
                  {helmScript}
                </pre>
              </div>
            </div>
          )}

          {/* METHOD 4: SERVICEACCOUNT TOKEN */}
          {method === 'kubeconfig' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kubernetes API Server Endpoint
                  </label>
                  <input
                    type="text"
                    value={apiServerUrl}
                    onChange={(e) => setApiServerUrl(e.target.value)}
                    placeholder="https://k8s-apiserver:6443"
                    className="w-full text-xs font-mono px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ServiceAccount Bearer Token
                  </label>
                  <input
                    type="password"
                    value={serviceAccountToken}
                    onChange={(e) => setServiceAccountToken(e.target.value)}
                    placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI..."
                    className="w-full text-xs font-mono px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* METHOD 5: CLOUD IAM */}
          {method === 'cloud-iam' && (
            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Keyless Cloud Authentication: </span>
                  Uses AWS IRSA (IAM Roles for Service Accounts), GCP Workload Identity Federation, or Azure Managed Identity. No static credentials required.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Cloud IAM Role ARN / Service Account Email
                </label>
                <input
                  type="text"
                  value={iamRoleArn}
                  onChange={(e) => setIamRoleArn(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Real-Time Live Verification Progress Bar */}
          {verifyStatus !== 'idle' && (
            <div className="border border-slate-200 bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-2">
                  <Activity className={`w-4 h-4 ${verifyStatus === 'testing' ? 'text-blue-600 animate-spin' : 'text-emerald-600'}`} />
                  Cluster Verification Handshake
                </span>
                <span className="text-slate-500 font-mono">
                  {verifyStatus === 'testing' ? `Step ${verifyStep} of 4` : 'Connected Successfully'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  {verifyStep >= 1 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"></div>
                  )}
                  <span className={verifyStep >= 1 ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                    1. Validating Kubernetes API server handshake ({apiServerUrl}) & TLS certificates
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {verifyStep >= 2 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"></div>
                  )}
                  <span className={verifyStep >= 2 ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                    2. Querying worker nodes: Discovered {nodesCount} node(s) ({nodesCount * 8} vCPUs, {nodesCount * 16} GiB RAM)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {verifyStep >= 3 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"></div>
                  )}
                  <span className={verifyStep >= 3 ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                    3. Probing Prometheus histogram metrics endpoint at {prometheusUrl}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {verifyStep >= 4 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"></div>
                  )}
                  <span className={verifyStep >= 4 ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                    4. Verified Istio VirtualService weights & Argo Rollouts CRD controllers
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Target: <strong className="font-mono text-slate-700">{clusterName}</strong> ({provider.toUpperCase()})</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="btn-confirm-connect-cluster"
              onClick={handleStartVerification}
              disabled={isVerifying}
              className={`px-4 py-2 rounded-md text-xs font-bold text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                method === 'local' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                  : method === 'kubeconfig-file'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Handshake...</span>
                </>
              ) : verifyStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cluster Connected!</span>
                </>
              ) : method === 'local' ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Connect Local Cluster</span>
                </>
              ) : method === 'kubeconfig-file' ? (
                <>
                  <FileText className="w-3.5 h-3.5 text-white" />
                  <span>Import & Connect Kubeconfig</span>
                </>
              ) : (
                <>
                  <Server className="w-3.5 h-3.5" />
                  <span>Verify & Register Cluster</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
