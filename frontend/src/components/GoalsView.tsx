import React from 'react';
import { Target } from 'lucide-react';

export const GoalsView: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink-primary">Goals</h2>
        <p className="text-xs text-ink-muted mt-1">
          Savings targets will appear here when the product stores them.
        </p>
      </div>
      <div className="khazi-card p-8 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-control bg-greenDeep border border-borderSubtle text-lime flex items-center justify-center">
          <Target className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-ink-primary">No savings goals yet</h3>
        <p className="text-xs text-ink-muted max-w-md mx-auto">
          There is no goals backend in this workspace, so progress bars are not invented. Record
          income and expenses on Activity, then return here once targets are supported.
        </p>
      </div>
    </div>
  );
};
