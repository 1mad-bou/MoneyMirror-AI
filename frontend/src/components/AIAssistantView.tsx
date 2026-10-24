import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  User as UserIcon,
  HelpCircle
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
        "Hello! I am MoneyMirror AI, your personal financial analysis assistant. I use verified data from your records to help you understand your spending patterns, track trends, and identify areas to save. How can I help you today?",
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
    'Compare this month with last month.',
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
      setError(err.message || 'Unable to connect to AI assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 h-[calc(100vh-140px)] flex flex-col">
      {/* Assistant Header & Security Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-borderSubtle">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink flex items-center gap-2">
            <Bot className="w-6 h-6 text-forest" />
            Financial Analysis Assistant
          </h2>
          <p className="text-xs text-ink-muted">
            Powered by Gemma 3 & local RAG retrieval
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest/5 border border-forest/10 text-forest text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-forest" />
          <span>Strictly Read-Only Analysis</span>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-ink-muted whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-forest" />
          Try asking:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            disabled={isLoading}
            className="text-xs bg-surface border border-borderSubtle hover:border-forest/40 text-ink px-3 py-1 rounded-full whitespace-nowrap transition-colors shadow-2xs disabled:opacity-50"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 rounded-card bg-surface border border-borderSubtle shadow-sm space-y-4">
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
                    ? 'bg-forest text-lime'
                    : 'bg-lime text-forest border border-forest/20 shadow-sm'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-card p-3.5 sm:p-4 text-xs leading-relaxed space-y-1 shadow-2xs ${
                  isUser
                    ? 'bg-forest text-white rounded-tr-none'
                    : 'bg-surface-muted text-ink rounded-tl-none border border-borderSubtle'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div
                  className={`text-[10px] text-right pt-1 ${
                    isUser ? 'text-white/50' : 'text-ink-muted'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-lime text-forest flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-card rounded-tl-none p-3.5 bg-surface-muted border border-borderSubtle text-xs text-ink-muted flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-forest" />
              <span>Analyzing authorized financial records...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-control bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your income, expenses, trends, or savings..."
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-control bg-surface border border-borderSubtle text-ink text-xs focus:outline-none focus:ring-1 focus:ring-forest shadow-sm"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3 rounded-control bg-forest text-white hover:bg-forest-light disabled:opacity-40 transition-colors shadow-sm"
        >
          <Send className="w-4 h-4 text-lime" />
        </button>
      </form>
    </div>
  );
};

