import React from 'react';
import {
  Cpu,
  Database,
  HardDrive,
  BatteryCharging,
  Clock,
  ExternalLink,
  Layers,
  Activity,
  CheckCircle2,
  Smartphone
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
      <div className="flex flex-col items-center justify-center h-80 text-zinc-400 gap-3">
        <div className="p-4 rounded-2xl glass-panel text-sky-400 animate-pulse">
          <Activity className="w-8 h-8" />
        </div>
        <p className="text-[13px] font-medium tracking-tight">Streaming live telemetry from OPPO Reno2 F...</p>
      </div>
    );
  }

  const runningServicesCount = metrics.services.filter(s => s.status === 'running').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Apple-styled Fluid Hero Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[22px] font-semibold text-white tracking-tight font-display">
                {metrics.device_model}
              </h2>
              <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Online
              </span>
            </div>
            <p className="text-[13px] text-zinc-400 mt-1 tracking-tight">
              {metrics.android_version || 'Android'} &bull; Kernel {metrics.kernel_version} &bull; Non-Root Userland
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className="text-[11px] text-zinc-500 block uppercase tracking-wider font-semibold">Direct LAN</span>
              <span className="text-[13px] font-mono font-medium text-sky-300">{metrics.network.local_ip}</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className="text-[11px] text-zinc-500 block uppercase tracking-wider font-semibold">Uptime</span>
              <span className="text-[13px] font-medium text-white">{metrics.uptime_human}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
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
          subtitle={`of ${metrics.memory.total_mb} MB (8GB LPDDR4x)`}
          percent={metrics.memory.usage_percent}
          icon={<Database className="w-5 h-5" />}
        />
        <MetricCard
          title="Internal Storage"
          value={`${metrics.storage.used_gb} GB`}
          subtitle={`of ${metrics.storage.total_gb} GB (128GB UFS)`}
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

      {/* Services Table and Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Managed Services */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sky-400">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-[15px] tracking-tight">Active Services</h3>
            </div>
            <button
              onClick={onNavigateToProjects}
              className="text-[12px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
            >
              All Projects <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {metrics.services.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-[13px]">
              No development projects running currently.
              <div className="mt-3">
                <button
                  onClick={onNavigateToProjects}
                  className="px-4 py-2 text-[12px] font-medium bg-white/10 hover:bg-white/15 text-white rounded-xl transition-all border border-white/10"
                >
                  Create New Project
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-2">Service</th>
                    <th className="pb-3">Port</th>
                    <th className="pb-3">PID</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {metrics.services.map((svc) => (
                    <tr key={svc.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pl-2 font-medium text-white">{svc.name}</td>
                      <td className="py-3.5 font-mono text-zinc-400">:{svc.port}</td>
                      <td className="py-3.5 font-mono text-[11px] text-zinc-500">{svc.pid || '-'}</td>
                      <td className="py-3.5">
                        <StatusBadge status={svc.status} />
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        {svc.port && svc.status === 'running' ? (
                          <a
                            href={`http://${metrics.network.local_ip}:${svc.port}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-sky-400 hover:text-sky-300 transition-colors"
                          >
                            Open <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[12px] text-zinc-600">Offline</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hardware Specs Panel */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/80">
                <Smartphone className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-[15px] tracking-tight">Device Spec</h3>
            </div>
            
            <div className="space-y-2.5 text-[12px]">
              <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                <span className="text-zinc-500">SoC</span>
                <span className="text-zinc-200 font-medium">Helio P70 (4xA73 + 4xA53)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                <span className="text-zinc-500">Architecture</span>
                <span className="text-zinc-300 font-mono">ARM64 (aarch64)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                <span className="text-zinc-500">Memory</span>
                <span className="text-zinc-200 font-medium">8.0 GB LPDDR4x</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                <span className="text-zinc-500">Storage</span>
                <span className="text-zinc-200 font-medium">128 GB UFS 2.1</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                <span className="text-zinc-500">Mode</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Non-Root Native
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">SSH Daemon</span>
                <span className="text-sky-400 font-mono font-medium">Port 8022</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] bg-white/[0.02] -mx-6 -mb-6 p-5 rounded-b-3xl">
            <span className="text-[11px] text-zinc-500 block font-medium uppercase tracking-wider">Fast Direct Address</span>
            <code className="text-[12px] text-sky-300 font-mono block mt-1.5 select-all bg-black/50 px-2.5 py-1.5 rounded-xl border border-white/[0.08]">
              http://{metrics.network.local_ip}:8888
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
