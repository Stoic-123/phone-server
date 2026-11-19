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

  const localIp = metrics?.network.local_ip || '127.0.0.1';

  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-slate-100">
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
        {/* Top bar */}
        <header className="h-16 border-b border-slate-800 bg-[#0d121d]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-white capitalize">
              {currentTab === 'ai' ? 'AI Server Assistant' : currentTab}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-400 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-sky-500"
              />
              Auto-refresh (5s)
            </label>
            <div className="text-xs font-mono px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
              LAN: <span className="text-sky-400">{localIp}</span>
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
          {currentTab === 'projects' && <Projects localIp={localIp} />}
          {currentTab === 'deployments' && <Deployments />}
          {currentTab === 'terminal' && <Terminal localIp={localIp} />}
          {currentTab === 'logs' && <Logs />}
          {currentTab === 'ai' && <AiAssistant />}
          {currentTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
};
