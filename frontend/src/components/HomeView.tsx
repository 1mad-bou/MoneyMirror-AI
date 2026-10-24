import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt, 
  Bot, 
  Wallet, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  ShoppingBag,
  Store,
  DollarSign
} from 'lucide-react';
import { DashboardSummary, Transaction } from '@/lib/api';

interface HomeViewProps {
  summary: DashboardSummary | null;
  recentTransactions: Transaction[];
  onNavigate: (tab: string) => void;
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

  const isNetPositive = parseFloat(primary.net_cash_flow) >= 0;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Top Grid: Balance Card + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-card bg-forest text-white p-6 sm:p-8 shadow-md">
          {/* Subtle decorative background organic ring */}
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-lime/10 blur-3xl pointer-events-none" />
          <div className="absolute right-8 bottom-0 w-32 h-32 rounded-full border border-white/5 pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full min-h-[200px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-1">
                  Cash Balance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
                    {primary.net_cash_flow}
                  </span>
                  <span className="text-lg font-bold text-lime">
                    {primary.currency}
                  </span>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="bg-forest-deep/80 border border-white/10 rounded-control px-2.5 py-1 flex items-center gap-1.5">
                <span className="text-xs text-white/60">Currency:</span>
                <select
                  value={selectedCurrency}
                  onChange={(e) => onSelectCurrency(e.target.value)}
                  className="bg-transparent text-xs font-bold text-lime focus:outline-none cursor-pointer"
                >
                  {summary?.currencies && summary.currencies.length > 0 ? (
                    summary.currencies.map((c) => (
                      <option key={c.currency} value={c.currency} className="bg-forest text-white">
                        {c.currency}
                      </option>
                    ))
                  ) : (
                    <option value="MAD" className="bg-forest text-white">MAD</option>
                  )}
                </select>
              </div>
            </div>

            {/* Income & Expense Breakdown in Card */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-lime/20 text-lime flex items-center justify-center flex-shrink-0">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-white/60">Income</p>
                  <p className="text-sm sm:text-base font-bold text-white font-mono">
                    +{primary.total_income} {primary.currency}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-danger/20 text-danger flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-white/60">Expenses</p>
                  <p className="text-sm sm:text-base font-bold text-white font-mono">
                    -{primary.total_expenses} {primary.currency}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-white/40 pt-4">
              <span>Personal Account •••• 8492</span>
              <span>{primary.transaction_count} transactions recorded</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="rounded-card bg-surface p-6 border border-borderSubtle shadow-sm flex flex-col justify-between space-y-3">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <button
              onClick={() => onNavigate('add')}
              className="flex flex-col items-center justify-center p-4 rounded-control bg-mint text-forest hover:bg-mint-soft transition-all text-center border border-forest/5 group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                <ArrowDownLeft className="w-5 h-5 text-forest" />
              </div>
              <span className="text-xs font-bold">Add Income</span>
              <span className="text-[10px] text-forest/70">Deposit funds</span>
            </button>

            <button
              onClick={() => onNavigate('add')}
              className="flex flex-col items-center justify-center p-4 rounded-control bg-surface-muted text-forest hover:bg-borderSubtle transition-all text-center border border-borderSubtle group"
            >
              <div className="w-10 h-10 rounded-full bg-forest text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                <ArrowUpRight className="w-5 h-5 text-lime" />
              </div>
              <span className="text-xs font-bold">Record Expense</span>
              <span className="text-[10px] text-ink-muted">Manual entry</span>
            </button>

            <button
              onClick={() => onNavigate('scan')}
              className="flex flex-col items-center justify-center p-4 rounded-control bg-surface-muted text-forest hover:bg-borderSubtle transition-all text-center border border-borderSubtle group"
            >
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-2 shadow-sm text-forest group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">Scan Receipt</span>
              <span className="text-[10px] text-ink-muted">OCR + Review</span>
            </button>

            <button
              onClick={() => onNavigate('ai')}
              className="flex flex-col items-center justify-center p-4 rounded-control bg-forest text-white hover:bg-forest-light transition-all text-center border border-white/10 group"
            >
              <div className="w-10 h-10 rounded-full bg-lime text-forest flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">Ask Gemma</span>
              <span className="text-[10px] text-lime">RAG Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Frequent Merchants / Recipients Row */}
      {summary?.top_merchants && summary.top_merchants.length > 0 && (
        <div className="rounded-card bg-surface p-6 border border-borderSubtle shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-ink">Frequent Merchants & Recipients</h2>
              <p className="text-xs text-ink-muted">Top destinations where your money moves</p>
            </div>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs font-semibold text-forest hover:text-forest-light flex items-center gap-1"
            >
              View analytics <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {summary.top_merchants.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-control bg-surface-muted/60 border border-borderSubtle flex flex-col items-center text-center hover:bg-surface-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-forest text-lime flex items-center justify-center text-xs font-bold mb-2 shadow-sm">
                  {m.merchant.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-xs font-bold text-ink truncate w-full" title={m.merchant}>
                  {m.merchant}
                </p>
                <p className="text-[11px] font-mono font-medium text-ink-muted">
                  {m.amount} {m.currency}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Section: Category Breakdown + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories */}
        <div className="rounded-card bg-surface p-6 border border-borderSubtle shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-ink">Spending by Category</h2>
              <p className="text-xs text-ink-muted">In {selectedCurrency}</p>
            </div>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs font-semibold text-forest hover:underline"
            >
              Full report
            </button>
          </div>

          {summary?.top_categories && summary.top_categories.length > 0 ? (
            <div className="space-y-3.5">
              {summary.top_categories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-forest" />
                      {cat.category_name}
                    </span>
                    <span className="font-mono font-semibold text-ink">
                      {cat.amount} {cat.currency} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-lime h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-ink-muted">
              No category expense data available yet.
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-card bg-surface p-6 border border-borderSubtle shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-ink">Recent Transactions</h2>
              <p className="text-xs text-ink-muted">Latest money movements</p>
            </div>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs font-semibold text-forest hover:text-forest-light flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="divide-y divide-borderSubtle">
              {recentTransactions.slice(0, 6).map((tx) => {
                const isExpense = tx.type === 'expense';
                return (
                  <div
                    key={tx.id}
                    onClick={() => onOpenTransactionDetail(tx)}
                    className="py-3 flex items-center justify-between hover:bg-surface-muted/50 px-2 rounded-control cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isExpense ? 'bg-surface-muted text-ink' : 'bg-mint text-forest'
                        }`}
                      >
                        {isExpense ? (
                          <ArrowUpRight className="w-4 h-4 text-danger" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 text-forest" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {tx.merchant || tx.description || 'Transaction'}
                        </p>
                        <p className="text-xs text-ink-muted flex items-center gap-1.5">
                          <span>{tx.transaction_date}</span>
                          <span>•</span>
                          <span className="capitalize">{tx.category?.name || 'Uncategorized'}</span>
                          {tx.source !== 'manual' && (
                            <span className="text-[10px] bg-surface-muted px-1.5 py-0.2 rounded text-ink-muted">
                              {tx.source}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-mono font-bold ${
                          isExpense ? 'text-ink' : 'text-forest font-extrabold'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {tx.amount} {tx.currency}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-ink-muted space-y-2">
              <p>No transactions recorded yet.</p>
              <button
                onClick={() => onNavigate('add')}
                className="text-xs font-semibold text-forest underline"
              >
                Create your first transaction
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

