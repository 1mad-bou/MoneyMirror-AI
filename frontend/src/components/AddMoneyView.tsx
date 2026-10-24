import React, { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  Receipt,
  ChevronRight,
} from 'lucide-react';
import { Category, TransactionCreatePayload, api } from '@/lib/api';

interface AddMoneyViewProps {
  categories: Category[];
  preferredCurrency: string;
  onSuccess: () => void;
  initialType?: 'income' | 'expense';
  onScanReceipt?: () => void;
}

const PRESETS = ['10', '25', '50', '100', '200'];

export const AddMoneyView: React.FC<AddMoneyViewProps> = ({
  categories,
  preferredCurrency,
  onSuccess,
  initialType = 'income',
  onScanReceipt,
}) => {
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [amount, setAmount] = useState<string>('50');
  const [customAmount, setCustomAmount] = useState<string>('50');
  const [isCustom, setIsCustom] = useState(false);
  const [currency, setCurrency] = useState<string>(preferredCurrency);
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMethod, setSelectedMethod] = useState<string>('manual');
  const [isAiMode, setIsAiMode] = useState(false);
  const [nlText, setNlText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  const applyAmount = (val: string, custom: boolean) => {
    setIsCustom(custom);
    setCustomAmount(val);
    setAmount(val);
    const parsed = parseFloat(val);
    if (val && (isNaN(parsed) || parsed <= 0)) {
      setAmountError('Amount must be greater than 0.');
    } else {
      setAmountError(null);
    }
  };

  const handleNlExtract = async () => {
    if (!nlText.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const draft = await api.getNLDraft(nlText);
      if (draft.amount) applyAmount(draft.amount, true);
      if (draft.currency) setCurrency(draft.currency);
      if (draft.type) setType(draft.type);
      if (draft.description) setDescription(draft.description);
      if (draft.merchant) setMerchant(draft.merchant);
      if (draft.transaction_date) setTransactionDate(draft.transaction_date);
      if (draft.suggested_category_id) setCategoryId(draft.suggested_category_id);
      setIsAiMode(false);
      setStatusMessage({
        type: 'success',
        text: 'Draft parsed. Review the amount and source before recording.',
      });
    } catch (err: any) {
      setAiError(err.message || 'Failed to extract draft. Use manual entry.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Enter a valid amount greater than 0.');
      setStatusMessage({ type: 'error', text: 'Enter a valid amount greater than 0.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    const idempotencyKey = `add-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const payload: TransactionCreatePayload = {
        type,
        amount: parsedAmount.toFixed(2),
        currency: currency.toUpperCase(),
        description:
          description.trim() ||
          (type === 'income' ? 'Deposit' : 'Withdrawal'),
        merchant: merchant.trim() || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        transaction_date: transactionDate,
        source: 'manual',
      };
      await api.createTransaction(payload, idempotencyKey);
      setStatusMessage({ type: 'success', text: 'Recorded after confirmation.' });
      setTimeout(onSuccess, 700);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to record transaction.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.kind === type);

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-ink-primary tracking-tight">
          {type === 'income' ? 'Add Money' : 'Withdraw'}
        </h2>
        <p className="text-xs text-ink-muted mt-1">
          This records a ledger entry. Timing depends on when you confirm — it does not move funds at a bank.
        </p>
      </div>

      <div className="flex rounded-control bg-panel border border-borderSubtle p-1">
        <button
          type="button"
          onClick={() => setIsAiMode(false)}
          className={`flex-1 py-2 text-xs font-bold rounded-control ${!isAiMode ? 'bg-greenActive text-ink-primary' : 'text-ink-muted'}`}
        >
          Amount & method
        </button>
        <button
          type="button"
          onClick={() => setIsAiMode(true)}
          className={`flex-1 py-2 text-xs font-bold rounded-control flex items-center justify-center gap-1.5 ${isAiMode ? 'bg-greenActive text-ink-primary' : 'text-ink-muted'}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-lime" />
          Describe with AI
        </button>
      </div>

      {isAiMode && (
        <div className="rounded-card bg-panel border border-borderSubtle p-5 space-y-3">
          <p className="text-xs text-ink-muted">
            Example: “Received 3000 MAD salary today” or “Spent 45 MAD on groceries”
          </p>
          <textarea
            rows={3}
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            placeholder="Type the transaction in plain language..."
            className="w-full rounded-control bg-app border border-borderSubtle p-3 text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-lime/60"
          />
          {aiError && (
            <p className="text-xs text-danger flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {aiError}
            </p>
          )}
          <button
            type="button"
            onClick={handleNlExtract}
            disabled={isAiLoading || !nlText.trim()}
            className="w-full py-2.5 rounded-control text-xs font-bold bg-lime text-app hover:bg-lime-hover disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isAiLoading ? 'Extracting…' : 'Extract draft'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-card bg-panel border border-borderSubtle p-6 space-y-6">
        <div className="flex items-center justify-center gap-3 pb-2 border-b border-borderSubtle">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold ${
              type === 'income' ? 'bg-greenActive text-ink-primary border border-borderSubtle' : 'text-ink-muted'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-success" />
            Add money
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold ${
              type === 'expense' ? 'bg-greenActive text-ink-primary border border-borderSubtle' : 'text-ink-muted'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-danger" />
            Withdraw
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
            Amount ({currency})
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PRESETS.map((p) => {
              const selected = !isCustom && amount === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => applyAmount(p, false)}
                  className={`py-2 px-3 rounded-control text-xs font-tnum font-bold border ${
                    selected
                      ? 'bg-greenDeep text-lime border-lime/70'
                      : 'bg-cardRaised border-borderSubtle text-ink-secondary hover:border-lime/40'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => applyAmount(customAmount || '', true)}
              className={`py-2 px-3 rounded-control text-xs font-bold border ${
                isCustom
                  ? 'bg-greenDeep text-lime border-lime/70'
                  : 'bg-cardRaised border-borderSubtle text-ink-secondary hover:border-lime/40'
              }`}
            >
              Custom
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-lime">{currency}</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={customAmount}
              onChange={(e) => applyAmount(e.target.value, true)}
              placeholder="0.00"
              aria-invalid={Boolean(amountError)}
              className="w-full bg-app border border-borderSubtle rounded-control pl-16 pr-4 py-3 text-xl font-bold font-tnum text-ink-primary focus:outline-none focus:border-lime/60"
            />
          </div>
          {amountError && <p className="text-xs text-danger">{amountError}</p>}
        </div>

        {type === 'income' && (
          <div className="space-y-2 pt-2 border-t border-borderSubtle">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Funding source</p>
            {[
              {
                id: 'manual',
                title: 'Manual record',
                subtitle: 'Log cash or a deposit you already received',
                icon: Building,
              },
              {
                id: 'bank',
                title: 'Bank transfer record',
                subtitle: 'Note an incoming transfer you already made',
                icon: Building,
              },
            ].map((m) => {
              const Icon = m.icon;
              const chosen = selectedMethod === m.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`w-full p-3 rounded-control border flex items-center justify-between text-left ${
                    chosen ? 'bg-cardRaised border-lime/50' : 'bg-app border-borderSubtle hover:bg-cardHover'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-control bg-panel border border-borderSubtle flex items-center justify-center text-lime">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-primary">{m.title}</p>
                      <p className="text-[10px] text-ink-muted">{m.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-muted" />
                </button>
              );
            })}
            {onScanReceipt && (
              <button
                type="button"
                onClick={onScanReceipt}
                className="w-full p-3 rounded-control border border-borderSubtle bg-app hover:bg-cardHover flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-control bg-panel border border-borderSubtle flex items-center justify-center text-lime">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-ink-primary">Scan a receipt</p>
                    <p className="text-[10px] text-ink-muted">OCR draft with review before saving</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted" />
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-borderSubtle">
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1" htmlFor="desc">
              Description
            </label>
            <input
              id="desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'income' ? 'Salary, transfer…' : 'Withdrawal, bill…'}
              className="khazi-input"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1" htmlFor="merchant">
              Merchant / source
            </label>
            <input
              id="merchant"
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Optional"
              className="khazi-input"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1" htmlFor="cat">
              Category
            </label>
            <select
              id="cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="khazi-input"
            >
              <option value="">Select category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1" htmlFor="date">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="khazi-input"
            />
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-control text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-success/15 border border-success/40 text-success'
                : 'bg-danger/15 border border-danger/40 text-danger'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {statusMessage.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-control text-xs font-bold uppercase tracking-wider bg-lime text-app hover:bg-lime-hover disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {isSubmitting ? 'Recording…' : type === 'income' ? 'Add Money' : 'Record withdrawal'}
        </button>
      </form>
    </div>
  );
};
