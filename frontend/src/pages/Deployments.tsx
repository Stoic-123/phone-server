import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  GitBranch,
  FileArchive,
  RotateCw,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  FileCode2,
  Terminal,
  AlertCircle
} from 'lucide-react';
import { Project, Deployment } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const Deployments: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [activeTab, setActiveTab] = useState<'git' | 'zip'>('git');

  // Git state
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');

  // ZIP state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Status & logs
  const [isDeploying, setIsDeploying] = useState(false);
  const [activeLog, setActiveLog] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projs = await api.getProjects();
        setProjects(projs);
        if (projs.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projs[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadDeploymentHistory(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadDeploymentHistory = async (id: string) => {
    try {
      const history = await api.getDeployments(id);
      setDeployments(history);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGitDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !repoUrl) return;
    setErrorBanner(null);

    try {
      setIsDeploying(true);
      setActiveLog('Initiating remote Git deployment...');
      const dep = await api.deployGit(selectedProjectId, repoUrl, branch);
      setActiveLog(dep.log);
      loadDeploymentHistory(selectedProjectId);
    } catch (err: any) {
      setErrorBanner(`Deployment failed: ${err.message}`);
      setActiveLog(`Deployment error: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleZipDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedFile) return;
    setErrorBanner(null);

    try {
      setIsDeploying(true);
      setActiveLog(`Uploading ${selectedFile.name} to OPPO Reno2 F...`);
      const dep = await api.deployZip(selectedProjectId, selectedFile);
      setActiveLog(dep.log);
      setSelectedFile(null);
      loadDeploymentHistory(selectedProjectId);
    } catch (err: any) {
      setErrorBanner(`ZIP deployment failed: ${err.message}`);
      setActiveLog(`ZIP deployment error: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-[22px] font-semibold text-white tracking-tight">
          Remote Deployment Engine
        </h2>
        <p className="text-[13px] text-zinc-400 mt-1">
          Deploy production source code to Termux via Git repository or drag-and-drop ZIP archives
        </p>
      </div>

      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-zinc-400 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-400 mx-auto mb-4">
            <FileCode2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">No Projects Available</h3>
          <p className="text-[13px] text-zinc-400 mt-1">
            Create a project first in the Projects tab before deploying.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-3xl p-6">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Target Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] focus:border-white/30 rounded-2xl px-4 py-2.5 text-[13px] text-white focus:outline-none transition-all mb-6 cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                    {p.name} (Port :{p.port} &bull; {p.type})
                  </option>
                ))}
              </select>

              {/* Apple Segmented Control */}
              <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex gap-1 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('git')}
                  className={`flex-1 py-2 text-[12px] font-medium rounded-xl flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'git'
                      ? 'bg-white text-black shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Git Repository
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('zip')}
                  className={`flex-1 py-2 text-[12px] font-medium rounded-xl flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'zip'
                      ? 'bg-white text-black shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileArchive className="w-3.5 h-3.5" />
                  ZIP Bundle
                </button>
              </div>

              {activeTab === 'git' ? (
                <form onSubmit={handleGitDeploy} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                      Git Repository URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/user/project.git"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.08] focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[12px] text-white focus:outline-none font-mono transition-all placeholder:text-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                      Target Branch
                    </label>
                    <input
                      type="text"
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.08] focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[12px] text-white focus:outline-none font-mono transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isDeploying}
                    className="w-full mt-2 py-3 px-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[13px] font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_2px_14px_rgba(255,255,255,0.15)]"
                  >
                    {isDeploying ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" /> Pulling & Deploying...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" /> Trigger Git Deploy
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleZipDeploy} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-2">
                      Upload ZIP Archive
                    </label>
                    <div className="border border-dashed border-white/[0.15] hover:border-white/30 hover:bg-white/[0.02] rounded-2xl p-6 text-center cursor-pointer transition-all bg-black/30">
                      <input
                        type="file"
                        accept=".zip"
                        id="zip-upload"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                      />
                      <label htmlFor="zip-upload" className="cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300 mx-auto mb-2.5">
                          <FileArchive className="w-5 h-5 text-sky-400" />
                        </div>
                        <span className="text-[12px] font-medium text-white block">
                          {selectedFile ? selectedFile.name : 'Choose or drop ZIP package'}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-1">
                          {selectedFile
                            ? `${Math.round(selectedFile.size / 1024)} KB`
                            : 'Fast auto-unpack into project root'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isDeploying || !selectedFile}
                    className="w-full mt-2 py-3 px-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[13px] font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_2px_14px_rgba(255,255,255,0.15)]"
                  >
                    {isDeploying ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" /> Unpacking & Deploying...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" /> Upload & Deploy
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* History & Output Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Deployment Output */}
            {activeLog && (
              <div className="glass-panel rounded-3xl p-5 border border-white/[0.1] shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[12px] font-medium text-zinc-300 font-mono">
                      deployment.log
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveLog(null)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
                <pre className="bg-black/60 p-4 rounded-2xl font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-64 whitespace-pre-wrap leading-relaxed border border-white/[0.04]">
                  {activeLog}
                </pre>
              </div>
            )}

            {/* Deployment History */}
            <div className="glass-panel rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Deployment History
                </h3>
                <span className="text-[11px] text-zinc-500">
                  {deployments.length} recorded
                </span>
              </div>

              {deployments.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-[12px] italic">
                  No previous deployments recorded for this project.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {deployments.map((d) => (
                    <div
                      key={d.id}
                      className="bg-black/30 border border-white/[0.06] p-3.5 rounded-2xl flex items-center justify-between hover:border-white/[0.12] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {d.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-white flex items-center gap-2">
                            <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/[0.08] text-zinc-300 font-mono">
                              {d.source_type}
                            </span>
                            <span className="font-mono text-zinc-300 truncate max-w-[200px]">
                              {d.source_ref}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ID: {d.id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={d.status} />
                        {d.log && (
                          <button
                            onClick={() => setActiveLog(d.log)}
                            className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                          >
                            View Log
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
