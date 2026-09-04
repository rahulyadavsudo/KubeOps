import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Search, 
  Download, 
  Play, 
  Pause, 
  Trash2, 
  AlertTriangle, 
  Copy,
  Check,
  Code
} from 'lucide-react';
import { LogEntry } from '../../types';

interface CentralizedLoggingViewProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onAddLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
}

export const CentralizedLoggingView: React.FC<CentralizedLoggingViewProps> = ({
  logs,
  onClearLogs,
  onAddLog,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLiveTailing, setIsLiveTailing] = useState<boolean>(true);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLiveTailing && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isLiveTailing]);

  const filteredLogs = logs.filter((log) => {
    if (selectedLevel !== 'ALL' && log.level !== selectedLevel) return false;
    if (selectedTraceId && log.traceId !== selectedTraceId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.service.toLowerCase().includes(q) ||
        log.pod.toLowerCase().includes(q) ||
        log.traceId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kubeops-logs-${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const simulateErrorStack = () => {
    onAddLog({
      level: 'ERROR',
      service: 'payment-gateway',
      pod: 'payment-gateway-green-7f98b5-x8q1',
      namespace: 'finance',
      traceId: `trace-${Math.random().toString(16).substring(2, 8)}`,
      message: 'ConnectionTimeoutError: Pool exhausted (max 50 connections). Upstream Postgres read-replica timed out after 5000ms. Transaction aborted.'
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                Centralized Logging & Distributed Trace Correlator
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                  OpenTelemetry / ELK
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Aggregated pod logs across all namespaces with instant Trace ID correlation and grep filtering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiveTailing(!isLiveTailing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer border ${
                isLiveTailing
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {isLiveTailing ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
              <span>{isLiveTailing ? 'Live: ON' : 'Paused'}</span>
            </button>

            <button
              onClick={simulateErrorStack}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Inject Error</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search log messages, pods, traces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Level Selector */}
            <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200 font-mono text-[11px]">
              {['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    selectedLevel === lvl
                      ? lvl === 'ERROR' ? 'bg-rose-600 text-white' :
                        lvl === 'WARN' ? 'bg-amber-500 text-slate-950' :
                        'bg-blue-600 text-white'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Trace filter reset */}
          {selectedTraceId && (
            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded text-xs font-mono">
              <span>Trace filter: {selectedTraceId}</span>
              <button
                onClick={() => setSelectedTraceId(null)}
                className="hover:text-purple-900 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
            <span>Showing {filteredLogs.length} logs</span>
            <button
              onClick={onClearLogs}
              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal View matching Design HTML #1E293B */}
      <div 
        ref={logContainerRef}
        className="bg-[#1E293B] border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-[580px] shadow-lg space-y-1.5 scrollbar-thin"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/80 text-[10px] uppercase font-bold tracking-widest">
          <span className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            CENTRALIZED LOGS [ELK / FLUENTBIT]
          </span>
          <span className="text-emerald-400">STREAMING LIVE</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-sans text-sm">
            No log entries match your filter criteria.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isError = log.level === 'ERROR';
            const isWarn = log.level === 'WARN';

            return (
              <div
                key={log.id}
                className={`py-1 px-2 rounded group hover:bg-slate-800/60 transition-colors flex flex-col sm:flex-row sm:items-baseline gap-2 ${
                  isError ? 'bg-rose-950/20 text-rose-300 border-l-2 border-rose-500' :
                  isWarn ? 'bg-amber-950/20 text-amber-300 border-l-2 border-amber-500' :
                  'text-slate-300'
                }`}
              >
                {/* Timestamp */}
                <span className="text-slate-500 text-[10px] shrink-0 font-mono">
                  [{log.timestamp.slice(11, 19)}]
                </span>

                {/* Level Badge */}
                <span className={`text-[10px] font-bold shrink-0 ${
                  isError ? 'text-rose-400' :
                  isWarn ? 'text-orange-400' :
                  'text-blue-400'
                }`}>
                  {log.level}:
                </span>

                {/* Service / Pod */}
                <span className="text-slate-400 text-[11px] shrink-0 font-semibold">
                  [{log.service}]
                </span>

                {/* Trace ID */}
                <button
                  onClick={() => setSelectedTraceId(log.traceId)}
                  title="Click to filter by Trace ID"
                  className="text-purple-400/80 hover:text-purple-300 text-[10px] underline decoration-dotted shrink-0 cursor-pointer"
                >
                  {log.traceId}
                </button>

                {/* Message Body */}
                <span className="break-all flex-1 text-slate-200">
                  {log.message}
                </span>

                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(log.message, log.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-200 transition-opacity p-1 cursor-pointer shrink-0 ml-auto"
                >
                  {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
