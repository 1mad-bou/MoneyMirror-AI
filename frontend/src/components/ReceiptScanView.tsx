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
  ArrowRight
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-bold text-ink">Receipt Scanner</h2>
        <p className="text-xs sm:text-sm text-ink-muted">
          OCR text extraction with mandatory human review before saving
        </p>
      </div>

      {!draft ? (
        /* Upload Step */
        <div className="rounded-card bg-surface p-8 border border-borderSubtle shadow-sm space-y-6 text-center">
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
              className="border-2 border-dashed border-borderSubtle hover:border-forest/40 rounded-card p-10 cursor-pointer transition-colors bg-surface-muted/30 flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-14 h-14 rounded-full bg-mint text-forest flex items-center justify-center">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Click to upload receipt image</p>
                <p className="text-xs text-ink-muted mt-1">Supports JPG, PNG, and WebP up to 8MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative inline-block max-h-72 rounded-control overflow-hidden border border-borderSubtle shadow-sm">
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="max-h-72 object-contain"
                />
                <button
                  onClick={handleDiscard}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-forest/80 text-white hover:bg-forest transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-4 py-2 rounded-control text-xs font-semibold bg-surface-muted border border-borderSubtle text-ink hover:bg-borderSubtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={handleStartScan}
                  className="px-6 py-2 rounded-control text-xs font-bold bg-forest text-white hover:bg-forest-light disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-lime" />
                      <span>Extracting with OCR...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4 text-lime" />
                      <span>Extract Receipt Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {scanError && (
            <div className="p-3 rounded-control bg-danger/10 border border-danger/20 text-danger text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{scanError}</span>
            </div>
          )}
        </div>
      ) : (
        /* Review Step: Mandatory Human Review */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Image Preview & Confidence Column */}
          <div className="rounded-card bg-surface p-6 border border-borderSubtle shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-ink">Receipt Image</h3>
            {previewUrl && (
              <div className="rounded-control overflow-hidden border border-borderSubtle max-h-64 flex items-center justify-center bg-black/5">
                <img src={previewUrl} alt="Receipt preview" className="max-h-64 object-contain" />
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-borderSubtle">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Confidence Score:</span>
                <span className="font-bold text-forest">{Math.round(draft.confidence * 100)}%</span>
              </div>
              <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-lime h-full rounded-full"
                  style={{ width: `${Math.round(draft.confidence * 100)}%` }}
                />
              </div>
            </div>

            {draft.warnings.length > 0 && (
              <div className="p-3 rounded-control bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Review Notes:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {draft.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Editable Form Column */}
          <form
            onSubmit={handleConfirmAndSave}
            className="md:col-span-2 rounded-card bg-surface p-6 sm:p-8 border border-borderSubtle shadow-sm space-y-5"
          >
            <div className="border-b border-borderSubtle pb-3">
              <h3 className="text-base font-bold text-ink">Review & Edit Extracted Fields</h3>
              <p className="text-xs text-ink-muted">
                Please verify all values. Nothing is saved until you click Confirm.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-muted mb-1 block">Merchant</label>
                <input
                  type="text"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Store or merchant name"
                  className="w-full px-3 py-2 text-xs rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted mb-1 block">Total Amount</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="px-2 py-2 text-xs font-bold rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none"
                  >
                    <option value="MAD">MAD</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted mb-1 block">Date</label>
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted mb-1 block">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {categories
                    .filter((c) => c.kind === 'expense')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-ink-muted mb-1 block">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Receipt description"
                  className="w-full px-3 py-2 text-xs rounded-control bg-surface-muted border border-borderSubtle text-ink focus:outline-none"
                />
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-control bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Actions: Confirm and Save vs Discard */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-borderSubtle">
              <button
                type="button"
                onClick={handleDiscard}
                className="px-4 py-2 rounded-control text-xs font-semibold bg-surface-muted border border-borderSubtle text-ink hover:bg-borderSubtle transition-colors"
              >
                Discard Receipt
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-control text-xs font-bold bg-forest text-white hover:bg-forest-light disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-lime" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-lime" />
                    <span>Confirm & Persist Transaction</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

