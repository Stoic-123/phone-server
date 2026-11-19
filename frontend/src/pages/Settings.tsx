import React, { useState } from 'react';
import { Key, Shield, Battery, CheckCircle2, AlertCircle, Smartphone, Lock, RotateCw } from 'lucide-react';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdStatus, setPwdStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setPwdStatus({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    try {
      setSavingPwd(true);
      await api.changePassword(currentPassword, newPassword);
      setPwdStatus({ type: 'success', message: 'Administrator password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdStatus({ type: 'error', message: err.message || 'Failed to update password' });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-fadeIn">
      <div>
        <h2 className="text-[22px] font-semibold text-white tracking-tight">
          Server Settings & Security
        </h2>
        <p className="text-[13px] text-zinc-400 mt-1">
          Manage administrator credentials, session security, and ColorOS battery sleep policies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Administrator Credentials Card */}
        <div className="glass-panel rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-2.5 text-white font-semibold text-[14px]">
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-sky-400">
              <Key className="w-4 h-4" />
            </div>
            <span>Change Admin Password</span>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[12px] text-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[12px] text-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[12px] text-white focus:outline-none transition-all"
              />
            </div>

            {pwdStatus && (
              <div
                className={`p-3 rounded-2xl text-[12px] flex items-center gap-2 ${
                  pwdStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}
              >
                {pwdStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{pwdStatus.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={savingPwd}
              className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[13px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_2px_14px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2"
            >
              {savingPwd ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" /> Updating Credentials...
                </>
              ) : (
                'Save Password'
              )}
            </button>
          </form>
        </div>

        {/* ColorOS Battery Persistence Checklist */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-white font-semibold text-[14px]">
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-emerald-400">
              <Battery className="w-4 h-4" />
            </div>
            <span>ColorOS 11 Persistence Guide</span>
          </div>

          <p className="text-[12px] text-zinc-400 leading-relaxed">
            OPPO Reno2 F runs ColorOS, which aggressively pauses inactive background apps. Configure these four steps on the phone to keep PocketDev running 24/7 with the screen locked:
          </p>

          <div className="space-y-3 pt-1">
            <div className="bg-black/30 p-3.5 rounded-2xl border border-white/[0.06] flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[11px] font-semibold text-zinc-300 shrink-0 mt-0.5">
                1
              </span>
              <div className="text-[11.5px] text-zinc-300">
                <strong className="text-white block">Disable Battery Optimization:</strong>
                Settings &gt; Battery &gt; App Battery Management &gt; Termux &gt; Select <em className="text-sky-300 not-italic font-medium">Allow Background Activity</em>.
              </div>
            </div>

            <div className="bg-black/30 p-3.5 rounded-2xl border border-white/[0.06] flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[11px] font-semibold text-zinc-300 shrink-0 mt-0.5">
                2
              </span>
              <div className="text-[11.5px] text-zinc-300">
                <strong className="text-white block">Allow Auto-Startup:</strong>
                Settings &gt; App Management &gt; Auto-launch apps &gt; Toggle <em className="text-sky-300 not-italic font-medium">Termux ON</em>.
              </div>
            </div>

            <div className="bg-black/30 p-3.5 rounded-2xl border border-white/[0.06] flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[11px] font-semibold text-zinc-300 shrink-0 mt-0.5">
                3
              </span>
              <div className="text-[11.5px] text-zinc-300">
                <strong className="text-white block">Lock App in Recent Tasks:</strong>
                Swipe up and hold to open App Switcher, tap the two dots next to Termux, and select <em className="text-sky-300 not-italic font-medium">Lock</em>.
              </div>
            </div>

            <div className="bg-black/30 p-3.5 rounded-2xl border border-white/[0.06] flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[11px] font-semibold text-zinc-300 shrink-0 mt-0.5">
                4
              </span>
              <div className="text-[11.5px] text-zinc-300">
                <strong className="text-white block">Acquire Android Wake-Lock:</strong>
                Run <code className="bg-white/10 px-1.5 py-0.5 rounded text-sky-300 font-mono">termux-wake-lock</code> in Termux.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
