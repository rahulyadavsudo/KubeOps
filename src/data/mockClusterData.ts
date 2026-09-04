import { ClusterInfo, ServiceDeployment, PrometheusAlert, LogEntry, RbacRole, EncryptedSecret, TerraformTemplate } from '../types';

export const INITIAL_CLUSTERS: ClusterInfo[] = [
  {
    id: 'gke-us-central1-prod',
    name: 'prod-gke-us-central1',
    provider: 'gcp',
    region: 'us-central1 (Iowa)',
    version: 'v1.30.2-gke.1500',
    nodesCount: 18,
    cpuCapacity: '144 vCPUs (62% used)',
    memCapacity: '576 GiB (68% used)',
    health: 'healthy',
    activeDeployments: 24,
  },
  {
    id: 'eks-eu-west1-prod',
    name: 'prod-eks-eu-west1',
    provider: 'aws',
    region: 'eu-west-1 (Ireland)',
    version: 'v1.30.1-eks',
    nodesCount: 12,
    cpuCapacity: '96 vCPUs (54% used)',
    memCapacity: '384 GiB (59% used)',
    health: 'healthy',
    activeDeployments: 18,
  },
  {
    id: 'aks-eastus-prod',
    name: 'prod-aks-eastus2',
    provider: 'azure',
    region: 'eastus2 (Virginia)',
    version: 'v1.29.7-aks',
    nodesCount: 8,
    cpuCapacity: '64 vCPUs (48% used)',
    memCapacity: '256 GiB (51% used)',
    health: 'healthy',
    activeDeployments: 12,
  },
];

export const INITIAL_SERVICES: ServiceDeployment[] = [
  {
    id: 'svc-payment-api',
    name: 'payment-gateway',
    namespace: 'finance',
    clusterId: 'gke-us-central1-prod',
    strategy: 'blue-green',
    blueVersion: 'v2.4.0',
    greenVersion: 'v2.4.1-rc3',
    trafficSplit: 15, // 15% to Green, 85% to Blue
    status: 'verifying',
    currentReplicas: 8,
    minReplicas: 4,
    maxReplicas: 30,
    targetCpuPercent: 70,
    currentCpuPercent: 62,
    targetRps: 2500,
    currentRps: 1840,
    latencyP50: 18,
    latencyP95: 42,
    latencyP99: 110,
    errorRate: 0.08,
    autoRollbackEnabled: true,
    rollbackThresholdErrorRate: 2.0,
    rollbackThresholdLatencyP99: 450,
    lastDeployedAt: 'Just now (Canary Evaluation)',
  },
  {
    id: 'svc-orders-core',
    name: 'orders-service',
    namespace: 'checkout',
    clusterId: 'gke-us-central1-prod',
    strategy: 'blue-green',
    blueVersion: 'v3.1.2',
    greenVersion: 'v3.1.2',
    trafficSplit: 0,
    status: 'stable',
    currentReplicas: 6,
    minReplicas: 3,
    maxReplicas: 24,
    targetCpuPercent: 75,
    currentCpuPercent: 48,
    targetRps: 1800,
    currentRps: 940,
    latencyP50: 12,
    latencyP95: 28,
    latencyP99: 72,
    errorRate: 0.02,
    autoRollbackEnabled: true,
    rollbackThresholdErrorRate: 1.5,
    rollbackThresholdLatencyP99: 380,
    lastDeployedAt: '2 hours ago',
  },
  {
    id: 'svc-auth-edge',
    name: 'auth-tokens-v2',
    namespace: 'security',
    clusterId: 'gke-us-central1-prod',
    strategy: 'rolling',
    blueVersion: 'v1.9.8',
    greenVersion: 'v1.9.8',
    trafficSplit: 0,
    status: 'stable',
    currentReplicas: 10,
    minReplicas: 6,
    maxReplicas: 40,
    targetCpuPercent: 65,
    currentCpuPercent: 53,
    targetRps: 4200,
    currentRps: 3100,
    latencyP50: 8,
    latencyP95: 19,
    latencyP99: 45,
    errorRate: 0.01,
    autoRollbackEnabled: true,
    rollbackThresholdErrorRate: 1.0,
    rollbackThresholdLatencyP99: 250,
    lastDeployedAt: 'Yesterday',
  },
  {
    id: 'svc-inventory-db',
    name: 'inventory-query-cache',
    namespace: 'logistics',
    clusterId: 'gke-us-central1-prod',
    strategy: 'blue-green',
    blueVersion: 'v4.0.1',
    greenVersion: 'v4.0.2',
    trafficSplit: 0,
    status: 'stable',
    currentReplicas: 5,
    minReplicas: 3,
    maxReplicas: 20,
    targetCpuPercent: 80,
    currentCpuPercent: 41,
    targetRps: 1200,
    currentRps: 620,
    latencyP50: 14,
    latencyP95: 35,
    latencyP99: 88,
    errorRate: 0.04,
    autoRollbackEnabled: true,
    rollbackThresholdErrorRate: 2.5,
    rollbackThresholdLatencyP99: 500,
    lastDeployedAt: '4 hours ago',
  },
];

