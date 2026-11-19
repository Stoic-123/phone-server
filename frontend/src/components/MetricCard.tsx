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
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className="p-2 bg-slate-800/80 rounded-lg text-sky-400">
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        {subtitle && <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>}
      </div>

      {percent !== undefined && percent !== null && (
        <div className="mt-4">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                percent > 85 ? 'bg-rose-500' : percent > 65 ? 'bg-amber-500' : statusColor
              }`}
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1.5">
            <span>Utilization</span>
            <span>{percent}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
