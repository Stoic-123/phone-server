import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  UploadCloud,
  Terminal,
  FileText,
  Bot,
  Settings as SettingsIcon,
  Smartphone,
  LogOut,
  RefreshCw
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  isOnline: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  isOnline,
  onRefresh,
  isRefreshing
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'deployments', label: 'Deployments', icon: UploadCloud },
    { id: 'terminal', label: 'Terminal / SSH', icon: Terminal },
    { id: 'logs', label: 'Server Logs', icon: FileText },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-[#0d121d] border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-sky-900/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
                PocketDev
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                  Android
                </span>
              </h1>
              <p className="text-xs text-slate-400 truncate">OPPO Reno2 F Server</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-slate-300 font-medium">{isOnline ? 'Server Online' : 'Offline'}</span>
            </div>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh server status"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-sky-600/15 text-sky-400 border border-sky-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-sky-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer & logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
