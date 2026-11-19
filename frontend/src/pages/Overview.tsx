import React from 'react';
import {
  Cpu,
  Database,
  HardDrive,
  BatteryCharging,
  Wifi,
  Clock,
  ExternalLink,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SystemMetrics } from '../types';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';

interface OverviewProps {
  metrics: SystemMetrics | null;
  onNavigateToProjects: () => void;
}

export const Overview: React.FC<OverviewProps> = ({ metrics, onNavigateToProjects }) => {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Activity className="w-6 h-6 animate-spin mr-2 text-sky-400" />
        Connecting to PocketDev server on OPPO Reno2 F...
      </div>
    );
  }

  const runningServicesCount = metrics.services.filter(s => s.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-[#131b2e] p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">{metrics.device_model}</h2>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Server
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Running {metrics.android_version || 'Android'} &bull; Kernel {metrics.kernel_version}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-800/80 rounded-xl border border-slate-700/60 text-right">
            <span className="text-xs text-slate-400 block">LAN IP Address</span>
            <span className="text-sm font-mono font-semibold text-sky-400">{metrics.network.local_ip}</span>
          </div>
          <div className="px-4 py-2 bg-slate-800/80 rounded-xl border border-slate-700/60 text-right">
            <span className="text-xs text-slate-400 block">Uptime</span>
            <span className="text-sm font-semibold text-white">{metrics.uptime_human}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Utilization"
          value={metrics.cpu.usage_percent !== null ? `${metrics.cpu.usage_percent}%` : 'Normal'}
          subtitle={metrics.cpu.frequency_mhz ? `${metrics.cpu.frequency_mhz} MHz &bull; 8 Cores` : '8-Core Helio P70'}
          percent={metrics.cpu.usage_percent}
          icon={<Cpu className="w-5 h-5" />}
        />
        <MetricCard
          title="RAM Memory"
          value={`${metrics.memory.used_mb} MB`}
          subtitle={`of ${metrics.memory.total_mb} MB total (8GB RAM)`}
          percent={metrics.memory.usage_percent}
          icon={<Database className="w-5 h-5" />}
        />
        <MetricCard
          title="Storage (Flash)"
          value={`${metrics.storage.used_gb} GB`}
          subtitle={`of ${metrics.storage.total_gb} GB (128GB UFS 2.1)`}
          percent={metrics.storage.usage_percent}
          icon={<HardDrive className="w-5 h-5" />}
        />
        <MetricCard
          title="Battery & Thermals"
          value={metrics.battery.present && metrics.battery.percentage !== null ? `${metrics.battery.percentage}%` : 'AC Power'}
          subtitle={metrics.battery.temperature_c ? `Temp: ${metrics.battery.temperature_c}°C &bull; ${metrics.battery.status}` : 'Thermal Status Normal'}
          percent={metrics.battery.percentage}
          statusColor="bg-emerald-500"
          icon={<BatteryCharging className="w-5 h-5" />}
        />
      </div>

      {/* Managed Services & Hardware Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Services */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <h3 className="font-semibold text-white">Active Services & Endpoints</h3>
            </div>
            <button
              onClick={onNavigateToProjects}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
            >
              Manage Projects <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {metrics.services.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No development projects or services currently running.
              <div className="mt-2">
                <button
                  onClick={onNavigateToProjects}
                  className="px-3 py-1.5 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
                >
                  Create First Project
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase font-medium">
                    <th className="pb-3">Service Name</th>
                    <th className="pb-3">Port</th>
                    <th className="pb-3">PID</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {metrics.services.map((svc) => (
                    <tr key={svc.name} className="hover:bg-slate-800/30">
                      <td className="py-3 font-medium text-white">{svc.name}</td>
                      <td className="py-3 font-mono text-slate-300">:{svc.port}</td>
                      <td className="py-3 font-mono text-xs text-slate-500">{svc.pid || '-'}</td>
                      <td className="py-3">
                        <StatusBadge status={svc.status} />
                      </td>
                      <td className="py-3 text-right">
                        {svc.port && svc.status === 'running' ? (
                          <a
                            href={`http://${metrics.network.local_ip}:${svc.port}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
                          >
                            Open <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-600">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Device Profile Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Hardware Specification
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Processor</span>
                <span className="text-slate-200 font-medium">Helio P70 (4xA73 + 4xA53)</span>
              </li>
              <li className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Architecture</span>
                <span className="text-slate-200 font-mono">ARM64 (aarch64)</span>
              </li>
              <li className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Physical Memory</span>
                <span className="text-slate-200 font-medium">8.0 GB LPDDR4x</span>
              </li>
              <li className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Internal Storage</span>
                <span className="text-slate-200 font-medium">128 GB UFS 2.1</span>
              </li>
              <li className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Execution Mode</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Non-Root Termux
                </span>
              </li>
              <li className="flex justify-between py-1">
                <span className="text-slate-400">OpenSSH Port</span>
                <span className="text-sky-400 font-mono">8022</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 bg-slate-900/40 -mx-5 -mb-5 p-4 rounded-b-xl">
            <span className="text-[11px] text-slate-400 block font-medium">Fast Local Access</span>
            <code className="text-xs text-sky-300 font-mono block mt-1 select-all bg-black/40 px-2 py-1 rounded">
              http://{metrics.network.local_ip}:8000
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
