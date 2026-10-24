'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, Category, api } from '@/lib/api';
import {
  X,
  Calendar,
  Tag,
  Store,
  DollarSign,
  FileText,
  Clock,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2
} from 'lucide-react';

interface Props {
  transaction: Transaction | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export default function TransactionDetailModal({
  transaction,
  categories,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('MAD');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount);
      setCurrency(transaction.currency);
      setDescription(transaction.description || '');
      setMerchant(transaction.merchant || '');
      setCategoryId(transaction.category_id || '');
      setDate(transaction.transaction_date ? transaction.transaction_date.slice(0, 10) : '');
      setIsEditing(false);
      setIsDeleting(false);
      setError(null);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.updateTransaction(transaction.id, {
        type,
        amount,
        currency,
        description,
        merchant: merchant || null,
        category_id: categoryId ? Number(categoryId) : null,
        transaction_date: date,
      });
      setIsEditing(false);
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await api.deleteTransaction(transaction.id);
      setIsDeleting(false);
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const isExpense = transaction.type === 'expense';
  const filteredCategories = categories.filter((c) => c.kind === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-hero bg-panel border border-borderSubtle shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-borderSubtle flex items-center justify-between bg-cardRaised/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isExpense ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'
              }`}
            >
              {isExpense ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-primary">
                {isEditing ? 'Edit Transaction' : 'Transaction Details'}
              </h3>
              <p className="text-[10px] font-mono text-ink-muted">Ref #{transaction.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-control text-ink-muted hover:text-ink-primary hover:bg-cardHover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-control bg-danger/15 border border-danger/40 text-danger text-xs">
              {error}
            </div>
          )}

          {!isEditing ? (
            /* View Mode */
            <div className="space-y-5">
              {/* Large Amount Display */}
              <div className="p-4 rounded-card bg-cardRaised border border-borderSubtle text-center">
                <p className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Amount</p>
                <p
                  className={`text-3xl font-black font-mono font-tnum mt-1 ${
                    isExpense ? 'text-ink-primary' : 'text-success'
                  }`}
                >
                  {isExpense ? '-' : '+'}
                  {transaction.amount} <span className="text-sm font-bold text-lime">{transaction.currency}</span>
                </p>
              </div>

              {/* Transaction Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-control bg-cardRaised border border-borderSubtle">
                  <p className="text-[10px] font-semibold text-ink-muted uppercase">Merchant</p>
                  <p className="font-bold text-ink-primary truncate mt-0.5">
                    {transaction.merchant || 'None specified'}
                  </p>
                </div>

                <div className="p-3 rounded-control bg-cardRaised border border-borderSubtle">
                  <p className="text-[10px] font-semibold text-ink-muted uppercase">Category</p>
                  <p className="font-bold text-ink-primary truncate mt-0.5">
                    {transaction.category?.name || 'Uncategorized'}
                  </p>
                </div>

                <div className="p-3 rounded-control bg-cardRaised border border-borderSubtle">
                  <p className="text-[10px] font-semibold text-ink-muted uppercase">Date</p>
                  <p className="font-mono font-bold text-ink-primary mt-0.5">
                    {transaction.transaction_date}
                  </p>
                </div>

                <div className="p-3 rounded-control bg-cardRaised border border-borderSubtle">
                  <p className="text-[10px] font-semibold text-ink-muted uppercase">Source Ingestion</p>
                  <p className="font-mono font-bold text-lime uppercase mt-0.5">
                    {transaction.source}
                  </p>
                </div>
              </div>

              {transaction.description && (
                <div className="p-3 rounded-control bg-cardRaised border border-borderSubtle text-xs">
                  <p className="text-[10px] font-semibold text-ink-muted uppercase mb-1">Description</p>
                  <p className="text-ink-secondary">{transaction.description}</p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-borderSubtle">
                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  className="px-3.5 py-2 rounded-control text-xs font-bold text-danger bg-danger/10 border border-danger/20 hover:bg-danger hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-control text-xs font-bold bg-lime text-app hover:bg-lime-hover transition-all flex items-center gap-1.5 shadow-glow"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Transaction</span>
                </button>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-muted mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'expense' | 'income')}
                    className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-ink-primary focus:outline-none focus:border-lime/60"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink-muted mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 font-mono font-bold text-ink-primary focus:outline-none focus:border-lime/60"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink-muted mb-1">Merchant</label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-ink-primary focus:outline-none focus:border-lime/60"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink-muted mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-ink-primary focus:outline-none focus:border-lime/60 cursor-pointer"
                  >
                    <option value="">Uncategorized</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-ink-primary focus:outline-none focus:border-lime/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-ink-primary focus:outline-none focus:border-lime/60"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-borderSubtle">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-control text-xs font-semibold bg-cardRaised border border-borderSubtle text-ink-secondary hover:text-ink-primary hover:bg-cardHover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-control text-xs font-bold bg-lime text-app hover:bg-lime-hover disabled:opacity-50 shadow-glow"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Delete Confirmation Dialog */}
          {isDeleting && (
            <div className="p-4 rounded-card bg-danger/10 border border-danger/30 space-y-3">
              <p className="text-xs font-bold text-danger">Permanently Delete Transaction?</p>
              <p className="text-[11px] text-ink-muted">
                This action will delete the database record and update your cash balance.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsDeleting(false)}
                  className="px-3 py-1.5 rounded-control text-xs bg-cardRaised text-ink-primary border border-borderSubtle"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-control text-xs font-bold bg-danger text-white hover:bg-danger/90"
                >
                  {submitting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
