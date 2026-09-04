import React, { useState } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Plus,
  RotateCw,
  FileKey
} from 'lucide-react';
import { EncryptedSecret, RbacRole } from '../../types';

interface RbacAndSecretsViewProps {
  secrets: EncryptedSecret[];
  rbacRoles: RbacRole[];
  onRotateSecret: (id: string) => void;
  onAddSecret: (secret: Omit<EncryptedSecret, 'id' | 'lastRotated' | 'kmsKeyId'>) => void;
}

export const RbacAndSecretsView: React.FC<RbacAndSecretsViewProps> = ({
  secrets,
  rbacRoles,
  onRotateSecret,
  onAddSecret,
}) => {
  const [revealedSecretId, setRevealedSecretId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // RBAC Evaluator State
  const [testUserRole, setTestUserRole] = useState<string>(rbacRoles[0]?.name || 'cluster-admin');
  const [testResource, setTestResource] = useState<string>('pods');
  const [testVerb, setTestVerb] = useState<string>('get');

  // New Secret Modal / Form State
  const [isAddingSecret, setIsAddingSecret] = useState(false);
  const [newSecretName, setNewSecretName] = useState('');
  const [newSecretNamespace, setNewSecretNamespace] = useState('production');
  const [newSecretKey, setNewSecretKey] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretName || !newSecretKey || !newSecretValue) return;

    onAddSecret({
      name: newSecretName,
      namespace: newSecretNamespace,
      encryptionType: 'KMS-Envelope-AES-GCM-256',
      vaultPath: `secret/data/${newSecretNamespace}/${newSecretName}`,
      keys: [{ key: newSecretKey, maskedValue: '••••••••••••••••••••', rawSample: newSecretValue }],
    });

    setNewSecretName('');
    setNewSecretKey('');
    setNewSecretValue('');
    setIsAddingSecret(false);
  };

  // RBAC check calculation
  const currentRole = rbacRoles.find(r => r.name === testUserRole);
  const isAllowed = currentRole?.rules.some(rule => {
    const resourceMatch = rule.resources.includes('*') || rule.resources.includes(testResource);
    const verbMatch = rule.verbs.includes('*') || rule.verbs.includes(testVerb);
    return resourceMatch && verbMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                RBAC & Envelope-Encrypted Secret Management
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                  HashiCorp Vault + Cloud KMS
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Hardware-backed envelope encryption (AES-256-GCM) with automated rotation and fine-grained Kubernetes RBAC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingSecret(!isAddingSecret)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Vault Secret</span>
            </button>
          </div>
        </div>
      </div>

      {/* New Secret Modal / Drawer */}
      {isAddingSecret && (
        <form onSubmit={handleCreateSecret} className="bg-white border border-blue-200 rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            Encrypt & Store New Kubernetes Secret
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Secret Name</label>
              <input
                type="text"
                placeholder="stripe-webhook-secret"
                value={newSecretName}
                onChange={(e) => setNewSecretName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Namespace</label>
              <select
                value={newSecretNamespace}
                onChange={(e) => setNewSecretNamespace(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="production">production</option>
                <option value="finance">finance</option>
                <option value="kube-system">kube-system</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Key Name</label>
              <input
                type="text"
                placeholder="API_SIGNING_KEY"
                value={newSecretKey}
                onChange={(e) => setNewSecretKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Secret Value (Raw)</label>
              <input
                type="password"
                placeholder="whsec_99a8x0..."
                value={newSecretValue}
                onChange={(e) => setNewSecretValue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingSecret(false)}
              className="px-3 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded text-xs font-bold uppercase bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              Encrypt with KMS
            </button>
          </div>
        </form>
      )}

      {/* Secret Store Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <FileKey className="w-4 h-4 text-blue-600" />
            Managed Encrypted Secrets ({secrets.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Provider: AWS KMS Key ARN arn:aws:kms:us-east-1:root/k8s-key
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">SECRET NAME</th>
                <th className="py-2.5 px-3">NAMESPACE</th>
                <th className="py-2.5 px-3">ENCRYPTION</th>
                <th className="py-2.5 px-3">VAULT / KMS PATH</th>
                <th className="py-2.5 px-3">KEYS & VALUE PREVIEW</th>
                <th className="py-2.5 px-3">LAST ROTATION</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {secrets.map((sec) => (
                <tr key={sec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800 font-mono flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    {sec.name}
                  </td>
                  <td className="py-3 px-3 font-mono text-blue-600">{sec.namespace}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px]">
                      {sec.encryptionType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px] truncate max-w-xs">
                    {sec.vaultPath}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {sec.keys.map((k, idx) => {
                      const isRevealed = revealedSecretId === `${sec.id}-${idx}`;
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-slate-500">{k.key}:</span>
                          <span className="text-slate-700">
                            {isRevealed ? k.rawSample : k.maskedValue}
                          </span>
                          <button
                            onClick={() => setRevealedSecretId(isRevealed ? null : `${sec.id}-${idx}`)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            title={isRevealed ? "Hide value" : "Reveal decrypted value"}
                          >
                            {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      );
                    })}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                    {sec.lastRotated}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onRotateSecret(sec.id)}
                      className="flex items-center gap-1 ml-auto px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3 text-blue-600" />
                      <span>Rotate Key</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive RBAC Simulator & Permission Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Simulator */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            kubectl auth can-i Evaluator
          </h3>
          <p className="text-xs text-slate-500">
            Simulate SubjectAccessReview across roles and API resource verbs
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Select Role</label>
              <select
                value={testUserRole}
                onChange={(e) => setTestUserRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {rbacRoles.map(r => (
                  <option key={r.id} value={r.name}>{r.name} ({r.namespace})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Target Resource</label>
              <select
                value={testResource}
                onChange={(e) => setTestResource(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="pods">pods</option>
                <option value="secrets">secrets</option>
                <option value="deployments">deployments</option>
                <option value="services">services</option>
                <option value="configmaps">configmaps</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">API Verb</label>
              <select
                value={testVerb}
                onChange={(e) => setTestVerb(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="get">get</option>
                <option value="list">list</option>
                <option value="create">create</option>
                <option value="update">update</option>
                <option value="delete">delete</option>
              </select>
            </div>

            {/* Verdict Card */}
            <div className={`p-4 rounded-lg border text-xs flex items-center justify-between font-mono ${
              isAllowed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {isAllowed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {isAllowed ? 'AUTHORIZATION GRANTED' : 'PERMISSION DENIED'}
                  </div>
                  <div className="text-[10px] opacity-80">
                    kubectl auth can-i {testVerb} {testResource} --as={testUserRole}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Cluster Roles & Principle of Least Privilege
          </h3>

          <div className="space-y-3">
            {rbacRoles.map((role) => (
              <div key={role.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-800 text-xs">{role.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                      namespace: {role.namespace}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Subjects: {role.subjects.join(', ')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {role.rules.map((rule, idx) => (
                    <div key={idx} className="text-[11px] font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-700">
                      <span className="text-blue-600 font-bold">[{rule.verbs.join(', ')}]</span> on <span className="text-slate-800 font-semibold">{rule.resources.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
