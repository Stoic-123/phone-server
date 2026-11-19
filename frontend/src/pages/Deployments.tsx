import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  GitBranch,
  FileArchive,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
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

    try {
      setIsDeploying(true);
      setActiveLog('Initiating remote Git deployment...');
      const dep = await api.deployGit(selectedProjectId, repoUrl, branch);
      setActiveLog(dep.log);
      loadDeploymentHistory(selectedProjectId);
    } catch (err: any) {
      setActiveLog(`Deployment error: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleZipDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedFile) return;

    try {
      setIsDeploying(true);
      setActiveLog(`Uploading ${selectedFile.name} to OPPO Reno2 F...`);
      const dep = await api.deployZip(selectedProjectId, selectedFile);
      setActiveLog(dep.log);
      setSelectedFile(null);
      loadDeploymentHistory(selectedProjectId);
    } catch (err: any) {
      setActiveLog(`ZIP deployment error: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Remote Deployment Engine</h2>
        <p className="text-sm text-slate-400">
          Push software releases from your Windows PC to the Android server via Git or ZIP bundles
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="p-8 bg-[#111827] border border-slate-800 rounded-xl text-center text-slate-400">
          Please create a project first before running deployments.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-sm">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Target Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 mb-5"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Port {p.port} - {p.type})
                  </option>
                ))}
              </select>

              {/* Deployment Method Tabs */}
              <div className="flex border-b border-slate-800 mb-5">
                <button
                  type="button"
                  onClick={() => setActiveTab('git')}
                  className={`flex-1 pb-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'git'
                      ? 'border-sky-500 text-sky-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  Git Repository
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('zip')}
                  className={`flex-1 pb-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'zip'
                      ? 'border-sky-500 text-sky-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <FileArchive className="w-4 h-4" />
                  ZIP Archive
                </button>
              </div>

              {activeTab === 'git' ? (
                <form onSubmit={handleGitDeploy} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Git Repository URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/user/project.git"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Branch</label>
                    <input
                      type="text"
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isDeploying}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeploying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Deploying from Git...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" /> Clone & Deploy
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleZipDeploy} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">Select ZIP Package</label>
                    <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-900/40">
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
                        <FileArchive className="w-8 h-8 text-sky-400 mx-auto mb-2" />
                        <span className="text-xs font-medium text-white block">
                          {selectedFile ? selectedFile.name : 'Click to browse ZIP bundle'}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-1">
                          {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'Up to 250MB supported'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isDeploying || !selectedFile}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeploying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Extracting & Deploying...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" /> Upload & Unpack
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* History & Logs Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Deployment Output */}
            {activeLog && (
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    Deployment Execution Output
                  </h3>
                  <button
                    onClick={() => setActiveLog(null)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Dismiss
                  </button>
                </div>
                <pre className="bg-black/70 p-4 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto max-h-64 whitespace-pre-wrap leading-relaxed border border-slate-900">
                  {activeLog}
                </pre>
              </div>
            )}

            {/* Deployment History */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Deployment History
              </h3>

              {deployments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm italic">
                  No previous deployments recorded for this project.
                </div>
              ) : (
                <div className="space-y-3">
                  {deployments.map((d) => (
                    <div
                      key={d.id}
                      className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-lg flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {d.status === 'success' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-2">
                            <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {d.source_type}
                            </span>
                            <span className="font-mono text-slate-300 truncate max-w-xs">{d.source_ref}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">ID: {d.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={d.status} />
                        {d.log && (
                          <button
                            onClick={() => setActiveLog(d.log)}
                            className="text-xs text-sky-400 hover:underline"
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
