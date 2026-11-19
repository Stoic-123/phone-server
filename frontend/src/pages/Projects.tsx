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
  FileText,
  AlertCircle
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
  
  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<'python_fastapi' | 'python_flask' | 'nodejs_express' | 'static_html'>('python_fastapi');
  const [port, setPort] = useState<number>(8081);
  const [entrypoint, setEntrypoint] = useState('main.py');
  const [autoRestart, setAutoRestart] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Log Viewer state
  const [activeLogProject, setActiveLogProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Delete Modal state
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
      alert(`Error creating project: ${err.message}`);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await api.startProject(id);
      fetchProjects();
    } catch (err: any) {
      alert(`Start failed: ${err.message}`);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await api.stopProject(id);
      fetchProjects();
    } catch (err: any) {
      alert(`Stop failed: ${err.message}`);
    }
  };

  const handleRestart = async (id: string) => {
    try {
      await api.restartProject(id);
      fetchProjects();
    } catch (err: any) {
      alert(`Restart failed: ${err.message}`);
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
      alert(`Failed to delete project: ${err.message}`);
    }
  };

  const updateEntrypointDefault = (type: string) => {
    if (type === 'python_fastapi') setEntrypoint('main.py');
    else if (type === 'python_flask') setEntrypoint('app.py');
    else if (type === 'nodejs_express') setEntrypoint('server.js');
    else if (type === 'static_html') setEntrypoint('index.html');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Project Runtime Manager</h2>
          <p className="text-sm text-slate-400">
            Self-hosted microservices and web servers running natively on OPPO Reno2 F
          </p>
        </div>
        <button
          onClick={() => {
            // Find next available port suggestion
            const usedPorts = projects.map(p => p.port);
            let nextPort = 8081;
            while (usedPorts.includes(nextPort)) nextPort++;
            setPort(nextPort);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center">
          <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No projects created yet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Create your first FastAPI, Node.js or static website project to start hosting on Android.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-white text-base truncate" title={proj.name}>
                      {proj.name}
                    </h3>
                    <span className="text-xs font-mono text-slate-400 block mt-0.5">
                      Port: <span className="text-sky-400 font-semibold">{proj.port}</span>
                    </span>
                  </div>
                  <StatusBadge status={proj.status} />
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mt-2 mb-4 h-8">
                  {proj.description || 'No description provided.'}
                </p>

                <div className="space-y-1.5 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Runtime:</span>
                    <span className="text-slate-300">{proj.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Entrypoint:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">{proj.entrypoint}</span>
                  </div>
                  {proj.pid && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Process PID:</span>
                      <span className="text-emerald-400">{proj.pid}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {proj.status === 'running' ? (
                    <>
                      <button
                        onClick={() => handleStop(proj.id)}
                        title="Stop service"
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Square className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={() => handleRestart(proj.id)}
                        title="Restart service"
                        className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStart(proj.id)}
                      title="Start service"
                      className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}

                  <button
                    onClick={() => handleViewLogs(proj)}
                    title="View process logs"
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Terminal className="w-4 h-4" />
                  </button>

                  {proj.status === 'running' && (
                    <a
                      href={`http://${localIp}:${proj.port}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in browser"
                      className="p-2 text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <button
                  onClick={() => setProjectToDelete(proj)}
                  title="Delete project"
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Create New Project</h3>
            <p className="text-xs text-slate-400 mb-5">
              PocketDev will automatically scaffold starter code and assign a local port.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Fast API Server"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Short summary of application purpose"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Runtime Type</label>
                  <select
                    value={projectType}
                    onChange={(e: any) => {
                      setProjectType(e.target.value);
                      updateEntrypointDefault(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="python_fastapi">Python (FastAPI)</option>
                    <option value="python_flask">Python (Flask)</option>
                    <option value="nodejs_express">Node.js (Express)</option>
                    <option value="static_html">Static Website (HTML/JS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Server Port</label>
                  <input
                    type="number"
                    required
                    min={1024}
                    max={65535}
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Entrypoint File</label>
                <input
                  type="text"
                  required
                  value={entrypoint}
                  onChange={(e) => setEntrypoint(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="auto_restart"
                  checked={autoRestart}
                  onChange={(e) => setAutoRestart(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="auto_restart" className="text-xs text-slate-300 select-none">
                  Enable auto-restart watchdog if service crashes
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Viewer Drawer */}
      {activeLogProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-3xl w-full h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-sky-400" />
                <h3 className="font-semibold text-white text-sm">
                  Logs: {activeLogProject.name} (Port :{activeLogProject.port})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewLogs(activeLogProject)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Refresh
                </button>
                <button
                  onClick={() => setActiveLogProject(null)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-slate-300 bg-black/60 selection:bg-sky-600/50">
              {loadingLogs ? (
                <div className="text-slate-500">Reading process logs from storage...</div>
              ) : logs.length === 0 ? (
                <div className="text-slate-600 italic">No output lines recorded yet.</div>
              ) : (
                <div className="space-y-1">
                  {logs.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap leading-relaxed hover:bg-slate-900/50 px-1 rounded">
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!projectToDelete}
        title="Delete Project"
        message={`Are you sure you want to permanently delete '${projectToDelete?.name}' and all associated files? This cannot be undone.`}
        confirmLabel="Delete Permanently"
        onConfirm={confirmDelete}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
};