export const INITIAL_ALERTS: PrometheusAlert[] = [
  {
    id: 'alert-prom-01',
    name: 'KubernetesHpaMaxedOutWarning',
    severity: 'warning',
    service: 'payment-gateway',
    namespace: 'finance',
    state: 'pending',
    summary: 'HPA nearing maximum replica ceiling (8/30 pods)',
    description: 'HPA payment-gateway-hpa has scaled to 27% of its ceiling. Monitoring traffic surge headroom.',
    query: 'sum(kube_hpa_status_current_replicas{hpa="payment-gateway-hpa"}) / sum(kube_hpa_spec_max_replicas) > 0.8',
    triggeredAt: '5m ago',
    runbookUrl: 'https://runbooks.corp.internal/k8s/hpa-scaling-runbook',
  },
  {
    id: 'alert-prom-02',
    name: 'IstioCanaryErrorRateWatch',
    severity: 'info',
    service: 'payment-gateway',
    namespace: 'finance',
    state: 'resolved',
    summary: 'Blue/Green canary error rate within SLO (< 0.5%)',
    description: 'Current 5xx rate on green canary pods is 0.08% against automated rollback threshold of 2.0%.',
    query: 'sum(rate(istio_requests_total{response_code=~"5.*",destination_version="v2.4.1-rc3"}[5m])) / sum(rate(istio_requests_total[5m])) * 100 > 2.0',
    triggeredAt: '12m ago',
  },
  {
    id: 'alert-prom-03',
    name: 'PodMemoryHighWatermark',
    severity: 'warning',
    service: 'orders-service',
    namespace: 'checkout',
    state: 'firing',
    summary: 'Memory usage exceeds 85% on 2 pods in checkout namespace',
    description: 'container_memory_working_set_bytes exceeding memory limits request. Risk of OOMKill under load spike.',
    query: 'container_memory_working_set_bytes{namespace="checkout"} / container_spec_memory_limit_bytes > 0.85',
    triggeredAt: '2m ago',
    runbookUrl: 'https://runbooks.corp.internal/k8s/oom-prevention',
  },
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-01',
    timestamp: '2026-09-04T02:35:12.102Z',
    level: 'INFO',
    service: 'payment-gateway',
    pod: 'payment-gateway-green-7f98b5-x8q1',
    namespace: 'finance',
    traceId: 'trace-98f1-a83d1c',
    message: 'HTTP/2 200 POST /v1/charges 14ms (provider: stripe_direct, status: settled)',
  },
  {
    id: 'log-02',
    timestamp: '2026-09-04T02:35:14.412Z',
    level: 'INFO',
    service: 'payment-gateway',
    pod: 'payment-gateway-blue-58d3c1-k9v2',
    namespace: 'finance',
    traceId: 'trace-41b2-c0119e',
    message: 'Istio VirtualService router shifted canary weight to 15% Green, 85% Blue',
  },
  {
    id: 'log-03',
    timestamp: '2026-09-04T02:35:17.881Z',
    level: 'WARN',
    service: 'payment-gateway',
    pod: 'payment-gateway-green-7f98b5-w3p9',
    namespace: 'finance',
    traceId: 'trace-66e4-f2a890',
    message: 'Vault lease auto-renewed for database credential secret/data/finance/rds-creds (TTL: 3600s)',
  },
  {
    id: 'log-04',
    timestamp: '2026-09-04T02:35:20.005Z',
    level: 'INFO',
    service: 'orders-service',
    pod: 'orders-service-679df2-mn78',
    namespace: 'checkout',
    traceId: 'trace-11cc-77a8b3',
    message: 'HPA Controller evaluated metric: cpu_utilization=48%, target=75%. Scaling decision: no-op',
  },
  {
    id: 'log-05',
    timestamp: '2026-09-04T02:35:23.512Z',
    level: 'DEBUG',
    service: 'auth-tokens-v2',
    pod: 'auth-tokens-v2-44a19b-pq01',
    namespace: 'security',
    traceId: 'trace-8899-dd2341',
    message: 'RSA256 JWKS key rotation cache valid. Next JWKS refresh in 1420s',
  },
];

