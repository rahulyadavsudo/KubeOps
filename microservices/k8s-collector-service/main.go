package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/informers"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/tools/clientcmd"
)

// ClusterCollectorServer implements gRPC ClusterCollectorService
type ClusterCollectorServer struct {
	clientset *kubernetes.Clientset
	informer  informers.SharedInformerFactory
}

func NewClusterCollectorServer() (*ClusterCollectorServer, error) {
	var config *rest.Config
	var err error

	// Try in-cluster config first, then fallback to kubeconfig file
	config, err = rest.InClusterConfig()
	if err != nil {
		kubeconfig := os.Getenv("KUBECONFIG")
		if kubeconfig == "" {
			kubeconfig = os.Getenv("HOME") + "/.kube/config"
		}
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			log.Printf("Warning: Running in simulation mode (cannot load k8s config: %v)", err)
			return &ClusterCollectorServer{}, nil
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes clientset: %w", err)
	}

	informerFactory := informers.NewSharedInformerFactory(clientset, time.Minute*10)

	server := &ClusterCollectorServer{
		clientset: clientset,
		informer:  informerFactory,
	}

	// Setup Pod informer with event handlers for instant telemetry
	podInformer := informerFactory.Core().V1().Pods().Informer()
	podInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			pod := obj.(*corev1.Pod)
			log.Printf("[Collector] Pod ADDED: %s/%s (Phase: %s)", pod.Namespace, pod.Name, pod.Status.Phase)
		},
		UpdateFunc: func(oldObj, newObj interface{}) {
			oldPod := oldObj.(*corev1.Pod)
			newPod := newObj.(*corev1.Pod)
			if oldPod.Status.Phase != newPod.Status.Phase {
				log.Printf("[Collector] Pod STATUS CHANGE: %s/%s -> %s", newPod.Namespace, newPod.Name, newPod.Status.Phase)
			}
		},
		DeleteFunc: func(obj interface{}) {
			pod := obj.(*corev1.Pod)
			log.Printf("[Collector] Pod DELETED: %s/%s", pod.Namespace, pod.Name)
		},
	})

	stopCh := make(chan struct{})
	informerFactory.Start(stopCh)
	informerFactory.WaitForCacheSync(stopCh)

	return server, nil
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "50051"
	}

	lis, err := net.Listen("tcp", fmt.Sprintf("0.0.0.0:%s", port))
	if err != nil {
		log.Fatalf("Failed to listen on port %s: %v", port, err)
	}

	grpcServer := grpc.NewServer()
	reflection.Register(grpcServer)

	server, err := NewClusterCollectorServer()
	if err != nil {
		log.Fatalf("Failed to initialize cluster collector: %v", err)
	}
	_ = server

	log.Printf("🚀 KubeOps K8s Collector Microservice (Go) listening on gRPC :%s", port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC: %v", err)
	}
}
