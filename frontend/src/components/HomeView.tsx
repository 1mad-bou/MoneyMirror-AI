import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ChevronRight,
  Plus,
  Send,
  Bot,
  Sparkles,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { DashboardSummary, Transaction, api } from '@/lib/api';

interface HomeViewProps {
  summary: DashboardSummary | null;
  recentTransactions: Transaction[];
  onNavigate: (tab: string, options?: { moneyType?: 'income' | 'expense'; recipient?: string }) => void;
  onOpenTransactionDetail: (tx: Transaction) => void;
  onSelectCurrency: (curr: string) => void;
  selectedCurrency: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  summary,
  recentTransactions,
  onNavigate,
  onOpenTransactionDetail,
  onSelectCurrency,
  selectedCurrency,
}) => {
  const primary = summary?.primary_summary || {
    currency: selectedCurrency,
    total_income: '0.00',
    total_expenses: '0.00',
    net_cash_flow: '0.00',
    transaction_count: 0,
  };

  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string }>>([
    {
      role: 'assistant',
      text: 'I am MoneyMirror AI, a read-only copilot. Ask about cash flow or spending that is already in your records.',
    },
  ]);

  const handleSendAi = async (customPrompt?: string) => {
    const text = (customPrompt || aiInput).trim();
    if (!text || aiLoading) return;

    setAiMessages((prev) => [...prev, { role: 'user', text }]);
    setAiInput('');
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await api.chat(text);
      setAiMessages((prev) => [...prev, { role: 'assistant', text: res.reply }]);
    } catch (err: any) {
      const message = err.message || 'Failed to analyze data. Please try again.';
      setAiError(message);
      setAiMessages((prev) => [...prev, { role: 'assistant', text: message }]);
    } finally {
      setAiLoading(false);
    }
  };

  const categories = summary?.top_categories || [];
  const chartColors = ['#C7F451', '#87E5CB', '#A9D83C', '#28451D', '#7E897E'];
  const circumference = 2 * Math.PI * 40;
  let donutOffset = 0;

  return (
    <div className="max-w-[1440px] mx-auto pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 relative overflow-hidden rounded-hero bg-leaf-hero border border-borderSubtle p-6 sm:p-7 min-h-[236px] flex flex-col justify-between">
              <div className="absolute -right-10 -bottom-8 w-44 h-44 rounded-full border border-borderSubtle/50 pointer-events-none" />
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink-muted font-bold mb-1">
                    Total balance
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl lg:text-[44px] font-black text-ink-primary font-tnum tracking-tight">
                      {primary.net_cash_flow}
                    </span>
                    <span className="text-base font-bold text-lime">{primary.currency}</span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-2">
                    Net cash flow from recorded income and expenses this workspace
                  </p>
                </div>
                <label className="bg-cardRaised/90 border border-borderSubtle rounded-control px-2.5 py-1 flex items-center gap-1.5">
                  <span className="text-[10px] text-ink-muted">Currency</span>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => onSelectCurrency(e.target.value)}
                    className="bg-transparent text-xs font-bold text-lime focus:outline-none cursor-pointer"
                    aria-label="Select currency"
                  >
                    {summary?.currencies && summary.currencies.length > 0 ? (
                      summary.currencies.map((c) => (
                        <option key={c.currency} value={c.currency} className="bg-panel">
                          {c.currency}
                        </option>
                      ))
                    ) : (
                      <option value={selectedCurrency} className="bg-panel">
                        {selectedCurrency}
                      </option>
                    )}
                  </select>
                </label>
              </div>

              <div className="relative z-10 pt-6 mt-4 border-t border-borderSubtle/70 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onNavigate('add', { moneyType: 'income' })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control text-xs font-bold bg-lime text-app hover:bg-lime-hover"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  Add Money
                </button>
                <button
                  onClick={() => onNavigate('add', { moneyType: 'expense' })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control text-xs font-semibold bg-cardRaised border border-borderSubtle text-ink-primary hover:bg-cardHover"
                >
                  Withdraw
                </button>
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col gap-3">
              <div className="flex-1 rounded-card bg-panel border border-borderSubtle p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-success/15 border border-success/30 text-success flex items-center justify-center">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Income</p>
                      <p className="text-lg font-black text-ink-primary font-tnum">
                        +{primary.total_income}{' '}
                        <span className="text-xs font-semibold text-ink-muted">{primary.currency}</span>
                      </p>
                    </div>
                  </div>
                  <svg className="w-16 h-8" viewBox="0 0 64 32" aria-hidden>
                    <polyline fill="none" stroke="#8FE36A" strokeWidth="2" strokeLinecap="round" points="2,26 14,20 28,24 42,10 56,16 62,6" />
                  </svg>
                </div>
                <p className="text-[10px] text-ink-muted pt-2 border-t border-borderSubtle/50 mt-3">
                  Incoming recorded amounts · {primary.transaction_count} transactions in summary
                </p>
              </div>

              <div className="flex-1 rounded-card bg-panel border border-borderSubtle p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-danger/15 border border-danger/30 text-danger flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Expenses</p>
                      <p className="text-lg font-black text-ink-primary font-tnum">
                        -{primary.total_expenses}{' '}
                        <span className="text-xs font-semibold text-ink-muted">{primary.currency}</span>
                      </p>
                    </div>
                  </div>
                  <svg className="w-16 h-8" viewBox="0 0 64 32" aria-hidden>
                    <polyline fill="none" stroke="#FF6464" strokeWidth="2" strokeLinecap="round" points="2,10 16,18 30,12 44,22 56,16 62,28" />
                  </svg>
                </div>
                <p className="text-[10px] text-ink-muted pt-2 border-t border-borderSubtle/50 mt-3">
                  Outgoing recorded amounts for {primary.currency}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-card bg-panel border border-borderSubtle p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Quick Transfer</h3>
              <button
                onClick={() => onNavigate('transfers')}
                className="text-[11px] font-semibold text-lime hover:underline flex items-center gap-1"
              >
                Open transfers <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => onNavigate('transfers')}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="w-11 h-11 rounded-full border border-dashed border-borderSubtle text-ink-muted hover:border-lime hover:text-lime bg-cardRaised flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium text-ink-secondary">Add</span>
              </button>
              <p className="text-[11px] text-ink-muted max-w-xs">
                Saved recipients are not stored yet. Use Add to record a transfer with a name you enter.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {[
              { label: 'Cash', value: `${primary.net_cash_flow} ${primary.currency}`, icon: Wallet },
              { label: 'Income', value: `+${primary.total_income}`, icon: ArrowDownLeft },
              { label: 'Spending', value: `-${primary.total_expenses}`, icon: ArrowUpRight },
            ].map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.label}
                  onClick={() => onNavigate('activity')}
                  className="text-left rounded-card bg-panel border border-borderSubtle p-4 hover:bg-cardRaised"
                >
                  <div className="w-7 h-7 rounded-control bg-cardRaised border border-borderSubtle flex items-center justify-center text-lime mb-2">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] text-ink-muted font-medium">{acc.label}</p>
                  <p className="text-sm font-extrabold text-ink-primary font-tnum mt-0.5">{acc.value}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 rounded-card bg-panel border border-borderSubtle p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Spending Breakdown</h3>
                  <p className="text-sm font-bold text-ink-primary">Category share</p>
                </div>
                <button onClick={() => onNavigate('activity')} className="text-xs font-semibold text-lime hover:underline">
                  See details
                </button>
              </div>

              {categories.length === 0 ? (
                <p className="py-10 text-center text-xs text-ink-muted">No category spending in this currency yet.</p>
              ) : (
                <>
                  <div className="relative flex items-center justify-center py-3">
                    <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100" role="img" aria-label="Spending by category">
                      <circle cx="50" cy="50" r="40" stroke="#1D2B20" strokeWidth="12" fill="none" />
                      {categories.map((cat, i) => {
                        const pct = Math.max(0, Math.min(100, cat.percentage));
                        const dash = (pct / 100) * circumference;
                        const offset = donutOffset;
                        donutOffset += dash;
                        return (
                          <circle
                            key={cat.category_name + i}
                            cx="50"
                            cy="50"
                            r="40"
                            stroke={chartColors[i % chartColors.length]}
                            strokeWidth="12"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-offset}
                            fill="none"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-[10px] uppercase text-ink-muted font-bold">Total spent</span>
                      <span className="text-sm font-black text-ink-primary font-tnum">{primary.total_expenses}</span>
                      <span className="text-[9px] text-lime">{primary.currency}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 pt-2 border-t border-borderSubtle mt-2">
                    {categories.slice(0, 4).map((c, i) => (
                      <li key={c.category_name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                          <span className="text-ink-secondary truncate">{c.category_name}</span>
                        </div>
                        <span className="font-tnum font-bold text-ink-primary">
                          {c.percentage}% · {c.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="md:col-span-7 rounded-card bg-panel border border-borderSubtle p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Recent Transactions</h3>
                  <p className="text-sm font-bold text-ink-primary">Latest activity</p>
                </div>
                <button
                  onClick={() => onNavigate('activity')}
                  className="text-xs font-semibold text-lime hover:underline flex items-center gap-1"
                >
                  See all <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {recentTransactions.length === 0 ? (
                <p className="py-8 text-center text-xs text-ink-muted">
                  No transactions yet. Use Add Money or Scan Receipt to start.
                </p>
              ) : (
                <div className="divide-y divide-borderSubtle">
                  {recentTransactions.slice(0, 5).map((tx) => {
                    const isExpense = tx.type === 'expense';
                    return (
                      <button
                        key={tx.id}
                        onClick={() => onOpenTransactionDetail(tx)}
                        className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-cardHover/60 rounded-control px-1"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isExpense ? 'bg-danger/10 border border-danger/30 text-danger' : 'bg-success/10 border border-success/30 text-success'
                            }`}
                          >
                            {isExpense ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-ink-primary truncate">
                              {tx.merchant || tx.description || 'Transaction'}
                            </p>
                            <p className="text-[10px] text-ink-muted truncate">
                              {tx.transaction_date} · {tx.category?.name || 'General'} · {isExpense ? 'Outgoing' : 'Incoming'}
                            </p>
                          </div>
                        </div>
                        <p className={`text-xs font-tnum font-bold shrink-0 ${isExpense ? 'text-danger' : 'text-success'}`}>
                          {isExpense ? '-' : '+'}
                          {tx.amount} {tx.currency}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="xl:col-span-4 rounded-hero bg-panel border border-borderSubtle p-5 flex flex-col min-h-[520px] xl:sticky xl:top-20">
          <div className="flex items-center justify-between pb-3 border-b border-borderSubtle mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-control bg-lime text-app flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-extrabold tracking-wider text-ink-primary uppercase">MoneyMirror AI</h2>
                  <span className="text-[9px] px-1.5 rounded bg-greenActive text-lime font-bold">Beta</span>
                </div>
                <p className="text-[10px] text-ink-muted">Financial copilot</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-lime font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Read-only
            </span>
          </div>

          <div className="mb-4">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <Sparkles className="w-3 h-3 text-lime" /> Suggested
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Where does most of my money go?',
                'How can I save more?',
                'Show my monthly comparison',
                'Find unusual transactions',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendAi(prompt)}
                  disabled={aiLoading}
                  className="text-[11px] bg-cardRaised border border-borderSubtle hover:border-lime/40 text-ink-secondary hover:text-ink-primary px-2.5 py-1 rounded-control text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {aiMessages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-card text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-greenActive border border-borderSubtle text-ink-primary ml-6'
                    : 'bg-cardRaised border border-borderSubtle text-ink-secondary mr-4'
                }`}
              >
                <p className="font-semibold text-[10px] text-ink-muted mb-1 uppercase tracking-wider">
                  {m.role === 'user' ? 'You' : 'MoneyMirror AI'}
                </p>
                <p className="whitespace-pre-line">{m.text}</p>
              </div>
            ))}
            {aiLoading && (
              <div className="p-3 rounded-card bg-cardRaised border border-borderSubtle text-xs text-ink-muted flex items-center gap-2 mr-4">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-lime" />
                Reading your records…
              </div>
            )}
            {aiError && !aiLoading && (
              <button
                type="button"
                onClick={() => handleSendAi(aiMessages.filter((m) => m.role === 'user').at(-1)?.text)}
                className="text-[11px] text-lime"
              >
                Retry last question
              </button>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAi();
            }}
            className="pt-3 border-t border-borderSubtle mt-3 flex items-center gap-2"
          >
            <label className="sr-only" htmlFor="ai-composer">Ask anything</label>
            <input
              id="ai-composer"
              type="text"
              placeholder="Ask anything..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              disabled={aiLoading}
              className="flex-1 bg-app border border-borderSubtle rounded-control px-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-lime/60"
            />
            <button
              type="submit"
              disabled={!aiInput.trim() || aiLoading}
              aria-label="Send message"
              className="p-2 rounded-control bg-lime text-app hover:bg-lime-hover disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};
