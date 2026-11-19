import React, { useState, useEffect } from 'react';
import { Smartphone, Lock, User, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialCreds, setInitialCreds] = useState<{ initial_setup_required: boolean; initial_password?: string } | null>(null);

  useEffect(() => {
    const checkInitial = async () => {
      try {
        const creds = await api.getInitialCredentials();
        if (creds.initial_setup_required && creds.initial_password) {
          setInitialCreds(creds);
          setPassword(creds.initial_password);
        }
      } catch (e) {
        // Ignore
      }
    };
    checkInitial();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.login(username, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111827] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-sky-900/40">
            <Smartphone className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">PocketDev Server</h1>
          <p className="text-xs text-slate-400">
            OPPO Reno2 F Development Server Administration
          </p>
        </div>

        {initialCreds && initialCreds.initial_password && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <KeyRound className="w-4 h-4" /> First-Time Setup Password Detected
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Auto-filled generated temporary password: <code className="bg-black/40 px-1 py-0.5 rounded font-mono font-bold">{initialCreds.initial_password}</code>. You can change this anytime in Settings.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign In to Dashboard <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800 text-[11px] text-slate-500">
          Non-Root Termux Node &bull; Protected Management Layer
        </div>
      </div>
    </div>
  );
};
