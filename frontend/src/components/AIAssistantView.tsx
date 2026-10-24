import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  User as UserIcon,
  HelpCircle,
  Database,
  Lock
} from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIAssistantView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I am MoneyMirror AI, your read-only personal financial copilot. I analyze your confirmed financial records to help you understand trends, monitor expenses, and identify opportunities to save. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    'Where did most of my money go this month?',
    'Compare this month with last month',
    'What was my biggest expense?',
    'How much did I spend on food & dining?',
    'Where might I reduce expenses?',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.chat(text);
      const botMsg: Message = {
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to MoneyMirror AI assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 h-[calc(100vh-140px)] flex flex-col pb-6">
      {/* Assistant Header & Security Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-borderSubtle">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-control bg-greenDeep text-lime border border-borderSubtle flex items-center justify-center shadow-glow">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-ink-primary tracking-tight">MoneyMirror AI Copilot</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-greenActive text-lime border border-borderSubtle">
                Gemma 3 • RAG
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              Grounded strictly in your confirmed database records
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cardRaised border border-borderSubtle text-lime text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Strictly Read-Only Analysis</span>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-ink-muted whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-lime" />
          Suggested:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            disabled={isLoading}
            className="text-xs bg-panel border border-borderSubtle hover:border-lime/40 text-ink-secondary hover:text-ink-primary px-3 py-1 rounded-full whitespace-nowrap transition-colors disabled:opacity-50"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 rounded-card bg-panel border border-borderSubtle shadow-card space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-greenDeep text-lime border border-borderSubtle'
                    : 'bg-greenActive text-lime border border-borderSubtle shadow-glow'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-card p-4 text-xs leading-relaxed space-y-1 shadow-sm ${
                  isUser
                    ? 'bg-greenActive border border-borderSubtle text-ink-primary'
                    : 'bg-cardRaised border border-borderSubtle text-ink-secondary'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-ink-muted mb-1">
                  <span className="font-semibold uppercase tracking-wider">
                    {isUser ? 'You' : 'MoneyMirror AI'}
                  </span>
                  <span className="font-mono">{m.timestamp}</span>
                </div>
                <div className="whitespace-pre-line text-xs font-medium">{m.content}</div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-greenActive text-lime border border-borderSubtle flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-card p-4 bg-cardRaised border border-borderSubtle text-xs text-ink-muted flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-lime" />
              <span>Analyzing financial records & synthesizing response...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-control bg-danger/15 border border-danger/40 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 p-2 rounded-control bg-panel border border-borderSubtle shadow-card"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your income, spending, or financial habits..."
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-control bg-lime text-app hover:bg-lime-hover disabled:opacity-40 transition-all shadow-glow flex-shrink-0"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
};
