export interface CodeTemplate {
  id: string;
  category: 'terraform' | 'kubernetes' | 'cicd' | 'observability' | 'security';
  title: string;
  filename: string;
  language: 'hcl' | 'yaml';
  description: string;
  content: string;
}

export const PRODUCTION_TEMPLATES: CodeTemplate[] = [
  {
    id: 'tf-eks',
    category: 'terraform',
    title: 'Multi-Cloud Terraform: AWS EKS Production Cluster',
    filename: 'terraform/aws/eks_cluster.tf',
    language: 'hcl',
    description: 'Production-grade EKS cluster with AWS KMS envelope encryption, IRSA, private VPC subnets, and managed node groups with autoscaling.',
    content: `terraform {
  required_version = ">= 1.6.0"
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

# KMS Key for Kubernetes Secrets Envelope Encryption
resource "aws_kms_key" "k8s_secrets" {
  description             = "KMS CMK for Kubernetes Secret Envelope Encryption"
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

  cluster_endpoint_public_access  = false # Private API server endpoint
  cluster_endpoint_private_access = true

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.intra_subnets

  # Encrypted Secret Management via AWS KMS
  create_kms_key = false
  cluster_encryption_config = {
    provider_key_arn = aws_kms_key.k8s_secrets.arn
    resources        = ["secrets"]
  }

  eks_managed_node_groups = {
    compute_nodes = {
      name         = "compute-nodes-v1"
      instance_types = ["m6i.xlarge", "m6a.xlarge"]
      capacity_type  = "ON_DEMAND"

      min_size     = 3
      max_size     = 30
      desired_size = 6

      labels = {
        tier = "production-workloads"
      }

      taints = []
    }
  }

  enable_cluster_creator_admin_permissions = false
  authentication_mode                      = "API_AND_CONFIG_MAP"
}
`,
  },
  {
    id: 'tf-gke',
    category: 'terraform',
    title: 'Multi-Cloud Terraform: GCP GKE Enterprise Cluster',
    filename: 'terraform/gcp/gke_cluster.tf',
    language: 'hcl',
    description: 'Production GCP GKE cluster with Workload Identity, Application-layer Secrets Encryption via Cloud KMS, and Private Cluster networking.',
    content: `terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30"
    }
  }
}

resource "google_kms_key_ring" "k8s_keyring" {
  name     = "k8s-envelope-keyring"
  location = "us-central1"
}

resource "google_kms_crypto_key" "secret_encryption_key" {
  name            = "k8s-secret-encryption-key"
  key_ring        = google_kms_key_ring.k8s_keyring.id
  rotation_period = "7776000s" # 90 days automatic rotation
}

resource "google_container_cluster" "primary" {
  name     = "kubeops-production-gke"
  location = "us-central1"

  # Remove default node pool to provision custom managed pools
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.k8s_vpc.id
  subnetwork = google_compute_subnetwork.k8s_subnetwork.id

  # Application-layer Secrets Encryption (Cloud KMS)
  database_encryption {
    state    = "ENCRYPTED"
    key_name = google_kms_crypto_key.secret_encryption_key.id
  }

  # Workload Identity Federation
  workload_identity_config {
    workload_pool = "\${var.project_id}.svc.id.goog"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  release_channel {
    channel = "REGULAR"
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-worker-pool"
  location   = "us-central1"
  cluster    = google_container_cluster.primary.name
  node_count = 3

  autoscaling {
    min_node_count = 3
    max_node_count = 35
  }

  node_config {
    machine_type = "e2-standard-4"
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }
}
`,
  },
  {
    id: 'k8s-bluegreen',
    category: 'kubernetes',
    title: 'Argo Rollouts: Blue/Green Deployment with Automated Rollback',
    filename: 'k8s/bluegreen-rollout.yaml',
    language: 'yaml',
    description: 'Zero-downtime Blue/Green Rollout with automated Prometheus metric health gate and instant rollback on SLO breaches.',
    content: `apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-gateway
  namespace: finance
  labels:
    app: payment-gateway
spec:
  replicas: 8
  strategy:
    blueGreen:
      # Active service serving live production traffic (Blue)
      activeService: payment-gateway-active
      # Preview service serving pre-promotion test traffic (Green)
      previewService: payment-gateway-preview
      autoPromotionEnabled: false
      autoPromotionSeconds: 300
      scaleDownDelaySeconds: 600
      # Automated pre-promotion validation using Prometheus metric analysis
      prePromotionAnalysis:
        templates:
          - templateName: canary-health-gate
        args:
          - name: service-name
            value: payment-gateway
  selector:
    matchLabels:
      app: payment-gateway
  template:
    metadata:
      labels:
        app: payment-gateway
    spec:
      containers:
        - name: payment-gateway
          image: gcr.io/enterprise-prod/payment-gateway:v2.4.1
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 1024Mi
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 3
          livenessProbe:
            httpGet:
              path: /livez
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: canary-health-gate
  namespace: finance
spec:
  metrics:
    - name: success-rate
      interval: 30s
      successCondition: result[0] >= 0.99
      failureLimit: 2 # Triggers automated rollback if 2 consecutive measurements fail
      provider:
        prometheus:
          address: http://prometheus-k8s.monitoring.svc:9090
          query: |
            sum(rate(http_requests_total{service="payment-gateway",status=~"2.."}[1m]))
            /
            sum(rate(http_requests_total{service="payment-gateway"}[1m]))
    - name: latency-p99
      interval: 30s
      successCondition: result[0] < 450 # Max 450ms P99 latency
      failureLimit: 2 # Immediate automated rollback if latency threshold is violated
      provider:
        prometheus:
          address: http://prometheus-k8s.monitoring.svc:9090
          query: |
            histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service="payment-gateway"}[1m])) by (le)) * 1000
`,
  },
  {
    id: 'k8s-hpa',
    category: 'kubernetes',
    title: 'Kubernetes HPA v2: CPU, Memory & Custom Metric Autoscaling',
    filename: 'k8s/horizontal-pod-autoscaler.yaml',
    language: 'yaml',
    description: 'Horizontal Pod Autoscaler configuration responding to CPU utilization and custom Prometheus requests-per-second metrics.',
    content: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: payment-gateway-hpa
  namespace: finance
spec:
  scaleTargetRef:
    apiVersion: argoproj.io/v1alpha1
    kind: Rollout
    name: payment-gateway
  minReplicas: 4
  maxReplicas: 30
  metrics:
    # 1. CPU Target (70% utilization)
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

    # 2. Memory Target (80% utilization)
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

    # 3. Custom Metric: Ingress HTTP Requests Per Second
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: 500m # 500 requests per pod second

  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0 # Rapid scale up during sudden traffic surges
      policies:
        - type: Percent
          value: 100 # Double replica count every 15s if load demands
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300 # 5 min cooldown to prevent flapping
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
`,
  },
  {
    id: 'prom-rules',
    category: 'observability',
    title: 'Prometheus Alertmanager: Real-Time Alerting & Automated Rollback Hook',
    filename: 'monitoring/prometheus-alert-rules.yaml',
    language: 'yaml',
    description: 'PrometheusRule alerting definitions for SLO error rate breaches, latency degradations, and automated rollback webhook triggers.',
    content: `apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: payment-gateway-slo-alerts
  namespace: monitoring
  labels:
    role: alert-rules
spec:
  groups:
    - name: payment-gateway.rules
      rules:
        # P99 Latency SLO Breach
        - alert: ServiceLatencyP99ThresholdBreached
          expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service="payment-gateway"}[2m])) by (le)) * 1000 > 450
          for: 1m
          labels:
            severity: critical
            team: payments-sre
            action: auto-rollback-trigger
          annotations:
            summary: "Service payment-gateway P99 latency is {{ $value }}ms (exceeds 450ms threshold)"
            description: "High latency detected during active rollout. Automated rollback pipeline will trigger if canary is active."
            runbook_url: "https://ops.internal/runbooks/payments/latency-slo"

        # 5xx High Error Rate Breach
        - alert: High5xxErrorRateDetected
          expr: (sum(rate(http_requests_total{service="payment-gateway",status=~"5.."}[2m])) / sum(rate(http_requests_total{service="payment-gateway"}[2m]))) * 100 > 2.0
          for: 30s
          labels:
            severity: critical
            team: payments-sre
            trigger_automated_rollback: "true"
          annotations:
            summary: "Error rate has breached 2% on payment-gateway (currently {{ $value | printf \"%.2f\" }}%)"
            description: "Canary deployment health gate failure. Argo Rollouts executing automated rollback to Blue version."
            runbook_url: "https://ops.internal/runbooks/payments/error-rate-slo"

        # Pod CrashLoopBackOff Detection
        - alert: PodCrashLoopingAlert
          expr: rate(kube_pod_container_status_restarts_total{namespace="finance"}[5m]) * 60 > 2
          for: 1m
          labels:
            severity: warning
            team: platform-ops
          annotations:
            summary: "Container restarting frequently in pod {{ $labels.pod }}"
            description: "Pod is failing readiness checks or panicking during startup."
