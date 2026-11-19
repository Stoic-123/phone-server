import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Overview } from './pages/Overview';
import { Projects } from './pages/Projects';
import { Deployments } from './pages/Deployments';
import { Terminal } from './pages/Terminal';
import { Logs } from './pages/Logs';
import { AiAssistant } from './pages/AiAssistant';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { SystemMetrics } from './types';
import { api, getAuthToken, clearAuthToken } from './services/api';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAuthToken());
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const fetchMetrics = async () => {
    if (!isAuthenticated) return;
    try {
      setIsRefreshing(true);
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const handleAuthExpired = () => setIsAuthenticated(false);
    window.addEventListener('pocketdev_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('pocketdev_auth_expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMetrics();
    }
  }, [isAuthenticated]);

  // Periodic metrics auto-refresh loop
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchMetrics();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh]);

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const browserHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isTunnel = browserHost.includes('trycloudflare.com') || browserHost.includes('.loca.lt') || browserHost.includes('.ngrok');
  const activeIp = (!isTunnel && browserHost && browserHost !== '0.0.0.0')
    ? browserHost
    : (metrics?.network.local_ip || '127.0.0.1');

  return (
    <div className="flex min-h-screen bg-[#06080c] text-zinc-100 font-sans selection:bg-white/20">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onLogout={handleLogout}
        isOnline={metrics?.online || false}
        onRefresh={fetchMetrics}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Apple translucent top bar */}
        <header className="h-16 border-b border-white/[0.06] bg-black/40 backdrop-blur-2xl px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold text-white tracking-tight capitalize">
              {currentTab === 'ai' ? 'AI Server Assistant' : currentTab}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-[12px] text-zinc-400 select-none cursor-pointer hover:text-zinc-300 transition-colors">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded bg-white/10 border-white/20 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              Live Telemetry (5s)
            </label>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-md text-[12px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
              <span className="text-zinc-400 font-medium">Host:</span>
              <span className="font-mono text-zinc-200 font-semibold">{activeIp}</span>
              {metrics?.network?.interfaces && metrics.network.interfaces.length > 1 && (
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full text-zinc-300 font-mono" title={metrics.network.interfaces.map(i => `${i.name}: ${i.ip}`).join(', ')}>
                  +{metrics.network.interfaces.length - 1}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Tab Pages */}
        <div className="flex-1 p-8">
          {currentTab === 'overview' && (
            <Overview
              metrics={metrics}
              onNavigateToProjects={() => setCurrentTab('projects')}
            />
          )}
          {currentTab === 'projects' && <Projects localIp={activeIp} />}
          {currentTab === 'deployments' && <Deployments />}
          {currentTab === 'terminal' && <Terminal localIp={activeIp} />}
          {currentTab === 'logs' && <Logs />}
          {currentTab === 'ai' && <AiAssistant />}
          {currentTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
};
