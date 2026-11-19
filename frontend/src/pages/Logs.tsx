import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, AlertCircle, Info, AlertTriangle, Filter } from 'lucide-react';
import { SystemLog } from '../types';
import { api } from '../services/api';

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemLogs(100);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === 'ALL') return true;
    return log.level === filterLevel;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System & Runtime Event Logs</h2>
          <p className="text-sm text-slate-400">
            Real-time diagnostics, process manager events, and lifecycle telemetry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warnings</option>
              <option value="ERROR">Errors</option>
            </select>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm italic">
            No system log events recorded for selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 font-mono text-xs">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 hover:bg-slate-800/30 transition-colors flex items-start gap-3"
              >
                <div className="pt-0.5">
                  {log.level === 'ERROR' ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : log.level === 'WARNING' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-sky-400 shrink-0" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        log.level === 'ERROR'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : log.level === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="text-slate-400 font-sans text-[11px]">
                      [{log.source}]
                    </span>
                    <span className="text-slate-500 text-[11px] ml-auto">
                      {new Date(log.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed break-words font-mono text-xs">
                    {log.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
