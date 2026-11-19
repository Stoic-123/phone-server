import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  percent?: number | null;
  statusColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  percent,
  statusColor = 'bg-sky-500'
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 hover:border-white/20 transition-all duration-300 relative overflow-hidden group">
      {/* Light sheen on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.02] to-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-[13px] font-medium text-zinc-400 tracking-tight">{title}</span>
        <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/90 shadow-inner">
          {icon}
        </div>
      </div>

      <div className="mt-4 relative z-10">
        <div className="text-[26px] font-semibold tracking-tight text-white leading-tight font-display">
          {value}
        </div>
        {subtitle && (
          <p className="text-[12px] text-zinc-400 mt-1 truncate font-normal tracking-tight">
            {subtitle}
          </p>
        )}
      </div>

      {percent !== undefined && percent !== null && (
        <div className="mt-5 relative z-10">
          <div className="w-full bg-black/40 border border-white/[0.05] rounded-full h-[6px] overflow-hidden p-[1px]">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                percent > 85 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : percent > 65 ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : statusColor
              }`}
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-zinc-500 mt-2 font-mono">
            <span>Utilization</span>
            <span className="text-zinc-400 font-medium">{percent}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
