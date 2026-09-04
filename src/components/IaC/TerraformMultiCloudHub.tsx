import React, { useState } from 'react';
import { 
  Cloud, 
  Copy, 
  Check, 
  Download, 
  Code, 
  Layers, 
  Server, 
  CheckCircle2, 
  Terminal,
  ExternalLink
} from 'lucide-react';
import { TerraformTemplate } from '../../types';

interface TerraformMultiCloudHubProps {
  templates: TerraformTemplate[];
}

export const TerraformMultiCloudHub: React.FC<TerraformMultiCloudHubProps> = ({ templates }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleCopy = () => {
    if (!currentTemplate) return;
    navigator.clipboard.writeText(currentTemplate.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentTemplate) return;
    const blob = new Blob([currentTemplate.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentTemplate.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                Multi-Cloud Terraform & Infrastructure-as-Code Hub
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                  Terraform v1.8+ / OpenTofu
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Automated provisioning modules for AWS EKS, GCP GKE, Azure AKS, Karpenter autoscaling, and Istio Service Mesh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HCL</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy HCL'}</span>
            </button>
          </div>
        </div>

        {/* Cloud Provider Tabs */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
          {templates.map((tpl) => {
            const isSelected = tpl.id === selectedTemplateId;
            return (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  tpl.provider === 'aws' ? 'bg-amber-500' :
                  tpl.provider === 'gcp' ? 'bg-blue-500' :
                  tpl.provider === 'azure' ? 'bg-sky-500' :
                  'bg-purple-500'
                }`}></span>
                <span>{tpl.name}</span>
                <span className="font-mono text-[10px] text-slate-400">({tpl.filename})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Viewer & Module Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Overview Sidebar */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Module Provider
            </span>
            <span className="text-sm font-bold text-slate-800 uppercase">
              {currentTemplate.provider.toUpperCase()} Multi-Region
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Description
            </span>
            <p className="text-xs text-slate-600 mt-1">
              {currentTemplate.description}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Automated Features
            </span>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>OIDC Federated Workload Identity</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>KMS Customer Managed Key Encrypt</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prometheus-Operator Helm Release</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero-Egress Private Subnet Topology</span>
              </li>
            </ul>
          </div>

          <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
            <div>$ terraform init</div>
            <div>$ terraform plan -out=tfplan</div>
            <div className="text-blue-600 font-bold">$ terraform apply tfplan</div>
          </div>
        </div>

        {/* HCL Code Terminal Container */}
        <div className="lg:col-span-3 bg-[#1E293B] border border-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
              </div>
              <span className="text-slate-300 font-semibold ml-2">{currentTemplate.filename}</span>
            </div>
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[550px] scrollbar-thin">
            <code>{currentTemplate.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