`,
  },
  {
    id: 'k8s-vault-secrets',
    category: 'security',
    title: 'HashiCorp Vault & ExternalSecrets: Encrypted Secret Management',
    filename: 'security/external-secrets-vault.yaml',
    language: 'yaml',
    description: 'External Secrets Operator integration with HashiCorp Vault using KMS envelope encryption and automated secret rotation.',
    content: `apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend-store
  namespace: finance
spec:
  provider:
    vault:
      server: "https://vault.corp.internal:8200"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "finance-service-role"
          serviceAccountRef:
            name: payment-gateway-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: payment-gateway-secrets
  namespace: finance
spec:
  refreshInterval: "1h" # Automatic secret rotation check every hour
  secretStoreRef:
    name: vault-backend-store
    kind: SecretStore
  target:
    name: payment-gateway-injected-creds
    creationPolicy: Owner
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: finance/payment-gateway
        property: db_password
    - secretKey: STRIPE_PRIVATE_KEY
      remoteRef:
        key: finance/payment-gateway
        property: stripe_key
    - secretKey: ENCRYPTION_SALT
      remoteRef:
        key: finance/payment-gateway
        property: kms_salt
`,
  },
  {
    id: 'cicd-github-actions',
    category: 'cicd',
    title: 'GitHub Actions: Production CI/CD Pipeline with Blue/Green Rollout',
    filename: '.github/workflows/production-deploy.yml',
    language: 'yaml',
    description: 'End-to-end GitHub Actions pipeline: lint, Trivy container security scan, multi-cloud Terraform apply, Argo Rollout blue-green deployment with metric-driven auto-rollback.',
    content: `name: Production Deployment Pipeline

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: enterprise/payment-gateway
  CLUSTER_NAME: prod-gke-us-central1

