package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type PrometheusResponse struct {
	Status string `json:"status"`
	Data   struct {
		ResultType string `json:"resultType"`
		Result     []struct {
			Metric map[string]string `json:"metric"`
			Value  []interface{}     `json:"value,omitempty"`
			Values [][]interface{}   `json:"values,omitempty"`
		} `json:"result"`
	} `json:"data"`
}

type TelemetryService struct {
	prometheusURL string
	httpClient    *http.Client
}

func NewTelemetryService(prometheusURL string) *TelemetryService {
	return &TelemetryService{
		prometheusURL: prometheusURL,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// QueryPrometheusQL executes PromQL queries against Prometheus API
func (s *TelemetryService) QueryPrometheusQL(promql string) (*PrometheusResponse, error) {
	reqURL := fmt.Sprintf("%s/api/v1/query?query=%s", s.prometheusURL, url.QueryEscape(promql))
	resp, err := s.httpClient.Get(reqURL)
	if err != nil {
		return nil, fmt.Errorf("prometheus query failed: %w", err)
	}
	defer resp.Body.Close()

	var result PrometheusResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "50052"
	}
	promURL := os.Getenv("PROMETHEUS_URL")
	if promURL == "" {
		promURL = "http://prometheus-k8s.monitoring.svc:9090"
	}

	lis, err := net.Listen("tcp", fmt.Sprintf("0.0.0.0:%s", port))
	if err != nil {
		log.Fatalf("Failed to listen on port %s: %v", port, err)
	}

	grpcServer := grpc.NewServer()
	reflection.Register(grpcServer)

	telemetry := NewTelemetryService(promURL)
	_ = telemetry

	log.Printf("📊 KubeOps Telemetry & Prometheus Aggregator (Go) listening on gRPC :%s", port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC: %v", err)
	}
}
