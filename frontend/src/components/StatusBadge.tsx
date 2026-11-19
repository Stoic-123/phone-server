import React from 'react';

interface StatusBadgeProps {
  status: 'running' | 'stopped' | 'error' | 'pending' | 'in_progress' | 'success' | 'failed' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'running':
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'stopped':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'error':
      case 'failed':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'pending':
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
        status === 'running' || status === 'success' ? 'bg-emerald-400' :
        status === 'stopped' ? 'bg-slate-400' :
        status === 'error' || status === 'failed' ? 'bg-rose-400' : 'bg-amber-400'
      }`} />
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
};
