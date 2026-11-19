import React, { useState } from 'react';
import { Terminal as TerminalIcon, Copy, Check, Laptop, Smartphone, Key, ShieldCheck } from 'lucide-react';
import { copyTextToClipboard } from '../utils/clipboard';

interface TerminalProps {
  localIp: string;
  sshPort?: number;
}

export const Terminal: React.FC<TerminalProps> = ({ localIp, sshPort = 8022 }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2000);
    }
  };

  const sshConnectCmd = `ssh -p ${sshPort} u0_a253@${localIp}`;
  const keygenCmd = `ssh-keygen -t ed25519 -C "pocketdev-windows"`;
  const copyKeyCmd = `type $env:USERPROFILE\\.ssh\\id_ed25519.pub | ssh -p ${sshPort} u0_a253@${localIp} "cat >> ~/.ssh/authorized_keys"`;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-[22px] font-semibold text-white tracking-tight">
          Terminal & SSH Console
        </h2>
        <p className="text-[13px] text-zinc-400 mt-1">
          High-performance OpenSSH shell directly into your OPPO Reno2 F non-root userland
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* macOS Terminal Window for SSH */}
        <div className="glass-panel rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold text-[14px]">
              <Laptop className="w-4 h-4 text-sky-400" />
              <span>Connect via PowerShell</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
              Port :{sshPort}
            </span>
          </div>

          <p className="text-[12px] text-zinc-400 leading-relaxed">
            Open Windows Terminal or PowerShell on your PC and run the command below to spawn an interactive shell:
          </p>

          {/* Terminal Window Chrome */}
          <div className="rounded-2xl overflow-hidden border border-white/[0.1] bg-[#0c0f16] shadow-2xl">
            <div className="px-3.5 py-2.5 bg-white/[0.04] border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <span className="text-[11px] font-mono text-zinc-500">powershell.exe</span>
              <div className="w-10" />
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <code className="font-mono text-[12px] text-sky-300 select-all break-all">
                {sshConnectCmd}
              </code>
              <button
                onClick={() => copyToClipboard(sshConnectCmd, 'ssh')}
                className="shrink-0 p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-zinc-300 hover:text-white transition-all active:scale-95"
                title="Copy command"
              >
                {copiedCmd === 'ssh' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300 font-semibold block mb-0.5">Termux Username:</strong>
            The default user on your device is <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-white">u0_a253</code>. You can set or change your SSH login password anytime in Termux by running <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-white">passwd</code>.
          </div>
        </div>

        {/* SSH Key Setup Window */}
        <div className="glass-panel rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-white font-semibold text-[14px]">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Passwordless SSH Key Authentication</span>
          </div>

          <p className="text-[12px] text-zinc-400 leading-relaxed">
            Authorize your public key once to enable instant zero-password terminal access and automated builds:
          </p>

          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-medium text-zinc-400 block mb-1.5">
                1. Generate Ed25519 Key on Windows:
              </span>
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-3 flex items-center justify-between gap-3">
                <code className="font-mono text-[11px] text-zinc-300 break-all">{keygenCmd}</code>
                <button
                  onClick={() => copyToClipboard(keygenCmd, 'keygen')}
                  className="shrink-0 p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-all"
                >
                  {copiedCmd === 'keygen' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-zinc-400 block mb-1.5">
                2. Copy Key to OPPO Reno2 F:
              </span>
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-3 flex items-center justify-between gap-3">
                <code className="font-mono text-[11px] text-zinc-300 break-all">{copyKeyCmd}</code>
                <button
                  onClick={() => copyToClipboard(copyKeyCmd, 'copykey')}
                  className="shrink-0 p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-all"
                >
                  {copiedCmd === 'copykey' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Termux Commands Grid */}
      <div className="glass-panel rounded-3xl p-6">
        <h3 className="text-[14px] font-semibold text-white mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-sky-400" />
          Recommended Termux Maintenance Shortcuts
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
          <div className="bg-black/30 p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all">
            <span className="font-mono text-sky-400 font-semibold block mb-1">termux-wake-lock</span>
            <span className="text-zinc-400 leading-relaxed block">
              Acquires an Android wake-lock to prevent MediaTek Helio P70 deep-sleep when the phone display turns off.
            </span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all">
            <span className="font-mono text-sky-400 font-semibold block mb-1">tmux new -s pocketdev</span>
            <span className="text-zinc-400 leading-relaxed block">
              Spawns an asynchronous terminal multiplexer session that keeps running even if the SSH connection drops.
            </span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all">
            <span className="font-mono text-sky-400 font-semibold block mb-1">sshd</span>
            <span className="text-zinc-400 leading-relaxed block">
              Starts or restarts the OpenSSH daemon daemon manually on port 8022.
            </span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all">
            <span className="font-mono text-sky-400 font-semibold block mb-1">htop</span>
            <span className="text-zinc-400 leading-relaxed block">
              Interactive process viewer displaying per-core Helio P70 CPU cluster utilization and RAM usage.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
