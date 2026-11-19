import React, { useState } from 'react';
import { Terminal as TerminalIcon, Copy, Check, ShieldCheck, Key, Laptop, Smartphone } from 'lucide-react';

interface TerminalProps {
  localIp: string;
  sshPort?: number;
}

export const Terminal: React.FC<TerminalProps> = ({ localIp, sshPort = 8022 }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const sshConnectCmd = `ssh -p ${sshPort} u0_a200@${localIp}`;
  const keygenCmd = `ssh-keygen -t ed25519 -C "pocketdev-windows"`;
  const copyKeyCmd = `type $env:USERPROFILE\\.ssh\\id_ed25519.pub | ssh -p ${sshPort} u0_a200@${localIp} "cat >> ~/.ssh/authorized_keys"`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Terminal & Remote SSH Access</h2>
        <p className="text-sm text-slate-400">
          Secure non-root terminal access to Termux on your OPPO Reno2 F from Windows PowerShell
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Connect Guide */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-base">
            <Laptop className="w-5 h-5" />
            <h3>Connect from Windows PowerShell</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Termux runs an unprivileged OpenSSH daemon on high port <strong className="text-white">8022</strong> (since ports below 1024 require Android root). Open PowerShell on your PC and run:
          </p>

          <div className="relative group bg-black/80 border border-slate-800 rounded-lg p-3 font-mono text-xs text-sky-300">
            <code>{sshConnectCmd}</code>
            <button
              onClick={() => copyToClipboard(sshConnectCmd, 'ssh')}
              className="absolute right-2 top-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
              title="Copy command"
            >
              {copiedCmd === 'ssh' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300/90 leading-relaxed">
            <strong>Note on Termux Username:</strong> In Termux, query your exact username by typing <code className="bg-black/40 px-1 py-0.5 rounded">whoami</code> (usually format <code className="bg-black/40 px-1 py-0.5 rounded">u0_a...</code>). You can also set a password anytime in Termux by running <code className="bg-black/40 px-1 py-0.5 rounded">passwd</code>.
          </div>
        </div>

        {/* SSH Key Authentication */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-base">
            <Key className="w-5 h-5" />
            <h3>Passwordless SSH Key Setup</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            For maximum security and automated deployments without password prompts:
          </p>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">1. Generate Ed25519 keypair on Windows:</span>
              <div className="relative bg-black/80 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-300">
                <code>{keygenCmd}</code>
                <button
                  onClick={() => copyToClipboard(keygenCmd, 'keygen')}
                  className="absolute right-2 top-2 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400"
                >
                  {copiedCmd === 'keygen' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">2. Authorize key on OPPO Reno2 F:</span>
              <div className="relative bg-black/80 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-300">
                <code className="text-[11px] break-all">{copyKeyCmd}</code>
                <button
                  onClick={() => copyToClipboard(copyKeyCmd, 'copykey')}
                  className="absolute right-2 top-2 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400"
                >
                  {copiedCmd === 'copykey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Useful Termux Server Commands */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-sky-400" />
          Recommended Termux Maintenance Commands
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-sky-400 font-semibold block mb-1">termux-wake-lock</span>
            <span className="text-slate-400 font-sans">Acquires an Android wake lock to prevent CPU sleep when screen turns off.</span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-sky-400 font-semibold block mb-1">tmux new -s pocketdev</span>
            <span className="text-slate-400 font-sans">Spawns a persistent terminal multiplexer session that survives network drops.</span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-sky-400 font-semibold block mb-1">sshd</span>
            <span className="text-slate-400 font-sans">Starts the OpenSSH server daemon manually on port 8022.</span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-sky-400 font-semibold block mb-1">pkill sshd</span>
            <span className="text-slate-400 font-sans">Stops active OpenSSH daemon.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
