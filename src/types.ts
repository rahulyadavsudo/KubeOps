export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'local';

export interface ClusterInfo {
  id: string;
  name: string;
  provider: CloudProvider;
  region: string;
  version: string;
  nodesCount: number;
  cpuCapacity: string;
  memCapacity: string;
  health: 'healthy' | 'warning' | 'critical';
  activeDeployments: number;
}

export type DeploymentStrategy = 'blue-green' | 'canary' | 'rolling';

export interface ServiceDeployment {
  id: string;
  name: string;
  namespace: string;
  clusterId: string;
  strategy: DeploymentStrategy;
  blueVersion: string;
  greenVersion: string;
  trafficSplit: number; // 0 to 100 (% routed to Green)
  status: 'stable' | 'deploying' | 'verifying' | 'rolling-back' | 'promoted' | 'failed';
  currentReplicas: number;
  minReplicas: number;
  maxReplicas: number;
  targetCpuPercent: number;
  currentCpuPercent: number;
  targetRps: number;
  currentRps: number;
  latencyP50: number; // ms
  latencyP95: number; // ms
  latencyP99: number; // ms
  errorRate: number; // percentage e.g. 0.12%
  autoRollbackEnabled: boolean;
  rollbackThresholdErrorRate: number; // e.g. 2.0%
  rollbackThresholdLatencyP99: number; // e.g. 450ms
  lastRollbackReason?: string;
  lastDeployedAt: string;
}

export interface PipelineStage {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'success' | 'failed' | 'skipped';
  duration?: string;
  details: string;
  iconName: string;
}

export interface MetricDataPoint {
  timestamp: string;
  time: string;
  p50: number;
  p95: number;
  p99: number;
  rps: number;
  errorRate: number;
  cpuPercent: number;
  memPercent: number;
  replicas: number;
}

export interface PrometheusAlert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  service: string;
  namespace: string;
  state: 'firing' | 'pending' | 'resolved';
  summary: string;
  description: string;
  query: string;
  triggeredAt: string;
  runbookUrl?: string;
  silenced?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  pod: string;
  namespace: string;
  traceId: string;
  message: string;
}

export interface RbacRole {
  id?: string;
  name: string;
  kind: 'ClusterRole' | 'Role';
  namespace?: string;
  subjects?: string[];
  rules: {
    apiGroups?: string[];
    resources: string[];
    verbs: string[];
  }[];
  bindings?: {
    subjectKind: 'User' | 'Group' | 'ServiceAccount';
    subjectName: string;
    roleBindingName: string;
  }[];
}

export interface EncryptedSecret {
  id?: string;
  name: string;
  namespace: string;
  engine?: 'HashiCorp Vault' | 'AWS Secrets Manager' | 'GCP Secret Manager' | 'SealedSecrets';
  encryptionType?: string;
  vaultPath?: string;
  kmsKeyId: string;
  lastRotated: string;
  rotationIntervalDays?: number;
  keysCount?: number;
  syncStatus?: 'Synced' | 'Synchronizing' | 'Error';
  version?: string;
  keys?: {
    key: string;
    maskedValue: string;
    rawSample: string;
  }[];
}

export interface TerraformTemplate {
  id: string;
  name: string;
  provider: 'aws' | 'gcp' | 'azure' | 'multi-cloud';
  filename: string;
  description: string;
  code: string;
}