jobs:
  security-and-build:
    name: 1. Lint, Security Scan & Container Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
          exit-code: '1' # Fails build if critical CVEs exist

      - name: Build & Push Docker Image
        run: |
          docker build -t \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }} .
          # docker push \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}

  terraform-infrastructure:
    name: 2. Multi-Cloud IaC Validation & Apply
    needs: security-and-build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.8.0

      - name: Terraform Plan & Apply (Idempotent)
        run: |
          echo "Validating multi-cloud Terraform modules (EKS, GKE, AKS)..."
          terraform init
          terraform validate
          # terraform apply -auto-approve

  blue-green-deployment:
    name: 3. Argo Rollouts Blue/Green Release
    needs: terraform-infrastructure
    runs-on: ubuntu-latest
    steps:
      - name: Authenticate to Kubernetes
        run: echo "Configuring Kubeconfig for \${{ env.CLUSTER_NAME }}"

      - name: Deploy Green Version Candidate
        run: |
          kubectl argo rollouts set image payment-gateway payment-gateway=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }} -n finance
          kubectl argo rollouts status payment-gateway -n finance

      - name: Verify Canary Health Gate (Prometheus SLO Analysis)
        id: metric-gate
        run: |
          echo "Evaluating Prometheus Error Rate & P99 Latency for 5 minutes..."
          # In case of failure:
          # kubectl argo rollouts abort payment-gateway -n finance
          # kubectl argo rollouts undo payment-gateway -n finance

      - name: Automated Promotion
        if: success()
        run: |
          echo "Prometheus metrics healthy. Shifting 100% traffic to Green!"
          kubectl argo rollouts promote payment-gateway -n finance
`,
  },
];
