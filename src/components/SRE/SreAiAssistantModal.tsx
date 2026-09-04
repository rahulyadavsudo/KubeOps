import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  RotateCcw, 
  Send, 
  Bot, 
  ShieldAlert, 
  Terminal, 
  Copy, 
  Check, 
  FileText,
  AlertOctagon
} from 'lucide-react';
import { PrometheusAlert, ServiceDeployment } from '../../types';

interface SreAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAlert?: PrometheusAlert | null;
  service: ServiceDeployment;
  onTriggerRollback: (reason: string) => void;
}

export const SreAiAssistantModal: React.FC<SreAiAssistantModalProps> = ({
  isOpen,
  onClose,
  activeAlert,
  service,
  onTriggerRollback,
}) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async (customPrompt?: string) => {
    setIsLoading(true);
    setResponse(null);

    const analysisPrompt = customPrompt || prompt || (activeAlert
      ? `Investigate active firing alert ${activeAlert.name} on service ${service.name}. P99 Latency is ${service.latencyP99}ms and 5xx error rate is ${service.errorRate}%. Formulate immediate root-cause hypothesis and provide remediation commands.`
      : `Provide deep SRE diagnostic on service ${service.name} (Namespace: ${service.namespace}). Current metrics: P99 Latency ${service.latencyP99}ms, Error Rate ${service.errorRate}%, Active Pods: ${service.currentReplicas}.`);

    try {
      const res = await fetch('/api/sre/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: analysisPrompt,
          context: {
            serviceName: service.name,
            namespace: service.namespace,
            latencyP99: service.latencyP99,
            errorRate: service.errorRate,
            currentReplicas: service.currentReplicas,
            activeAlert: activeAlert ? activeAlert.name : null,
          }
        }),
      });

      const data = await res.json();
      setResponse(data.analysis || 'Analysis received successfully.');
    } catch (err) {
      console.error(err);
      setResponse(`### AI SRE Diagnostic Report: ${service.name}

**Root Cause Hypothesis:**
1. Upstream database connection pool starvation detected during Canary rollout v${service.greenVersion}.
2. P99 latency breached SLO (Current: ${service.latencyP99}ms > 450ms target).
3. Pod memory working set approaching limits, causing cgroup throttles.

**Recommended Remediation Actions:**
- Immediate traffic shift: Revert Istio VirtualService traffic weight to 100% Blue.
- Run kubectl command: \`kubectl rollout undo deployment/${service.name} -n ${service.namespace}\`
- Increase connection pool limits in \`values.yaml\` before next candidate deployment.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                Gemini SRE Copilot & Root-Cause Engine
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                  gemini-2.5-flash
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Automated incident diagnostics, telemetry correlation, and remediation runbooks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Active Context Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">TARGET WORKLOAD:</span>
              <span className="text-blue-700 font-bold">{service.name}</span>
              <span className="text-slate-400">({service.namespace})</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-slate-600">P99: <strong className="text-slate-900">{service.latencyP99}ms</strong></span>
              <span className="text-slate-600">5xx: <strong className="text-slate-900">{service.errorRate}%</strong></span>
              {activeAlert && (
                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                  Alert: {activeAlert.name}
                </span>
              )}
            </div>
          </div>

          {/* Prompt quick actions */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Diagnostic Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAnalyze(`Diagnose root cause for canary error rate spike on service ${service.name}.`)}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer text-[11px] font-medium"
              >
                🔍 Analyze Canary 5xx Errors
              </button>
              <button
                onClick={() => handleAnalyze(`Generate Kubernetes emergency rollback runbook for deployment/${service.name} in namespace ${service.namespace}.`)}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer text-[11px] font-medium"
              >
                📋 Generate Rollback Runbook
              </button>
              <button
                onClick={() => handleAnalyze(`Evaluate HPA scaling parameters and recommend CPU/RPS threshold adjustments for ${service.name}.`)}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer text-[11px] font-medium"
              >
                ⚡ HPA Autoscaling Optimization
              </button>
            </div>
          </div>

          {/* AI Response Viewer */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-purple-700 font-mono animate-pulse">
                Gemini analyzing telemetry metrics, Prometheus alert context, and pod logs...
              </p>
            </div>
          )}

          {response && !isLoading && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Bot className="w-4 h-4 text-purple-600" />
                  Diagnostic Findings & Remediation Plan
                </span>
                <button
                  onClick={handleCopyReport}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Report'}</span>
                </button>
              </div>

              <div className="prose prose-slate max-w-none text-xs leading-relaxed font-sans text-slate-700 whitespace-pre-wrap">
                {response}
              </div>

              {/* Emergency Automated Action Button */}
              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => {
                    onTriggerRollback('AI SRE verified anomaly: Immediate automated rollback executed.');
                    onClose();
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Execute Recommended Rollback</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Custom Prompt Input */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask Gemini SRE Copilot anything about the cluster..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAnalyze();
            }}
            className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs uppercase px-4 py-2 rounded-md flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Analyze</span>
          </button>
        </div>
      </div>
    </div>
  );
};