export const INITIAL_RBAC_ROLES: RbacRole[] = [
  {
    id: 'role-1',
    name: 'cluster-admin-enterprise',
    kind: 'ClusterRole',
    subjects: ['sre-lead-engineers', 'platform-admins'],
    rules: [
      {
        apiGroups: ['*'],
        resources: ['*'],
        verbs: ['*'],
      },
    ],
    bindings: [
      {
        subjectKind: 'Group',
        subjectName: 'sre-lead-engineers',
        roleBindingName: 'cluster-admin-sre-binding',
      },
    ],
  },
  {
    id: 'role-2',
    name: 'cicd-deployer-restricted',
    kind: 'ClusterRole',
    subjects: ['github-actions-runner-sa', 'argo-rollouts-controller'],
    rules: [
      {
        apiGroups: ['apps', 'argoproj.io', 'flagger.app'],
        resources: ['deployments', 'rollouts', 'canaries', 'services'],
        verbs: ['get', 'list', 'watch', 'create', 'update', 'patch'],
      },
      {
        apiGroups: ['autoscaling'],
        resources: ['horizontalpodautoscalers'],
        verbs: ['get', 'list', 'watch', 'update', 'patch'],
      },
    ],
    bindings: [
      {
        subjectKind: 'ServiceAccount',
        subjectName: 'github-actions-runner-sa',
        roleBindingName: 'cicd-deployer-binding',
      },
    ],
  },
  {
    id: 'role-3',
    name: 'developer-read-only',
    kind: 'Role',
    namespace: 'finance',
    subjects: ['finance-app-developers'],
    rules: [
      {
        apiGroups: ['', 'apps'],
        resources: ['pods', 'pods/log', 'services', 'deployments'],
        verbs: ['get', 'list', 'watch'],
      },
      {
        apiGroups: [''],
        resources: ['secrets'],
        verbs: [], // Strict zero-access to secrets
      },
    ],
    bindings: [
      {
        subjectKind: 'Group',
        subjectName: 'finance-app-developers',
        roleBindingName: 'finance-dev-read-only-binding',
      },
    ],
  },
];

