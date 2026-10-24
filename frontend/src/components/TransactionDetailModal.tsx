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

  const filteredCategories = categories.filter((c) => c.kind === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-surface rounded-3xl border border-borderSubtle shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-borderSubtle bg-surfaceAlt/50">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                transaction.type === 'income'
                  ? 'bg-lime text-forest'
                  : 'bg-danger/10 text-danger border border-danger/20'
              }`}
            >
              {transaction.type}
            </span>
            <span className="text-xs text-inkMuted uppercase tracking-wider bg-surface px-2.5 py-1 rounded-full border border-borderSubtle">
              Source: {transaction.source}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-inkMuted hover:text-ink hover:bg-page transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6">
          {!isEditing ? (
            <div className="space-y-6">
              {/* Big Amount */}
              <div className="text-center py-2">
                <div
                  className={`text-4xl font-extrabold tracking-tight ${
                    transaction.type === 'income' ? 'text-forest' : 'text-ink'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {Number(transaction.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-xl font-semibold text-inkMuted">
                    {transaction.currency}
                  </span>
                </div>
                <div className="text-base font-medium text-ink mt-1">
                  {transaction.description || 'No description'}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 bg-surfaceAlt p-4 rounded-2xl border border-borderSubtle/60 text-sm">
                <div>
                  <div className="text-xs text-inkMuted flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" /> Merchant
                  </div>
                  <div className="font-semibold text-ink mt-0.5">
                    {transaction.merchant || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-inkMuted flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Category
                  </div>
                  <div className="font-semibold text-ink mt-0.5 flex items-center gap-1">
                    <span>{transaction.category?.icon || '📁'}</span>
                    <span>{transaction.category?.name || 'Uncategorized'}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-inkMuted flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Date
                  </div>
                  <div className="font-semibold text-ink mt-0.5">
                    {transaction.transaction_date ? transaction.transaction_date.slice(0, 10) : '—'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-inkMuted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Created At
                  </div>
                  <div className="font-semibold text-ink mt-0.5">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Delete confirmation state */}
              {isDeleting ? (
                <div className="p-4 rounded-2xl bg-danger/10 border border-danger/30 space-y-3">
                  <div className="flex items-center gap-2 text-danger font-semibold text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Are you sure you want to permanently delete this transaction?
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setIsDeleting(false)}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-surface border border-borderSubtle text-ink hover:bg-surfaceAlt"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-danger text-white hover:bg-danger/90 transition-colors shadow-sm"
                    >
                      {submitting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setIsDeleting(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-forest text-white hover:bg-forest/90 transition-colors shadow-sm"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Editing form */
            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Type Switcher */}
              <div className="flex p-1 bg-surfaceAlt rounded-xl border border-borderSubtle">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    type === 'expense'
                      ? 'bg-surface text-danger shadow-sm'
                      : 'text-inkMuted hover:text-ink'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    type === 'income'
                      ? 'bg-forest text-lime shadow-sm'
                      : 'text-inkMuted hover:text-ink'
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-inkMuted mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-borderSubtle bg-surface text-ink text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-inkMuted mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-borderSubtle bg-surface text-ink text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest"
                  >
                    <option value="MAD">MAD</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-inkMuted mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-borderSubtle bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              {/* Merchant */}
              <div>
                <label className="block text-xs font-semibold text-inkMuted mb-1">
                  Merchant
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Optional merchant name"
                  className="w-full px-3 py-2 rounded-xl border border-borderSubtle bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-inkMuted mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border border-borderSubtle bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                  >
                    <option value="">None</option>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon || '📁'} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-inkMuted mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-borderSubtle bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-borderSubtle">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-surface border border-borderSubtle text-ink hover:bg-surfaceAlt"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-forest text-white hover:bg-forest/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

