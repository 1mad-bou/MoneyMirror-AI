import React, { useState } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, TransactionCreatePayload } from '@/lib/api';

interface TransfersViewProps {
  preferredCurrency: string;
  onSuccess: () => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  preferredCurrency,
  onSuccess,
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!recipient.trim()) {
      setStatus({ type: 'error', text: 'Enter a recipient name.' });
      return;
    }
    if (isNaN(parsed) || parsed <= 0) {
      setStatus({ type: 'error', text: 'Enter an amount greater than 0.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const payload: TransactionCreatePayload = {
        type: 'expense',
        amount: parsed.toFixed(2),
        currency: preferredCurrency.toUpperCase(),
        description: note.trim() || `Transfer to ${recipient.trim()}`,
        merchant: recipient.trim(),
        transaction_date: new Date().toISOString().split('T')[0],
        source: 'manual',
      };
      await api.createTransaction(
        payload,
        `xfer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      );
      setStatus({ type: 'success', text: 'Transfer recorded after confirmation.' });
      setRecipient('');
      setAmount('');
      setNote('');
      setTimeout(onSuccess, 700);
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message || 'Transfer could not be recorded.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink-primary">Transfers</h2>
        <p className="text-xs text-ink-muted mt-1">
          Record an outgoing transfer against your ledger. This logs a transaction; it does not
          move money at a bank.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="khazi-card p-6 space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-ink-muted mb-1" htmlFor="recipient">
            Recipient
          </label>
          <input
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Name of the person or account"
            className="khazi-input"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-ink-muted mb-1" htmlFor="xfer-amount">
            Amount ({preferredCurrency})
          </label>
          <input
            id="xfer-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="khazi-input font-tnum font-bold text-lg"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-ink-muted mb-1" htmlFor="xfer-note">
            Note (optional)
          </label>
          <input
            id="xfer-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What this transfer is for"
            className="khazi-input"
          />
        </div>

        {status && (
          <div
            className={`p-3 rounded-control text-xs flex items-center gap-2 ${
              status.type === 'success'
                ? 'bg-success/15 border border-success/40 text-success'
                : 'bg-danger/15 border border-danger/40 text-danger'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {status.text}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-control text-xs font-bold uppercase tracking-wider bg-lime text-app hover:bg-lime-hover disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {submitting ? 'Recording…' : 'Review and record transfer'}
        </button>
      </form>
    </div>
  );
};
