import React, { useState, useEffect } from 'react';
import { Smartphone, Lock, User, ArrowRight, KeyRound, AlertCircle, RotateCw } from 'lucide-react';
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
    <div className="min-h-screen bg-[#06080c] flex items-center justify-center p-4 selection:bg-white/20">
      <div className="max-w-sm w-full glass-panel rounded-3xl p-8 border border-white/[0.1] shadow-2xl space-y-6 animate-fadeIn">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/[0.12] mx-auto flex items-center justify-center text-white shadow-lg">
            <Smartphone className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold text-white tracking-tight">PocketDev Server</h1>
            <p className="text-[12px] text-zinc-400 mt-0.5">
              OPPO Reno2 F &bull; Helio P70 Node
            </p>
          </div>
        </div>

        {initialCreds && initialCreds.initial_password && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11.5px] text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>Temporary Setup Password</span>
            </div>
            <p className="text-amber-200/90 leading-relaxed">
              Auto-filled temporary password: <code className="bg-black/50 px-1.5 py-0.5 rounded font-mono font-bold text-white">{initialCreds.initial_password}</code>.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[12px] text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] focus:border-white/30 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] focus:border-white/30 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[13px] font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_2px_14px_rgba(255,255,255,0.15)] disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                Unlock Dashboard <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-white/[0.06] text-[10px] text-zinc-500 tracking-wider uppercase font-medium">
          Protected Non-Root Management Shell
        </div>
      </div>
    </div>
  );
};
