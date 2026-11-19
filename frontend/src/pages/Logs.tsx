import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Info, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { SystemLog } from '../types';
import { api } from '../services/api';

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemLogs(150);
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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold text-white tracking-tight">
            System & Event Logs
          </h2>
          <p className="text-[13px] text-zinc-400 mt-1">
            Real-time diagnostics, process supervisor lifecycle, and hardware telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Apple Segmented Severity Switcher */}
          <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex gap-1 text-[12px]">
            {['ALL', 'INFO', 'WARNING', 'ERROR'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  filterLevel === lvl
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {lvl === 'ALL' ? 'All' : lvl.charAt(0) + lvl.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-all active:scale-95 disabled:opacity-50 border border-white/[0.08]"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>EVENT STREAM ({filteredLogs.length} ENTRIES)</span>
          <span>BUFFER: 150 MAX</span>
        </div>

        {loading && logs.length === 0 ? (
          <div className="p-16 text-center text-zinc-500 text-[13px]">
            Loading log buffer...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-zinc-500 text-[13px] italic">
            No system log events recorded for selected filter level.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] font-mono text-[12px] max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 hover:bg-white/[0.02] transition-colors flex items-start gap-3.5"
              >
                <div className="pt-0.5 shrink-0">
                  {log.level === 'ERROR' ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : log.level === 'WARNING' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Info className="w-4 h-4 text-sky-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase font-mono ${
                        log.level === 'ERROR'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : log.level === 'WARNING'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="text-zinc-500 font-sans text-[11px]">
                      [{log.source}]
                    </span>
                    <span className="text-zinc-600 text-[11px] ml-auto font-mono">
                      {new Date(log.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-zinc-200 leading-relaxed break-words font-mono text-[11.5px]">
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
