package main

import (
	"bytes"
	"context"
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

type ArgoRolloutController struct {
	argoCDServer string
	argoToken    string
	httpClient   *http.Client
}

func NewArgoRolloutController(server, token string) *ArgoRolloutController {
	return &ArgoRolloutController{
		argoCDServer: server,
		argoToken:    token,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// TriggerArgoSync triggers an automated GitOps reconciliation
func (c *ArgoRolloutController) TriggerArgoSync(ctx context.Context, appName string) error {
	syncURL := fmt.Sprintf("%s/api/v1/applications/%s/sync", c.argoCDServer, appName)
	payload := map[string]interface{}{
		"revision": "HEAD",
		"prune":    true,
		"strategy": map[string]interface{}{
			"apply": map[string]interface{}{
				"force": false,
			},
		},
	}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, "POST", syncURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.argoToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("argo sync request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("argo sync responded with status: %s", resp.Status)
	}

	log.Printf("[ArgoController] Application %s sync triggered successfully", appName)
	return nil
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "50053"
	}
	argoServer := os.Getenv("ARGOCD_SERVER")
	if argoServer == "" {
		argoServer = "https://argocd.company.internal"
	}
	argoToken := os.Getenv("ARGOCD_AUTH_TOKEN")

	lis, err := net.Listen("tcp", fmt.Sprintf("0.0.0.0:%s", port))
	if err != nil {
		log.Fatalf("Failed to listen on port %s: %v", port, err)
	}

	grpcServer := grpc.NewServer()
	reflection.Register(grpcServer)

	controller := NewArgoRolloutController(argoServer, argoToken)
	_ = controller

	log.Printf("🚢 KubeOps Argo CD & Rollout Orchestrator (Go) listening on gRPC :%s", port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC: %v", err)
	}
}
