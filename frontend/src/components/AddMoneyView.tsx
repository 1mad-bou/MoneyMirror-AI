import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { Category, TransactionCreatePayload, api } from '@/lib/api';

interface AddMoneyViewProps {
  categories: Category[];
  preferredCurrency: string;
  onSuccess: () => void;
}

export const AddMoneyView: React.FC<AddMoneyViewProps> = ({
  categories,
  preferredCurrency,
  onSuccess,
}) => {
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState<string>('50.00');
  const [customAmount, setCustomAmount] = useState<string>('50.00');
  const [currency, setCurrency] = useState<string>(preferredCurrency);
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Natural Language Tab
  const [isAiMode, setIsAiMode] = useState<boolean>(false);
  const [nlText, setNlText] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const presets = ['10', '25', '50', '100', '200', '500'];

  const handlePresetClick = (p: string) => {
    setAmount(p);
    setCustomAmount(p);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    setAmount(val);
  };

  const handleNlExtract = async () => {
    if (!nlText.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const draft = await api.getNLDraft(nlText);
      if (draft.amount) {
        setAmount(draft.amount);
        setCustomAmount(draft.amount);
      }
      if (draft.currency) setCurrency(draft.currency);
      if (draft.type) setType(draft.type);
      if (draft.description) setDescription(draft.description);
      if (draft.merchant) setMerchant(draft.merchant);
      if (draft.transaction_date) setTransactionDate(draft.transaction_date);
      if (draft.suggested_category_id) setCategoryId(draft.suggested_category_id);

      setIsAiMode(false);
      setStatusMessage({
        type: 'success',
        text: 'Draft extracted! Please review the details below before saving.',
      });
    } catch (err: any) {
      setAiError(err.message || 'Failed to extract draft. Please enter manually.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid amount greater than 0.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    // Generate unique idempotency key to prevent accidental double-submits
    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const payload: TransactionCreatePayload = {
        type,
        amount: parsedAmount.toFixed(2),
        currency: currency.toUpperCase(),
        description: description.trim() || (type === 'income' ? 'Deposit' : 'Expense'),
        merchant: merchant.trim() || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        transaction_date: transactionDate,
        source: isAiMode ? 'natural_language' : 'manual',
      };

      await api.createTransaction(payload, idempotencyKey);
      setStatusMessage({ type: 'success', text: 'Transaction recorded successfully!' });
      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to record transaction.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.kind === type);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-bold text-ink">
          {type === 'income' ? 'Add Money / Deposit' : 'Record Expense'}
        </h2>
        <p className="text-xs sm:text-sm text-ink-muted">
          Manual preset entry or describe with natural language
        </p>
      </div>

      {/* Mode Switch: Presets vs Natural Language AI */}
      <div className="flex rounded-control bg-surface border border-borderSubtle p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setIsAiMode(false)}
          className={`flex-1 py-2 text-xs font-bold rounded-control transition-colors ${
            !isAiMode ? 'bg-forest text-white' : 'text-ink-muted hover:text-ink'
          }`}
        >
          Preset & Manual Form
        </button>
        <button
          type="button"
          onClick={() => setIsAiMode(true)}
          className={`flex-1 py-2 text-xs font-bold rounded-control flex items-center justify-center gap-1.5 transition-colors ${
            isAiMode ? 'bg-forest text-white' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-lime" />
          <span>Describe with AI</span>
        </button>
      </div>

      {/* Natural Language Prompt Card */}
      {isAiMode && (
        <div className="p-6 rounded-card bg-surface border border-borderSubtle shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-forest" />
              Describe Your Transaction
            </h3>
            <p className="text-xs text-ink-muted">
              Type naturally, e.g. &quot;I spent 80 MAD on lunch at McDonalds today&quot; or &quot;Received 4,000 MAD for freelance project&quot;
            </p>
          </div>

          <textarea
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            rows={3}
            placeholder="Type your transaction in plain words..."
            className="w-full p-3 rounded-control text-xs bg-surface-muted border border-borderSubtle text-ink focus:outline-none focus:ring-1 focus:ring-forest"
          />

          {aiError && (
            <div className="p-3 rounded-control bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isAiLoading || !nlText.trim()}
            onClick={handleNlExtract}
            className="w-full py-2.5 rounded-control bg-forest text-white text-xs font-bold hover:bg-forest-light disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isAiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-lime" />
                <span>Extracting with Gemma...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-lime" />
                <span>Generate Draft for Review</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Review & Confirmation Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-card bg-surface border border-borderSubtle shadow-sm space-y-6">
        {/* Type Toggle: Income vs Expense */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategoryId('');
            }}
            className={`flex-1 py-2.5 px-4 rounded-control text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              type === 'income'
                ? 'bg-mint text-forest border-forest/20 shadow-sm'
                : 'bg-surface-muted text-ink-muted border-borderSubtle hover:bg-borderSubtle'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Income (Deposit)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategoryId('');
            }}
            className={`flex-1 py-2.5 px-4 rounded-control text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              type === 'expense'
                ? 'bg-forest text-white border-forest shadow-sm'
                : 'bg-surface-muted text-ink-muted border-borderSubtle hover:bg-borderSubtle'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-lime" />
            <span>Expense (Spend)</span>
          </button>
        </div>

        {/* Amount Section with Presets */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-ink uppercase tracking-wider block">
            Select or Enter Amount ({currency})
          </label>

          {/* Presets Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePresetClick(p)}
                className={`py-2 rounded-control text-xs font-bold border transition-colors ${
                  amount === p
                    ? 'bg-forest text-white border-forest'
                    : 'bg-surface-muted text-ink border-borderSubtle hover:bg-borderSubtle'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Custom Amount & Currency Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder="0.00"
                className="w-full px-4 py-3 text-lg font-mono font-bold rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-3 text-xs font-bold rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none cursor-pointer"
            >
              <option value="MAD">MAD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AED">AED</option>
              <option value="SAR">SAR</option>
            </select>
          </div>
        </div>

        {/* Form Fields: Category, Date, Merchant, Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 text-xs rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none cursor-pointer"
            >
              <option value="">Select a category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">Date</label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none font-mono"
            >
            </input>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">
              Merchant / Counterparty (optional)
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Starbucks, Carrefour, Employer"
              className="w-full px-3 py-2 text-xs rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">
              Description / Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Weekly groceries or coffee"
              className="w-full px-3 py-2 text-xs rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none"
            />
          </div>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div
            className={`p-3 rounded-control text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-mint text-forest border border-forest/10'
                : 'bg-danger/10 text-danger border border-danger/20'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-control bg-forest text-white text-sm font-bold hover:bg-forest-light disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-lime" />
              <span>Recording Transaction...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-lime" />
              <span>Confirm & Save {amount} {currency}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
