import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  X, 
  Loader2, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Category, ReceiptDraft, TransactionCreatePayload, api } from '@/lib/api';

interface ReceiptScanViewProps {
  categories: Category[];
  preferredCurrency: string;
  onSuccess: () => void;
}

export const ReceiptScanView: React.FC<ReceiptScanViewProps> = ({
  categories,
  preferredCurrency,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Editable Review Form state
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);
  const [merchant, setMerchant] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>(preferredCurrency);
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [description, setDescription] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDraft(null);
      setScanError(null);
    }
  };

  const handleStartScan = async () => {
    if (!selectedFile) return;
    setIsScanning(true);
    setScanError(null);

    try {
      const result = await api.scanReceipt(selectedFile);
      setDraft(result);
      setMerchant(result.merchant || '');
      setAmount(result.amount || '');
      setCurrency(result.currency || preferredCurrency);
      setTransactionDate(result.transaction_date || new Date().toISOString().split('T')[0]);
      setCategoryId(result.suggested_category_id || '');
      setDescription(result.description || (result.merchant ? `Receipt from ${result.merchant}` : 'Receipt scan'));
    } catch (err: any) {
      setScanError(err.message || 'Failed to scan receipt image.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDiscard = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDraft(null);
    setScanError(null);
    setSubmitError(null);
  };

  const handleConfirmAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const idempotencyKey = `rcpt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const payload: TransactionCreatePayload = {
        type: 'expense',
        amount: parsedAmount.toFixed(2),
        currency: currency.toUpperCase(),
        description: description.trim() || 'Scanned Receipt',
        merchant: merchant.trim() || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        transaction_date: transactionDate,
        source: 'receipt',
      };

      await api.createTransaction(payload, idempotencyKey);
      onSuccess();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save confirmed transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">Receipt Scanner</h2>
          <p className="text-xs text-ink-muted">
            OCR vision extraction with human-in-the-loop verification
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cardRaised border border-borderSubtle text-lime text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Draft Review Required</span>
        </div>
      </div>

      {!draft ? (
        /* Upload Step */
        <div className="rounded-card bg-panel p-8 border border-borderSubtle shadow-card space-y-6 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-borderSubtle hover:border-lime/50 rounded-card p-10 cursor-pointer transition-colors bg-cardRaised/40 flex flex-col items-center justify-center space-y-3 group"
            >
              <div className="w-14 h-14 rounded-full bg-greenDeep text-lime border border-borderSubtle flex items-center justify-center group-hover:scale-105 transition-transform shadow-glow">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink-primary">Click to upload receipt image</p>
                <p className="text-xs text-ink-muted mt-1">Supports JPG, PNG, and WebP up to 8MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative inline-block max-h-72 rounded-control overflow-hidden border border-borderSubtle shadow-card">
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="max-h-72 object-contain bg-black"
                />
                <button
                  onClick={handleDiscard}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-panel/80 text-ink-primary hover:bg-panel border border-borderSubtle transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-4 py-2 rounded-control text-xs font-semibold bg-cardRaised border border-borderSubtle text-ink-secondary hover:text-ink-primary hover:bg-cardHover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={handleStartScan}
                  className="px-6 py-2 rounded-control text-xs font-bold bg-lime text-app hover:bg-lime-hover disabled:opacity-50 transition-all flex items-center gap-2 shadow-glow"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting with OCR...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Extract Receipt Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {scanError && (
            <div className="p-3 rounded-control bg-danger/15 border border-danger/40 text-danger text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{scanError}</span>
            </div>
          )}
        </div>
      ) : (
        /* Review Step: Mandatory Human Review */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Image Preview & Confidence Column */}
          <div className="rounded-card bg-panel p-6 border border-borderSubtle shadow-card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Receipt Image</h3>
            {previewUrl && (
              <div className="rounded-control overflow-hidden border border-borderSubtle max-h-64 flex items-center justify-center bg-black/40">
                <img src={previewUrl} alt="Receipt preview" className="max-h-64 object-contain" />
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-borderSubtle">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Confidence Score</span>
                <span className="font-mono font-bold text-lime">
                  {Math.round((draft.confidence || 0.85) * 100)}%
                </span>
              </div>
              {draft.warnings && draft.warnings.length > 0 && (
                <div className="p-2.5 rounded-control bg-cardRaised border border-borderSubtle text-[11px] text-ink-secondary space-y-1">
                  <div className="font-semibold text-lime flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>OCR Note</span>
                  </div>
                  {draft.warnings.map((w, idx) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleDiscard}
              className="w-full py-2 rounded-control text-xs font-semibold bg-cardRaised border border-borderSubtle text-ink-muted hover:text-ink-primary hover:bg-cardHover transition-colors"
            >
              Scan Another Receipt
            </button>
          </div>

          {/* Review & Edit Form */}
          <div className="md:col-span-2 rounded-card bg-panel p-6 border border-borderSubtle shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-borderSubtle mb-4">
              <div>
                <h3 className="text-sm font-bold text-ink-primary">Review Extracted Draft</h3>
                <p className="text-[11px] text-ink-muted">
                  Inspect and adjust figures before committing to database
                </p>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-greenActive text-lime font-bold">
                Transient Draft
              </span>
            </div>

            <form onSubmit={handleConfirmAndSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                    Merchant Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-lime/60"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                    Total Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-lime font-mono">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-app border border-borderSubtle rounded-control pl-14 pr-3 py-2 text-xs font-bold font-mono text-ink-primary focus:outline-none focus:border-lime/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-lime/60"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-lime/60 cursor-pointer"
                  >
                    <option value="">Select Category...</option>
                    {categories
                      .filter((c) => c.kind === 'expense')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Receipt description"
                  className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-lime/60"
                />
              </div>

              {/* Extracted line items if detected */}
              {draft.items && draft.items.length > 0 && (
                <div className="pt-2 border-t border-borderSubtle">
                  <p className="text-[11px] font-semibold text-ink-muted mb-2">Detected Line Items</p>
                  <div className="max-h-36 overflow-y-auto space-y-1 rounded-control bg-app p-2 border border-borderSubtle">
                    {draft.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-[11px] text-ink-secondary py-0.5">
                        <span className="truncate pr-2">{item.description}</span>
                        <span className="font-mono text-ink-primary font-bold">
                          {item.amount ? `${item.amount} ${currency}` : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {submitError && (
                <div className="p-3 rounded-control bg-danger/15 border border-danger/40 text-danger text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="pt-4 border-t border-borderSubtle flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-4 py-2 rounded-control text-xs font-semibold bg-cardRaised border border-borderSubtle text-ink-secondary hover:text-ink-primary hover:bg-cardHover transition-colors"
                >
                  Discard Draft
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-control text-xs font-bold bg-lime text-app hover:bg-lime-hover disabled:opacity-50 transition-all flex items-center gap-2 shadow-glow"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Transaction...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
