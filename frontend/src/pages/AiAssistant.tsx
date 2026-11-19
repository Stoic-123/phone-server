import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Check, X, Sparkles, ShieldCheck } from 'lucide-react';
import { AiChatMessage, AiToolCall } from '../types';
import { api } from '../services/api';

export const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am **PocketDev AI Assistant**, running directly on your OPPO Reno2 F.\n\nI can monitor real-time hardware status, diagnose application stack traces, suggest MediaTek Helio P70 optimizations, and help supervise project runtimes.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingToolCall, setPendingToolCall] = useState<AiToolCall | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingToolCall]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: AiChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.aiChat(text, undefined, messages);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      if (res.tool_call) {
        setPendingToolCall(res.tool_call);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error communicating with AI service: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToolDecision = async (confirmed: boolean) => {
    if (!pendingToolCall || !pendingToolCall.action_id) return;

    try {
      setActionStatus(confirmed ? 'Executing approved operation...' : 'Cancelled operation.');
      const res = await api.aiExecuteAction(pendingToolCall.action_id, confirmed);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: confirmed
            ? `**Action Executed**: ${res.message}`
            : 'Action was cancelled by user.'
        }
      ]);
      setPendingToolCall(null);
    } catch (err: any) {
      alert(`Tool execution failed: ${err.message}`);
    } finally {
      setActionStatus(null);
    }
  };

  const quickPrompts = [
    'How is server health and memory usage?',
    'Give me Helio P70 and ColorOS optimization tips',
    'Show recent project errors',
    'What is the OpenSSH port and connection command?'
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col glass-panel rounded-3xl shadow-2xl overflow-hidden max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-4 px-6 glass-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-sky-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-white tracking-tight flex items-center gap-2">
              PocketDev Assistant
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                Sandboxed
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">Hardware telemetry & runtime diagnostic engine</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 text-[12px] font-medium shadow-sm ${
                m.role === 'user'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/[0.06] border border-white/10 text-sky-400'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-xl p-4 rounded-3xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-white text-black rounded-tr-none font-medium'
                  : 'glass-panel text-zinc-200 rounded-tl-none shadow-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* Confirmation Card */}
        {pendingToolCall && (
          <div className="max-w-xl mx-auto my-4 p-5 glass-panel border-amber-500/30 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-[13px]">
              <ShieldCheck className="w-4 h-4" />
              Restricted Operation Confirmation
            </div>
            <p className="text-[12px] text-zinc-300">
              {pendingToolCall.description}
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => handleToolDecision(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => handleToolDecision(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-zinc-300 text-[12px] font-medium rounded-xl flex items-center gap-1.5 transition-all"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-zinc-400 pl-11">
            <Sparkles className="w-4 h-4 animate-spin text-sky-400" />
            Analyzing telemetry and project logs...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Pill Row */}
      <div className="px-6 py-2.5 border-t border-white/[0.04] bg-white/[0.01] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-medium text-zinc-500 shrink-0">Quick Prompts:</span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-[11px] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white px-3 py-1 rounded-full whitespace-nowrap transition-all border border-white/[0.06]"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 px-4 glass-header border-t border-white/[0.06] flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask PocketDev AI anything about your server..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-sky-400 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-white text-black hover:bg-zinc-200 rounded-2xl transition-all disabled:opacity-40 shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
