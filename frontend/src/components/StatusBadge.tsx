import React from 'react';

interface StatusBadgeProps {
  status: 'running' | 'stopped' | 'error' | 'pending' | 'in_progress' | 'success' | 'failed' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'running':
      case 'success':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]';
      case 'stopped':
        return 'bg-white/5 text-zinc-400 border-white/10';
      case 'error':
      case 'failed':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]';
      case 'pending':
      case 'in_progress':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse';
      default:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-tight border backdrop-blur-md transition-all ${getStyles()}`}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
        status === 'running' || status === 'success' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' :
        status === 'stopped' ? 'bg-zinc-500' :
        status === 'error' || status === 'failed' ? 'bg-rose-400 shadow-[0_0_6px_#fb7185]' : 'bg-amber-400'
      }`} />
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
};
