import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  RotateCcw, 
  Activity, 
  Server, 
  Cpu, 
  Gauge, 
  AlertCircle, 
  CheckCircle2, 
  Sliders,
  Radio
} from 'lucide-react';
import { ServiceDeployment } from '../../types';

interface LoadGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeService: ServiceDeployment;
  onApplyHpaScale: (newRps: number, newReplicas: number, newCpu: number) => void;
}

export const LoadGeneratorModal: React.FC<LoadGeneratorModalProps> = ({
  isOpen,
  onClose,
  activeService,
  onApplyHpaScale,
}) => {
  const [activeTab, setActiveTab] = useState<'real-http' | 'k8s-job' | 'synthetic'>('real-http');
  const [targetUrl, setTargetUrl] = useState<string>('http://127.0.0.1:3000/api/health');
  const [concurrency, setConcurrency] = useState<number>(15);
  const [duration, setDuration] = useState<number>(5);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Synthetic settings
  const [syntheticRps, setSyntheticRps] = useState<number>(4800);

  if (!isOpen) return null;

  const handleRunRealLoadTest = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setResults(null);

    try {
      const resp = await fetch('/api/traffic/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          concurrency,
          duration,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${resp.status}`);
      }

      const data = await resp.json();
      setResults(data);

      // Also optionally feed HPA metrics to the app state
      if (data.hpaImpact) {
        onApplyHpaScale(
          data.rps,
          data.hpaImpact.recommendedReplicas,
          data.hpaImpact.calculatedCpuPercent
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to execute real load generator');
    } finally {
      setIsRunning(false);
    }
  };

  const handleApplySyntheticSurge = () => {
    const calculatedReplicas = Math.min(
      activeService.maxReplicas,
      Math.max(activeService.minReplicas, Math.ceil((syntheticRps / activeService.targetRps) * 8))
    );
    const calculatedCpu = Math.min(94, Math.round(50 + (syntheticRps / 6000) * 40));

    onApplyHpaScale(syntheticRps, calculatedReplicas, calculatedCpu);
    onClose();
  };

  const k8sJobYaml = `apiVersion: batch/v1
kind: Job
metadata:
  name: load-tester-${activeService.id}
  namespace: ${activeService.namespace || 'default'}
spec:
  backoffLimit: 1
  template:
    metadata:
      labels:
        app: k6-load-generator
    spec:
      containers:
        - name: hey
          image: williamyeh/hey:latest
          args:
            - "-z"
            - "30s"
            - "-c"
            - "${concurrency * 2}"
            - "-q"
            - "100"
            - "http://${activeService.name}.${activeService.namespace || 'default'}.svc.cluster.local:8080/api/health"
      restartPolicy: Never`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Traffic Load Generator & Stress Testing
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate real HTTP network traffic, launch Kubernetes benchmark Jobs, or simulate HPA scaling surges.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('real-http')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'real-http'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Real HTTP Load Generator</span>
          </button>
          <button
            onClick={() => setActiveTab('k8s-job')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'k8s-job'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>In-Cluster K8s Job (hey / k6)</span>
          </button>
          <button
            onClick={() => setActiveTab('synthetic')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'synthetic'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Synthetic HPA Surge</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'real-http' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
                <Activity className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Real Network Requests:</span> This initiates actual concurrent HTTP requests from the KubeOps backend against your specified endpoint, measuring real round-trip latency, status codes, and network throughput.
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="http://localhost:3000/api/health or http://ingress.domain/api"
                    className="w-full px-3 py-2 text-xs font-mono rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setTargetUrl('http://127.0.0.1:3000/api/health')}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      Use Local App Health (port 3000)
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => setTargetUrl(`http://${activeService.name}.${activeService.namespace || 'default'}.svc.cluster.local:8080`)}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      Use Internal K8s Service DNS
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Concurrency: <span className="font-mono text-blue-600">{concurrency} workers</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={40}
                      value={concurrency}
                      onChange={(e) => setConcurrency(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Test Duration: <span className="font-mono text-blue-600">{duration} seconds</span>
                    </label>
                    <input
                      type="range"
                      min={2}
                      max={15}
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleRunRealLoadTest}
                    disabled={isRunning}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
                    <span>{isRunning ? `Sending real HTTP traffic (${duration}s)...` : 'Dispatch Real HTTP Load Test'}</span>
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {results && (
                  <div className="mt-4 p-4 bg-slate-900 rounded-xl text-slate-200 text-xs font-mono space-y-3 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Load Test Complete ({results.durationSeconds}s)
                      </span>
                      <span className="text-slate-400">{results.targetUrl}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                      <div className="p-2 bg-slate-800/80 rounded border border-slate-700/60">
                        <div className="text-[10px] text-slate-400 uppercase">Requests Sent</div>
                        <div className="text-base font-bold text-white mt-0.5">{results.totalRequests}</div>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded border border-slate-700/60">
                        <div className="text-[10px] text-slate-400 uppercase">Throughput</div>
                        <div className="text-base font-bold text-blue-400 mt-0.5">{results.rps} RPS</div>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded border border-slate-700/60">
                        <div className="text-[10px] text-slate-400 uppercase">P50 Latency</div>
                        <div className="text-base font-bold text-emerald-400 mt-0.5">{results.latency?.p50}ms</div>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded border border-slate-700/60">
                        <div className="text-[10px] text-slate-400 uppercase">P99 Latency</div>
                        <div className="text-base font-bold text-amber-400 mt-0.5">{results.latency?.p99}ms</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <div>
                        Status Breakdown:{' '}
                        {Object.entries(results.statusCounts || {}).map(([k, v]) => (
                          <span key={k} className="mr-2 text-slate-200">
                            HTTP {k}: <strong className="text-emerald-400">{v as any}</strong>
                          </span>
                        ))}
                      </div>
                      <div className="text-blue-300">
                        HPA Pod Target: {results.hpaImpact?.recommendedReplicas} replicas
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'k8s-job' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2">
                <Server className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Kubernetes In-Cluster Stress Test:</span> To test internal microservices inside your Kubernetes VPC without opening public ingress, apply this standard load generator Job (using <code className="font-mono text-blue-700">hey</code> or <code className="font-mono text-blue-700">k6</code>).
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Kubernetes Job Manifest (YAML):</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(k8sJobYaml);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Job YAML'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-emerald-300 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                <code>{k8sJobYaml}</code>
              </pre>

              <div className="p-3 bg-slate-100 rounded-lg text-xs font-mono text-slate-800 flex items-center justify-between">
                <span>kubectl apply -f load-test-job.yaml</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`kubectl apply -f - <<EOF\n${k8sJobYaml}\nEOF`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-blue-600 font-sans hover:underline cursor-pointer"
                >
                  Copy One-Liner
                </button>
              </div>
            </div>
          )}

          {activeTab === 'synthetic' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <Sliders className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Fast HPA Algorithm Benchmark:</span> Immediately tests the dashboard's Horizontal Pod Autoscaler and Kubernetes controller logic by injecting a synthetic traffic volume without making external network calls.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Target Ingress Traffic Volume</span>
                  <span className="font-mono text-blue-600 font-bold">{syntheticRps.toLocaleString()} RPS</span>
                </label>
                <input
                  type="range"
                  min={1000}
                  max={9500}
                  step={200}
                  value={syntheticRps}
                  onChange={(e) => setSyntheticRps(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>1,000 RPS (Idle)</span>
                  <span>4,800 RPS (Spike)</span>
                  <span>9,500 RPS (Peak Surge)</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Target RPS</div>
                  <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">{syntheticRps}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Estimated Replicas</div>
                  <div className="text-sm font-bold font-mono text-blue-600 mt-0.5">
                    {Math.min(activeService.maxReplicas, Math.max(activeService.minReplicas, Math.ceil((syntheticRps / activeService.targetRps) * 8)))} Pods
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Est. Node CPU</div>
                  <div className="text-sm font-bold font-mono text-amber-600 mt-0.5">
                    {Math.min(94, Math.round(50 + (syntheticRps / 6000) * 40))}%
                  </div>
                </div>
              </div>

              <button
                onClick={handleApplySyntheticSurge}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Apply In-Memory Surge ({syntheticRps.toLocaleString()} RPS)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Active Target: <code className="font-mono text-slate-700">{activeService.name}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
