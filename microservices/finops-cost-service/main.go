package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type CostSummary struct {
	MonthlySpendTotal float64            `json:"monthly_spend_total"`
	DailyRunRate      float64            `json:"daily_run_rate"`
	WastedIdleSpend   float64            `json:"wasted_idle_spend"`
	PotentialSavings  float64            `json:"potential_savings_pct"`
	Currency          string             `json:"currency"`
	ProvidersBreakdown map[string]float64 `json:"providers_breakdown"`
	NamespaceCost     []NamespaceCost    `json:"namespace_cost"`
	RightsizingAdvice []RightsizingItem  `json:"rightsizing_advice"`
}

type NamespaceCost struct {
	Namespace    string  `json:"namespace"`
	MonthlyCost  float64 `json:"monthly_cost"`
	CpuCost      float64 `json:"cpu_cost"`
	RamCost      float64 `json:"ram_cost"`
	EgressCost   float64 `json:"egress_cost"`
	EfficiencyPct float64 `json:"efficiency_pct"`
}

type RightsizingItem struct {
	WorkloadName    string  `json:"workload_name"`
	Namespace       string  `json:"namespace"`
	CurrentCpu      string  `json:"current_cpu"`
	RecommendedCpu  string  `json:"recommended_cpu"`
	CurrentRam      string  `json:"current_ram"`
	RecommendedRam  string  `json:"recommended_ram"`
	EstimatedSaving float64 `json:"estimated_monthly_saving"`
	Action          string  `json:"action"` // SCALE_DOWN_REQUEST, CONSOLIDATE_NODE, HPA_TUNE
}

func getFinOpsSnapshot() CostSummary {
	return CostSummary{
		MonthlySpendTotal: 3420.50,
		DailyRunRate:      114.01,
		WastedIdleSpend:   845.20,
		PotentialSavings:  24.7,
		Currency:          "USD",
		ProvidersBreakdown: map[string]float64{
			"aws-eks":  1890.00,
			"gcp-gke":  1240.50,
			"azure-aks": 290.00,
		},
		NamespaceCost: []NamespaceCost{
			{Namespace: "production", MonthlyCost: 2120.00, CpuCost: 1450.00, RamCost: 520.00, EgressCost: 150.00, EfficiencyPct: 84.5},
			{Namespace: "staging", MonthlyCost: 680.00, CpuCost: 410.00, RamCost: 210.00, EgressCost: 60.00, EfficiencyPct: 58.2},
			{Namespace: "kube-system", MonthlyCost: 380.00, CpuCost: 240.00, RamCost: 120.00, EgressCost: 20.00, EfficiencyPct: 91.0},
			{Namespace: "monitoring", MonthlyCost: 240.50, CpuCost: 150.00, RamCost: 75.50, EgressCost: 15.00, EfficiencyPct: 76.0},
		},
		RightsizingAdvice: []RightsizingItem{
			{
				WorkloadName:    "payment-gateway-worker",
				Namespace:       "production",
				CurrentCpu:      "2000m",
				RecommendedCpu:  "650m",
				CurrentRam:      "4096Mi",
				RecommendedRam:  "1536Mi",
				EstimatedSaving: 142.50,
				Action:          "SCALE_DOWN_REQUEST",
			},
			{
				WorkloadName:    "logging-fluentd-collector",
				Namespace:       "kube-system",
				CurrentCpu:      "1000m",
				RecommendedCpu:  "250m",
				CurrentRam:      "2048Mi",
				RecommendedRam:  "512Mi",
				EstimatedSaving: 88.00,
				Action:          "CONSOLIDATE_NODE",
			},
			{
				WorkloadName:    "analytics-reporting-cron",
				Namespace:       "staging",
				CurrentCpu:      "1500m",
				RecommendedCpu:  "400m",
				CurrentRam:      "3072Mi",
				RecommendedRam:  "1024Mi",
				EstimatedSaving: 115.20,
				Action:          "HPA_TUNE",
			},
		},
	}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "50056"
	}
	httpPort := os.Getenv("HTTP_PORT")
	if httpPort == "" {
		httpPort = "8056"
	}

	// Launch HTTP endpoint for REST clients
	go func() {
		http.HandleFunc("/api/v1/finops/summary", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(getFinOpsSnapshot())
		})
		http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"status":"ok","service":"finops-cost-service-go"}`))
		})
		log.Printf("💰 FinOps Cost Service HTTP REST listening on :%s", httpPort)
		if err := http.ListenAndServe("0.0.0.0:"+httpPort, nil); err != nil {
			log.Printf("FinOps HTTP server error: %v", err)
		}
	}()

	// gRPC server setup
	lis, err := net.Listen("tcp", fmt.Sprintf("0.0.0.0:%s", port))
	if err != nil {
		log.Fatalf("Failed to listen on gRPC port %s: %v", port, err)
	}

	grpcServer := grpc.NewServer()
	reflection.Register(grpcServer)

	log.Printf("💵 KubeOps FinOps & K8s Cost Allocation Microservice (Go) listening on gRPC :%s", port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC: %v", err)
	}
}
