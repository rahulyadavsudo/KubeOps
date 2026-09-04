import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  FileText, 
  Server, 
  Layers, 
  ExternalLink,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';

interface DockerHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DockerHubModal: React.FC<DockerHubModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'docker' | 'dockerfile' | 'compose' | 'k8s'>('docker');
  const [dockerUsername, setDockerUsername] = useState('rahulyadav16');
  const [imageTag, setImageTag] = useState('v1.0.0');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const imageName = `${dockerUsername}/kubeops:${imageTag}`;

  const dockerCommands = `# 1. Build the production multi-stage Docker image
docker build -t ${imageName} .

# 2. Authenticate to Docker Hub
docker login

# 3. Push the image to your Docker Hub repository
docker push ${imageName}

# 4. Run the container locally to test
docker run -d \\
  --name kubeops-app \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e GEMINI_API_KEY="your-gemini-api-key" \\
  ${imageName}

# 5. Verify healthy status via healthcheck endpoint
curl http://localhost:3000/api/health`;

  const dockerfileSnippet = `# Multi-stage Dockerfile for KubeOps
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
RUN addgroup -g 1001 -S kubeops && adduser -S kubeops -u 1001 -G kubeops
USER kubeops
EXPOSE 3000
CMD ["node", "dist/server.cjs"]`;

  const composeSnippet = `version: '3.8'

services:
  kubeops:
    image: ${imageName}
    container_name: kubeops-platform
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=\${GEMINI_API_KEY:-}
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://127.0.0.1:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3`;

  const k8sSnippet = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: kubeops-platform
  namespace: kubeops-system
spec:
  replicas: 2
  selector:
    matchLabels:
      app: kubeops
  template:
    metadata:
      labels:
        app: kubeops
    spec:
      containers:
        - name: kubeops
          image: ${imageName}
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Containerize & Push to Docker Hub
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Build a self-contained production image and run it on any machine or Kubernetes cluster.
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

        {/* Input variables for custom username/tag */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Docker Hub Username / Organization:
            </label>
            <input
              type="text"
              value={dockerUsername}
              onChange={(e) => setDockerUsername(e.target.value.toLowerCase().trim())}
              placeholder="e.g. your-dockerhub-username"
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Image Tag / Version:
            </label>
            <input
              type="text"
              value={imageTag}
              onChange={(e) => setImageTag(e.target.value.trim())}
              placeholder="v1.0.0 or latest"
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('docker')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'docker'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI Commands</span>
          </button>
          <button
            onClick={() => setActiveTab('dockerfile')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dockerfile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dockerfile</span>
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'compose'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>docker-compose.yml</span>
          </button>
          <button
            onClick={() => setActiveTab('k8s')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'k8s'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Kubernetes Manifest</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'docker' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Run these commands from your project root:</span>
                <button
                  onClick={() => copyToClipboard(dockerCommands, 'commands')}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copiedSection === 'commands' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'commands' ? 'Copied' : 'Copy Commands'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                <code>{dockerCommands}</code>
              </pre>
            </div>
          )}

          {activeTab === 'dockerfile' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Multi-stage lightweight production Dockerfile (already generated in project root):</span>
                <button
                  onClick={() => copyToClipboard(dockerfileSnippet, 'dockerfile')}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copiedSection === 'dockerfile' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'dockerfile' ? 'Copied' : 'Copy Dockerfile'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-300 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                <code>{dockerfileSnippet}</code>
              </pre>
            </div>
          )}

          {activeTab === 'compose' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Launch locally with Docker Compose:</span>
                <button
                  onClick={() => copyToClipboard(composeSnippet, 'compose')}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copiedSection === 'compose' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'compose' ? 'Copied' : 'Copy docker-compose.yml'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                <code>{composeSnippet}</code>
              </pre>
            </div>
          )}

          {activeTab === 'k8s' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Deploy KubeOps to your Kubernetes cluster:</span>
                <button
                  onClick={() => copyToClipboard(k8sSnippet, 'k8s')}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copiedSection === 'k8s' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'k8s' ? 'Copied' : 'Copy YAML'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-300 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                <code>{k8sSnippet}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Image Target: <code className="font-mono text-blue-700 font-semibold">{imageName}</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
