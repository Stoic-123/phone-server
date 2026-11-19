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
    <aside className="w-64 glass-sidebar flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand header */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-[0_2px_12px_rgba(56,189,248,0.35)] border border-white/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white text-[15px] tracking-tight">PocketDev</span>
                <span className="text-[10px] font-medium tracking-wider uppercase px-1.5 py-[1px] rounded-md bg-white/[0.08] text-sky-300 border border-white/10">
                  Node
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">OPPO Reno2 F Server</p>
            </div>
          </div>

          {/* Status Capsule */}
          <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'}`} />
              <span className="text-[12px] text-zinc-300 font-medium">
                {isOnline ? 'Active Server' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh telemetry"
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:rotate-180 duration-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-2">
          <span className="px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
            Management
          </span>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all ${
                    active
                      ? 'bg-white/[0.12] text-white shadow-sm border border-white/[0.12] font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-sky-400' : 'text-zinc-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer User Info & Sign Out */}
      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>
    </aside>
  );
};
