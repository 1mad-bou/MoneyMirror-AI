import React from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Category, Transaction, TrendPoint } from '@/lib/api';

interface ActivityViewProps {
  transactions: Transaction[];
  totalTransactions: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  categories: Category[];
  selectedCurrency: string;
  trends: TrendPoint[];
  period: string;
  onPeriodChange: (p: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  typeFilter: string;
  onTypeFilterChange: (t: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (c: string) => void;
  onOpenTransactionDetail: (tx: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
}

const PERIODS = [
  { id: '7d', label: 'Week' },
  { id: '30d', label: 'Month' },
  { id: '90d', label: 'Quarter' },
  { id: 'year', label: 'Year' },
];

export const ActivityView: React.FC<ActivityViewProps> = ({
  transactions,
  totalTransactions,
  currentPage,
  totalPages,
  onPageChange,
  categories,
  selectedCurrency,
  trends,
  period,
  onPeriodChange,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  onOpenTransactionDetail,
  onDeleteTransaction,
}) => {
  const periodIncome = trends.reduce((sum, p) => sum + parseFloat(p.income || '0'), 0);
  const periodExpenses = trends.reduce((sum, p) => sum + parseFloat(p.expenses || '0'), 0);

  const maxVal = Math.max(
    ...trends.map((t) => Math.max(parseFloat(t.income || '0'), parseFloat(t.expenses || '0'))),
    1
  );

  const chartHeight = 180;
  const chartWidth = 720;
  const padding = 24;
  const pointsCount = Math.max(trends.length, 2);
  const stepX = (chartWidth - padding * 2) / (pointsCount - 1);

  const getCoordinates = (valStr: string, index: number) => {
    const val = parseFloat(valStr || '0');
    const x = padding + index * stepX;
    const y = chartHeight - padding - (val / maxVal) * (chartHeight - padding * 2);
    return `${x},${y}`;
  };

  const incomePoints = trends.map((t, i) => getCoordinates(t.income, i)).join(' ');
  const expensePoints = trends.map((t, i) => getCoordinates(t.expenses, i)).join(' ');

  const categorySpendingMap = new Map<string, { name: string; amount: number; count: number }>();
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const name = t.category?.name || 'Uncategorized';
      const existing = categorySpendingMap.get(name) || { name, amount: 0, count: 0 };
      existing.amount += parseFloat(t.amount || '0');
      existing.count += 1;
      categorySpendingMap.set(name, existing);
    });

  const categorySpendingList = Array.from(categorySpendingMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const totalExpensePage = categorySpendingList.reduce((acc, c) => acc + c.amount, 0) || 1;

  const visibleTransactions =
    typeFilter === 'transfer'
      ? transactions.filter(
          (t) =>
            t.source === 'manual' &&
            (t.description?.toLowerCase().includes('transfer') || false)
        )
      : transactions;

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink-primary tracking-tight">Your Activity</h2>
          <p className="text-xs text-ink-muted">Cash-flow comparison, categories, and transaction history</p>
        </div>
        <div className="inline-flex p-1 rounded-control bg-panel border border-borderSubtle self-start">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              onClick={() => onPeriodChange(item.id)}
              className={`px-3.5 py-1.5 rounded-control text-xs font-bold ${
                period === item.id
                  ? 'bg-greenActive text-ink-primary'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-card bg-panel border border-borderSubtle p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Total Spend</p>
              <p className="text-2xl sm:text-3xl font-black text-ink-primary font-tnum mt-1">
                {periodExpenses.toFixed(2)}{' '}
                <span className="text-xs font-semibold text-lime">{selectedCurrency}</span>
              </p>
              <p className="text-[11px] text-ink-muted mt-1">
                Income in this window: {periodIncome.toFixed(2)} {selectedCurrency}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 bg-lime rounded" />
                <span className="text-ink-secondary">This period (expenses)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 border-t border-dashed border-mint" />
                <span className="text-ink-secondary">This period (income)</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto py-2">
            {trends.length === 0 ? (
              <p className="h-44 flex items-center justify-center text-xs text-ink-muted">
                No trend points for this period yet.
              </p>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44" role="img" aria-label="Cash flow over time">
                <title>Expenses versus income across the selected period</title>
                {[padding, chartHeight / 2, chartHeight - padding].map((y) => (
                  <line key={y} x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#1D2B20" strokeDasharray="4 4" />
                ))}
                {expensePoints && (
                  <polyline fill="none" stroke="#C7F451" strokeWidth="3" strokeLinecap="round" points={expensePoints} />
                )}
                {incomePoints && (
                  <polyline fill="none" stroke="#87E5CB" strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" points={incomePoints} />
                )}
              </svg>
            )}
          </div>
          <div className="flex justify-between text-[10px] font-tnum text-ink-muted pt-2 border-t border-borderSubtle">
            <span>{trends[0]?.date || 'Start'}</span>
            <span>{trends[Math.floor(trends.length / 2)]?.date || 'Mid'}</span>
            <span>{trends[trends.length - 1]?.date || 'End'}</span>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-card bg-panel border border-borderSubtle p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Categories</h3>
            <span className="text-[10px] font-tnum text-lime font-bold">From this page</span>
          </div>
          {categorySpendingList.length === 0 ? (
            <p className="py-12 text-center text-xs text-ink-muted">No expense categories in the current filter.</p>
          ) : (
            <div className="space-y-4">
              {categorySpendingList.map((c, idx) => {
                const pct = Math.round((c.amount / totalExpensePage) * 100);
                return (
                  <div key={c.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-semibold text-ink-primary truncate">{c.name}</span>
                      <span className="font-tnum font-bold text-ink-secondary shrink-0">
                        {pct}% · {c.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-cardRaised rounded-full h-1.5 overflow-hidden border border-borderSubtle/60">
                      <div
                        className={`h-full rounded-full ${idx === 0 ? 'bg-lime' : 'bg-greenActive'}`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-borderSubtle mt-auto">
            <div className="p-2.5 rounded-control bg-cardRaised border border-borderSubtle">
              <p className="text-[10px] text-ink-muted uppercase">Inflow</p>
              <p className="text-xs font-bold text-success font-tnum">+{periodIncome.toFixed(2)}</p>
            </div>
            <div className="p-2.5 rounded-control bg-cardRaised border border-borderSubtle">
              <p className="text-[10px] text-ink-muted uppercase">Outflow</p>
              <p className="text-xs font-bold text-danger font-tnum">-{periodExpenses.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-card bg-panel border border-borderSubtle p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">Transaction History</h3>
            <p className="text-xs text-ink-secondary">{totalTransactions} transactions found</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Search description..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-cardRaised border border-borderSubtle rounded-control pl-8 pr-3 py-1.5 text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-lime/50 w-40 sm:w-56"
              />
            </div>
            <div className="inline-flex rounded-control bg-cardRaised border border-borderSubtle p-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'income', label: 'Income' },
                { id: 'expense', label: 'Expense' },
                { id: 'transfer', label: 'Transfer' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onTypeFilterChange(t.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-control ${
                    typeFilter === t.id ? 'bg-greenActive text-ink-primary' : 'text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              aria-label="Filter by category"
              className="bg-cardRaised border border-borderSubtle rounded-control px-2.5 py-1.5 text-xs text-ink-secondary focus:outline-none focus:border-lime/50"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.kind})
                </option>
              ))}
            </select>
          </div>
        </div>

        {visibleTransactions.length === 0 ? (
          <p className="py-16 text-center text-xs text-ink-muted">No transactions match these filters.</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-borderSubtle text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle/60 text-xs">
                  {visibleTransactions.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-cardHover/70 cursor-pointer"
                        onClick={() => onOpenTransactionDetail(tx)}
                      >
                        <td className="py-3 px-3 font-tnum text-ink-muted whitespace-nowrap">{tx.transaction_date}</td>
                        <td className="py-3 px-3 font-semibold text-ink-primary">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isExpense ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                              {isExpense ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                            </div>
                            <span className="truncate max-w-xs">{tx.merchant || tx.description || 'Transaction'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex text-[11px] px-2 py-0.5 rounded-full bg-cardRaised border border-borderSubtle text-ink-secondary">
                            {tx.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className={`py-3 px-3 text-right font-tnum font-bold ${isExpense ? 'text-danger' : 'text-success'}`}>
                          {isExpense ? '-' : '+'}
                          {tx.amount} {tx.currency}
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => onOpenTransactionDetail(tx)} aria-label="Edit" className="p-1 rounded text-ink-muted hover:text-ink-primary">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onDeleteTransaction(tx.id)} aria-label="Delete" className="p-1 rounded text-ink-muted hover:text-danger">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-2">
              {visibleTransactions.map((tx) => {
                const isExpense = tx.type === 'expense';
                return (
                  <button
                    key={tx.id}
                    onClick={() => onOpenTransactionDetail(tx)}
                    className="w-full text-left p-3 rounded-control bg-cardRaised border border-borderSubtle"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink-primary">{tx.merchant || tx.description || 'Transaction'}</p>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {tx.transaction_date} · {tx.category?.name || 'Uncategorized'} · {isExpense ? 'Expense' : 'Income'}
                        </p>
                      </div>
                      <p className={`text-sm font-tnum font-bold ${isExpense ? 'text-danger' : 'text-success'}`}>
                        {isExpense ? '-' : '+'}
                        {tx.amount}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-borderSubtle text-xs text-ink-muted">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
                className="p-1.5 rounded-control bg-cardRaised border border-borderSubtle hover:bg-cardHover disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
                className="p-1.5 rounded-control bg-cardRaised border border-borderSubtle hover:bg-cardHover disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
