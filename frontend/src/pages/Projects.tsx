import React, { useState, useEffect } from 'react';
import {
  Plus,
  Play,
  Square,
  RotateCw,
  Trash2,
  Terminal,
  ExternalLink,
  Code2,
  FolderGit2,
  AlertCircle,
  X
} from 'lucide-react';
import { Project } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface ProjectsProps {
  localIp: string;
}

export const Projects: React.FC<ProjectsProps> = ({ localIp }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const activeHost = (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== '0.0.0.0' && !window.location.hostname.includes('trycloudflare.com'))
    ? window.location.hostname
    : (localIp || '127.0.0.1');

  const triggerError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 6000);
  };
  
  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<'python_fastapi' | 'python_flask' | 'nodejs_express' | 'static_html'>('python_fastapi');
  const [port, setPort] = useState<number>(8089);
  const [entrypoint, setEntrypoint] = useState('main.py');
  const [autoRestart, setAutoRestart] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Logs state
  const [activeLogProject, setActiveLogProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Delete modal
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();
      setProjects(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateSubmitting(true);
      await api.createProject({
        name,
        description,
        type: projectType,
        port: Number(port),
        entrypoint,
        auto_restart: autoRestart
      });
      setIsCreateOpen(false);
      setName('');
      setDescription('');
      fetchProjects();
    } catch (err: any) {
      triggerError(`Error creating project: ${err.message}`);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await api.startProject(id);
      fetchProjects();
    } catch (err: any) {
      triggerError(`Start failed: ${err.message}`);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await api.stopProject(id);
      fetchProjects();
    } catch (err: any) {
      triggerError(`Stop failed: ${err.message}`);
    }
  };

  const handleRestart = async (id: string) => {
    try {
      await api.restartProject(id);
      fetchProjects();
    } catch (err: any) {
      triggerError(`Restart failed: ${err.message}`);
    }
  };

  const handleViewLogs = async (proj: Project) => {
    setActiveLogProject(proj);
    setLoadingLogs(true);
    try {
      const res = await api.getProjectLogs(proj.id);
      setLogs(res.lines);
    } catch (err: any) {
      setLogs([`Failed to read logs: ${err.message}`]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await api.deleteProject(projectToDelete.id);
      setProjectToDelete(null);
      fetchProjects();
    } catch (err: any) {
      triggerError(`Failed to delete project: ${err.message}`);
    }
  };

  const updateEntrypointDefault = (type: string) => {
    if (type === 'python_fastapi') setEntrypoint('main.py');
    else if (type === 'python_flask') setEntrypoint('app.py');
    else if (type === 'nodejs_express') setEntrypoint('server.js');
    else if (type === 'static_html') setEntrypoint('index.html');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold text-white tracking-tight font-display">
            Project Runtime Manager
          </h2>
          <p className="text-[13px] text-zinc-400 mt-0.5">
            Independent microservices & static frontends running natively in Termux
          </p>
        </div>
        <button
          onClick={() => {
            const usedPorts = projects.map(p => p.port);
            let nextPort = 8089;
            while (usedPorts.includes(nextPort)) nextPort++;
            setPort(nextPort);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[13px] font-semibold transition-all shadow-[0_2px_14px_rgba(255,255,255,0.15)]"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {actionError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[13px] flex items-center justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-amber-400/80 hover:text-amber-300 text-xs px-2 py-1 rounded-lg hover:bg-amber-500/10"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-zinc-500 text-[13px]">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-400 mx-auto mb-4">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-[16px] font-semibold text-white tracking-tight">No active projects</h3>
          <p className="text-[13px] text-zinc-400 mt-1.5 mb-6 leading-relaxed">
            Create your first FastAPI, Node.js or static website project to start hosting on OPPO Reno2 F.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-[13px] font-semibold rounded-2xl transition-all shadow-sm"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="glass-panel rounded-3xl p-5 flex flex-col justify-between hover:border-white/20 transition-all duration-300 group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-[15px] truncate tracking-tight" title={proj.name}>
                      {proj.name}
                    </h3>
                    <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
                      Port <span className="text-sky-300 font-semibold">:{proj.port}</span>
                    </span>
                  </div>
                  <StatusBadge status={proj.status} />
                </div>

                <p className="text-[12px] text-zinc-400 line-clamp-2 mt-2 mb-4 h-8 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>

                <div className="space-y-1.5 text-[11px] text-zinc-400 bg-black/40 p-3 rounded-2xl border border-white/[0.05] font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Runtime:</span>
                    <span className="text-zinc-300">{proj.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Entrypoint:</span>
                    <span className="text-zinc-300 truncate max-w-[140px]">{proj.entrypoint}</span>
                  </div>
                  {proj.pid && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">PID:</span>
                      <span className="text-emerald-400">{proj.pid}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {proj.status === 'running' ? (
                    <>
                      <button
                        onClick={() => handleStop(proj.id)}
                        title="Stop"
                        className="p-2 text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Square className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={() => handleRestart(proj.id)}
                        title="Restart"
                        className="p-2 text-amber-300 hover:bg-amber-500/10 rounded-xl transition-all"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStart(proj.id)}
                      title="Start"
                      className="p-2 text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}

                  <button
                    onClick={() => handleViewLogs(proj)}
                    title="Console Logs"
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  >
                    <Terminal className="w-4 h-4" />
                  </button>

                  {proj.status === 'running' && (
                    <a
                      href={`http://${activeHost}:${proj.port}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open http://${activeHost}:${proj.port}`}
                      className="p-2 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-xl transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <button
                  onClick={() => setProjectToDelete(proj)}
                  title="Delete"
                  className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apple Styled Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel border-white/20 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-[18px] font-semibold text-white tracking-tight font-display mb-1">
              Create Project
            </h3>
            <p className="text-[12px] text-zinc-400 mb-5">
              Scaffolds starter code and assigns dedicated port on OPPO Reno2 F.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Fast API Server"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Short summary of project purpose"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Runtime</label>
                  <select
                    value={projectType}
                    onChange={(e: any) => {
                      setProjectType(e.target.value);
                      updateEntrypointDefault(e.target.value);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-sky-400 cursor-pointer"
                  >
                    <option value="python_fastapi">Python (FastAPI / Starlette)</option>
                    <option value="python_flask">Python (Flask)</option>
                    <option value="nodejs_express">Node.js (Express)</option>
                    <option value="static_html">Static Website (HTML/JS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Port</label>
                  <input
                    type="number"
                    required
                    min={1024}
                    max={65535}
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-sky-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Entrypoint</label>
                <input
                  type="text"
                  required
                  value={entrypoint}
                  onChange={(e) => setEntrypoint(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-[13px] font-mono text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="auto_restart"
                  checked={autoRestart}
                  onChange={(e) => setAutoRestart(e.target.checked)}
                  className="rounded bg-black border-white/20 text-sky-500 focus:ring-0 w-4 h-4"
                />
                <label htmlFor="auto_restart" className="text-[12px] text-zinc-300 select-none cursor-pointer">
                  Auto-restart service watchdog if process exits
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-white rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 text-[13px] font-semibold text-black bg-white hover:bg-zinc-200 rounded-2xl transition-all shadow-md disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terminal Log Drawer */}
      {activeLogProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel border-white/20 rounded-3xl max-w-3xl w-full h-[75vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 px-6 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/[0.05] text-sky-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-white text-[14px]">
                  {activeLogProject.name} <span className="font-mono text-zinc-500 text-[12px]">(: {activeLogProject.port})</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewLogs(activeLogProject)}
                  className="px-3 py-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-white/10 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <RotateCw className="w-3 h-3" /> Refresh
                </button>
                <button
                  onClick={() => setActiveLogProject(null)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 flex-1 overflow-y-auto font-mono text-[11.5px] text-zinc-300 bg-black/60 selection:bg-sky-500/30">
              {loadingLogs ? (
                <div className="text-zinc-500">Reading logs from phone flash memory...</div>
              ) : logs.length === 0 ? (
                <div className="text-zinc-600 italic">No output logged yet.</div>
              ) : (
                <div className="space-y-1">
                  {logs.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap leading-relaxed hover:bg-white/[0.02] px-1 rounded">
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!projectToDelete}
        title="Delete Project"
        message={`Are you sure you want to permanently delete '${projectToDelete?.name}' and its files? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
};
