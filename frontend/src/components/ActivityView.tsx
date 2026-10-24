import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown
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
  // Compute period totals from trends
  const periodIncome = trends.reduce((sum, p) => sum + parseFloat(p.income || '0'), 0);
  const periodExpenses = trends.reduce((sum, p) => sum + parseFloat(p.expenses || '0'), 0);
  const periodNet = periodIncome - periodExpenses;

  // Simple SVG Line Chart generator
  const maxVal = Math.max(
    ...trends.map((t) => Math.max(parseFloat(t.income || '0'), parseFloat(t.expenses || '0'))),
    100
  );

  const chartHeight = 160;
  const chartWidth = 700;
  const padding = 20;

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

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink">Your Activity</h2>
          <p className="text-xs sm:text-sm text-ink-muted">
            Financial analytics and complete transaction history
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="inline-flex p-1 rounded-control bg-surface border border-borderSubtle shadow-sm">
          {[
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: '90d', label: '90D' },
            { id: 'year', label: 'Year' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onPeriodChange(item.id)}
              className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition-all ${
                period === item.id
                  ? 'bg-forest text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics: Chart + Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Line Chart */}
        <div className="lg:col-span-2 rounded-card bg-surface p-6 border border-borderSubtle shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                Income vs Expenses Flow
              </h3>
              <p className="text-xs text-ink-muted">Daily trend for selected period ({selectedCurrency})</p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-forest" />
                <span className="font-semibold text-ink">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-lime border border-forest/10" />
                <span className="font-semibold text-ink">Expenses</span>
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="w-full overflow-x-auto py-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
            >
              {/* Gridlines */}
              <line
                x1={padding}
                y1={padding}
                x2={chartWidth - padding}
                y2={padding}
                stroke="#E3E5DE"
                strokeDasharray="4 4"
              />
              <line
                x1={padding}
                y1={chartHeight / 2}
                x2={chartWidth - padding}
                y2={chartHeight / 2}
                stroke="#E3E5DE"
                strokeDasharray="4 4"
              />
              <line
                x1={padding}
                y1={chartHeight - padding}
                x2={chartWidth - padding}
                y2={chartHeight - padding}
                stroke="#E3E5DE"
              />

              {/* Expense line (Lime) */}
              {expensePoints && (
                <polyline
                  fill="none"
                  stroke="#B8E83D"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={expensePoints}
                />
              )}

              {/* Income line (Dark forest) */}
              {incomePoints && (
                <polyline
                  fill="none"
                  stroke="#14270B"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={incomePoints}
                />
              )}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-ink-muted pt-2 border-t border-borderSubtle">
            <span>{trends[0]?.date || 'Start'}</span>
            <span>{trends[Math.floor(trends.length / 2)]?.date || 'Mid'}</span>
            <span>{trends[trends.length - 1]?.date || 'End'}</span>
          </div>
        </div>

        {/* Period Summary Metric Cards */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="rounded-card bg-surface p-6 border border-borderSubtle shadow-sm flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-muted">Total Received</span>
              <div className="w-8 h-8 rounded-full bg-mint text-forest flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-forest font-mono">
              +{periodIncome.toFixed(2)} {selectedCurrency}
            </p>
            <p className="text-xs text-ink-muted mt-1">Recorded for {period.toUpperCase()}</p>
          </div>

          <div className="rounded-card bg-surface p-6 border border-borderSubtle shadow-sm flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-muted">Total Spent</span>
              <div className="w-8 h-8 rounded-full bg-surface-muted text-danger flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-ink font-mono">
              -{periodExpenses.toFixed(2)} {selectedCurrency}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              Net cash flow: <span className={periodNet >= 0 ? 'text-forest font-bold' : 'text-danger font-bold'}>
                {periodNet >= 0 ? '+' : ''}{periodNet.toFixed(2)} {selectedCurrency}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Filter Bar & Table */}
      <div className="rounded-card bg-surface p-6 border border-borderSubtle shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-ink">Transaction History</h3>
            <p className="text-xs text-ink-muted">{totalTransactions} transactions found</p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search descriptions, merchants..."
                className="pl-9 pr-3 py-1.5 text-xs rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none focus:ring-1 focus:ring-forest w-48 sm:w-60"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-borderSubtle text-ink-muted font-semibold">
                <th className="py-3 px-3">Transaction</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSubtle">
              {transactions.length > 0 ? (
                transactions.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-surface-muted/40 transition-colors group cursor-pointer"
                      onClick={() => onOpenTransactionDetail(tx)}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isExpense ? 'bg-surface-muted text-danger' : 'bg-mint text-forest'
                            }`}
                          >
                            {isExpense ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-ink">
                              {tx.merchant || tx.description || 'Transaction'}
                            </p>
                            {tx.merchant && tx.description && (
                              <p className="text-[10px] text-ink-muted truncate max-w-[200px]">
                                {tx.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-surface-muted font-medium text-ink">
                          {tx.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-ink-muted font-mono">{tx.transaction_date}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-medium text-ink-muted capitalize">
                          {tx.source}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={isExpense ? 'text-ink' : 'text-forest font-extrabold'}>
                          {isExpense ? '-' : '+'}
                          {tx.amount} {tx.currency}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 rounded hover:bg-danger/10 text-ink-muted hover:text-danger transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-ink-muted">
                    No transactions match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-borderSubtle text-xs text-ink-muted">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="p-1.5 rounded-control border border-borderSubtle bg-surface hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="p-1.5 rounded-control border border-borderSubtle bg-surface hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed"
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

