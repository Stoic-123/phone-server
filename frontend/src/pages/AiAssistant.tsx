import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, AlertTriangle, Check, X, Sparkles, Smartphone, ShieldAlert } from 'lucide-react';
import { AiChatMessage, AiToolCall } from '../types';
import { api } from '../services/api';

export const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am **PocketDev AI Assistant**, running natively on your OPPO Reno2 F. I can monitor hardware health, diagnose stack traces, provide Helio P70 & ColorOS battery optimizations, and assist with process control.'
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
      setActionStatus(confirmed ? 'Executing confirmed operation...' : 'Cancelled operation.');
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
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-[#111827] border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              PocketDev AI Assistant
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Restricted Sandbox
              </span>
            </h2>
            <p className="text-xs text-slate-400">Context-aware diagnostics & server management</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-sky-400 border border-slate-700'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-sky-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* Pending Tool Confirmation Card */}
        {pendingToolCall && (
          <div className="max-w-xl mx-auto my-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <ShieldAlert className="w-4 h-4" />
              Confirmation Required For Restricted Tool Execution
            </div>
            <p className="text-xs text-slate-300">
              {pendingToolCall.description}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleToolDecision(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Approve & Execute
              </button>
              <button
                onClick={() => handleToolDecision(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-11">
            <Sparkles className="w-4 h-4 animate-spin text-sky-400" />
            PocketDev AI is analyzing server state...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] text-slate-500 shrink-0">Suggestions:</span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-[11px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-700/60"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask PocketDev AI (e.g. 'diagnose errors', 'optimize battery', 'status')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
