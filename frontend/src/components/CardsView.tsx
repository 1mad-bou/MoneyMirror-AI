import React from 'react';
import { CreditCard, Shield } from 'lucide-react';

export const CardsView: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink-primary">Cards</h2>
        <p className="text-xs text-ink-muted mt-1">
          Card details stay masked until a payment method is actually linked.
        </p>
      </div>
      <div className="khazi-card p-8 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-control bg-greenDeep border border-borderSubtle text-lime flex items-center justify-center">
          <CreditCard className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-ink-primary">No cards linked</h3>
        <p className="text-xs text-ink-muted max-w-md mx-auto">
          KHAZI currently records cash flow from transactions you add or scan. Linked debit or
          credit cards are not connected, so no card numbers or balances are shown.
        </p>
        <p className="inline-flex items-center gap-1.5 text-[11px] text-lime">
          <Shield className="w-3.5 h-3.5" /> Identifiers stay masked by default
        </p>
      </div>
    </div>
  );
};