export const INITIAL_SECRETS: EncryptedSecret[] = [
  {
    id: 'sec-01',
    name: 'vault-payment-gateway-credentials',
    namespace: 'finance',
    engine: 'HashiCorp Vault',
    encryptionType: 'KMS-Envelope-AES-GCM-256',
    vaultPath: 'secret/data/finance/payment-gateway-creds',
    kmsKeyId: 'arn:aws:kms:us-central1:9876543210:key/k8s-envelope-vault-cmk',
    lastRotated: '2 days ago',
    rotationIntervalDays: 30,
    keysCount: 3,
    syncStatus: 'Synced',
    version: 'v8',
    keys: [
      { key: 'STRIPE_API_SECRET', maskedValue: '••••••••••••••••••••', rawSample: 'sk_live_51M0...99xQ' },
      { key: 'DB_PASSWORD_ENCRYPTED', maskedValue: '••••••••••••••••••••', rawSample: 'pg_sec_k9!8xPq' },
      { key: 'HMAC_WEBHOOK_KEY', maskedValue: '••••••••••••••••••••', rawSample: 'whsec_99a8x01ff2' },
    ]
  },
  {
    id: 'sec-02',
    name: 'orders-db-sealedsecret',
    namespace: 'checkout',
    engine: 'SealedSecrets',
    encryptionType: 'RSA-4096-OAEP-SHA256',
    vaultPath: 'sealedsecrets.bitnami.com/checkout/orders-db',
    kmsKeyId: 'projects/enterprise-k8s-prod/locations/global/keyRings/gitops/cryptoKeys/sealed-secrets-rsa',
    lastRotated: '14 days ago',
    rotationIntervalDays: 90,
    keysCount: 2,
    syncStatus: 'Synced',
    version: 'v12',
    keys: [
      { key: 'POSTGRES_USER', maskedValue: '••••••••••••', rawSample: 'order_app_admin' },
      { key: 'POSTGRES_PASS', maskedValue: '••••••••••••••••••••', rawSample: 'pg_pass_9921_prod!' },
    ]
  },
  {
    id: 'sec-03',
    name: 'external-secrets-jwt-signing',
    namespace: 'security',
    engine: 'AWS Secrets Manager',
    encryptionType: 'AWS-KMS-CMK-Envelope',
    vaultPath: 'aws/secretsmanager/us-east-1/jwt-private-key',
    kmsKeyId: 'alias/k8s-jwt-signing-key-prod',
    lastRotated: '5 hours ago',
    rotationIntervalDays: 7,
    keysCount: 2,
    syncStatus: 'Synced',
    version: 'v24',
    keys: [
      { key: 'RSA_PRIVATE_KEY_PEM', maskedValue: '••••••••••••••••••••', rawSample: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...' },
      { key: 'TOKEN_ISSUER', maskedValue: '••••••••••••••••', rawSample: 'https://auth.kubeops.enterprise' },
    ]
  },
];

export const INITIAL_TERRAFORM_TEMPLATES: TerraformTemplate[] = [
  {
    id: 'tf-eks',
    name: 'AWS EKS Production Cluster',
    provider: 'aws',
    filename: 'terraform/aws/eks_cluster.tf',
    description: 'Production EKS 1.30 with KMS secret envelope encryption, Karpenter autoscaling, and private subnets.',
    code: `terraform {
  required_version = ">= 1.8.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# KMS Customer Managed Key for Kubernetes Secrets Encryption
resource "aws_kms_key" "k8s_secrets" {
  description             = "KMS CMK for EKS Secret Envelope Encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "kubeops-production-us-east-1"
  cluster_version = "1.30"

  cluster_endpoint_public_access  = false
  cluster_endpoint_private_access = true

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.intra_subnets

  cluster_encryption_config = {
    provider_key_arn = aws_kms_key.k8s_secrets.arn
    resources        = ["secrets"]
  }

  eks_managed_node_groups = {
    core_workers = {
      min_size     = 3
      max_size     = 50
      desired_size = 8
      instance_types = ["m6i.xlarge", "m6a.xlarge"]
      capacity_type  = "ON_DEMAND"
    }
  }
}`
  },
  {
    id: 'tf-gke',
    name: 'GCP GKE Autopilot Cluster',
    provider: 'gcp',
    filename: 'terraform/gcp/gke_autopilot.tf',
    description: 'Enterprise GKE with Cloud KMS Database Encryption, Workload Identity Federation, and Private Nodes.',
    code: `terraform {
  required_version = ">= 1.8.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30"
    }
  }
}

resource "google_kms_crypto_key" "gke_secrets_key" {
  name            = "gke-envelope-encryption-key"
  key_ring        = google_kms_key_ring.keyring.id
  rotation_period = "2592000s" # 30 days
}

resource "google_container_cluster" "primary" {
  name     = "kubeops-gke-us-central1"
  location = "us-central1"

  enable_autopilot = true

  database_encryption {
    state    = "ENCRYPTED"
    key_name = google_kms_crypto_key.gke_secrets_key.id
  }

  network    = google_compute_network.custom.name
  subnetwork = google_compute_subnetwork.custom.name

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  workload_identity_config {
    workload_pool = "\${var.project_id}.svc.id.goog"
  }
}`
  },
  {
    id: 'tf-aks',
    name: 'Azure AKS Enterprise Cluster',
    provider: 'azure',
    filename: 'terraform/azure/aks_cluster.tf',
    description: 'Azure Kubernetes Service with Azure Key Vault KMS encryption, Azure CNI, and managed identity.',
    code: `terraform {
  required_version = ">= 1.8.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
  }
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = "kubeops-aks-eastus"
  location            = "East US"
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "kubeops-prod"
  kubernetes_version  = "1.30"

  default_node_pool {
    name                = "systempool"
    node_count          = 3
    vm_size             = "Standard_D4s_v5"
    enable_auto_scaling = true
    min_count           = 3
    max_count           = 30
  }

  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  network_profile {
    network_plugin    = "azure"
    load_balancer_sku = "standard"
  }
}`
  },
  {
    id: 'tf-mesh',
    name: 'Multi-Cloud Istio Service Mesh',
    provider: 'multi-cloud',
    filename: 'terraform/helm/istio_service_mesh.tf',
    description: 'Istio Service Mesh Helm deployment configuring zero-downtime Blue-Green traffic routing rules.',
    code: `resource "helm_release" "istio_base" {
  name             = "istio-base"
  repository       = "https://istio-release.storage.googleapis.com/charts"
  chart            = "base"
  namespace        = "istio-system"
  create_namespace = true
}

resource "helm_release" "istiod" {
  name       = "istiod"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "istiod"
  namespace  = "istio-system"

  set {
    name  = "meshConfig.enablePrometheusMerge"
    value = "true"
  }

  depends_on = [helm_release.istio_base]
}`
  }
];

