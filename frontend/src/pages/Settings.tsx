import React, { useState } from 'react';
import { Key, Shield, Battery, Sliders, Check, Copy, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdStatus, setPwdStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);

  // Settings
  const [copiedKey, setCopiedKey] = useState(false);

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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Server & Security Settings</h2>
        <p className="text-sm text-slate-400">
          Configure security credentials, Android battery optimizations, and daemon preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Administrator Password */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-white font-semibold text-sm mb-4">
            <Key className="w-4 h-4 text-sky-400" />
            Change Admin Password
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {pwdStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs ${
                  pwdStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {pwdStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={savingPwd}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              {savingPwd ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>

        {/* OPPO Reno2 F Power Management Guide */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Battery className="w-4 h-4 text-emerald-400" />
            ColorOS Background Persistence Guide
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            OPPO Reno2 F runs ColorOS, which aggressively kills background apps to conserve battery. To ensure PocketDev keeps running with the screen locked:
          </p>

          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400">
            <li>
              <strong className="text-slate-200">Disable Battery Optimization:</strong> Settings &gt; Battery &gt; App Battery Management &gt; Termux &gt; Select <em className="text-sky-300">Allow Background Activity</em>.
            </li>
            <li>
              <strong className="text-slate-200">Allow Auto Startup:</strong> Settings &gt; App Management &gt; Auto-launch apps &gt; Toggle <em className="text-sky-300">Termux ON</em>.
            </li>
            <li>
              <strong className="text-slate-200">Lock App in Recent Tasks:</strong> Open Android App Switcher (swipe up and hold), tap the two dots next to Termux, and select <em className="text-sky-300">Lock</em>.
            </li>
            <li>
              <strong className="text-slate-200">Acquire Wake Lock:</strong> Run <code className="bg-black/40 px-1 py-0.5 rounded text-sky-300 font-mono">termux-wake-lock</code> in Termux.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
