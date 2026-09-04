use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::RwLock;
use warp::Filter;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EbpfFlowEvent {
    pub id: String,
    pub timestamp: String,
    pub source_pod: String,
    pub source_ip: String,
    pub dest_ip: String,
    pub dest_port: u16,
    pub protocol: String,
    pub decision: String, // ALLOW, DROP, AUDIT
    pub reason: String,
    pub syscall: String, // sys_enter_connect, tcp_v4_connect, bpf_prog_run
    pub latency_us: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SecurityPolicyRule {
    pub id: String,
    pub name: String,
    pub namespace: String,
    pub ingress_action: String,
    pub egress_action: String,
    pub enforce_tls: bool,
    pub block_privileged_escalation: bool,
    pub enabled: bool,
}

#[derive(Clone)]
pub struct EbpfInspectorState {
    pub events: Arc<RwLock<Vec<EbpfFlowEvent>>>,
    pub policies: Arc<RwLock<Vec<SecurityPolicyRule>>>,
    pub dropped_packets_total: Arc<RwLock<u64>>,
}

#[tokio::main]
async fn main() {
    println!("🦀 Starting KubeOps eBPF Network Security Inspector (Rust / aya-bpf)...");

    let initial_events = vec![
        EbpfFlowEvent {
            id: "flow-101".to_string(),
            timestamp: Utc::now().to_rfc3339(),
            source_pod: "ingress-nginx-controller-74f".to_string(),
            source_ip: "10.244.0.15".to_string(),
            dest_ip: "10.244.1.42".to_string(),
            dest_port: 8080,
            protocol: "TCP/mTLS".to_string(),
            decision: "ALLOW".to_string(),
            reason: "Valid Istio SPIFFE identity (cluster.local/ns/default/sa/web)".to_string(),
            syscall: "tcp_v4_connect".to_string(),
            latency_us: 42,
        },
        EbpfFlowEvent {
            id: "flow-102".to_string(),
            timestamp: Utc::now().to_rfc3339(),
            source_pod: "rogue-batch-worker-99x".to_string(),
            source_ip: "10.244.2.88".to_string(),
            dest_ip: "169.254.169.254".to_string(), // AWS/GCP IMDS metadata endpoint
            dest_port: 80,
            protocol: "HTTP".to_string(),
            decision: "DROP".to_string(),
            reason: "Kernel hook XDP dropped unauthorized cloud metadata IMDS exfiltration (MITRE T1552)".to_string(),
            syscall: "sys_enter_connect".to_string(),
            latency_us: 3,
        },
        EbpfFlowEvent {
            id: "flow-103".to_string(),
            timestamp: Utc::now().to_rfc3339(),
            source_pod: "payment-gateway-canary-v241".to_string(),
            source_ip: "10.244.1.9".to_string(),
            dest_ip: "10.244.3.12".to_string(),
            dest_port: 5432,
            protocol: "TCP/Postgres".to_string(),
            decision: "ALLOW".to_string(),
            reason: "Whitelisted database socket pool".to_string(),
            syscall: "tcp_v4_connect".to_string(),
            latency_us: 18,
        },
    ];

    let state = EbpfInspectorState {
        events: Arc::new(RwLock::new(initial_events)),
        policies: Arc::new(RwLock::new(vec![
            SecurityPolicyRule {
                id: "cilium-imds-block".to_string(),
                name: "Block Cloud IMDS Metadata (169.254.169.254)".to_string(),
                namespace: "all".to_string(),
                ingress_action: "ALLOW".to_string(),
                egress_action: "DROP".to_string(),
                enforce_tls: false,
                block_privileged_escalation: true,
                enabled: true,
            },
            SecurityPolicyRule {
                id: "cilium-strict-mtls".to_string(),
                name: "Enforce Istio Strict mTLS (eBPF Sockops)".to_string(),
                namespace: "production".to_string(),
                ingress_action: "REQUIRE_MTLS".to_string(),
                egress_action: "ALLOW".to_string(),
                enforce_tls: true,
                block_privileged_escalation: false,
                enabled: true,
            },
        ])),
        dropped_packets_total: Arc::new(RwLock::new(1492)),
    };

    let state_filter = warp::any().map(move || state.clone());

    // GET /api/v1/ebpf/flows
    let flows_route = warp::path!("api" / "v1" / "ebpf" / "flows")
        .and(warp::get())
        .and(state_filter.clone())
        .and_then(|st: EbpfInspectorState| async move {
            let events = st.events.read().await;
            let dropped = *st.dropped_packets_total.read().await;
            Ok::<_, warp::Rejection>(warp::reply::json(&serde_json::json!({
                "status": "active",
                "kernel_probe": "kprobe:tcp_v4_connect + XDP socket filter",
                "total_dropped_packets": dropped,
                "flows": *events,
            })))
        });

    let health_route = warp::path!("healthz")
        .and(warp::get())
        .map(|| warp::reply::json(&serde_json::json!({"status": "ok", "service": "ebpf-security-rust"})));

    let routes = flows_route.or(health_route);
    let addr: SocketAddr = "0.0.0.0:50055".parse().unwrap();
    println!("🛡️ Rust eBPF Security Service listening on http://{}", addr);
    warp::serve(routes).run(addr).await;
}
