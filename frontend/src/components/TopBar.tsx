import React from 'react';
import { Menu, Sparkles, Plus, Receipt, Bot } from 'lucide-react';
import { User } from '@/lib/api';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  onQuickAction: (action: string) => void;
  user: User | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  onQuickAction,
  user,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-page/90 backdrop-blur-md border-b border-borderSubtle px-4 sm:px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-control bg-surface border border-borderSubtle text-ink hover:bg-surface-muted transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-ink-muted">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onQuickAction('scan')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-semibold bg-surface border border-borderSubtle text-ink hover:bg-surface-muted transition-colors shadow-sm"
        >
          <Receipt className="w-3.5 h-3.5 text-ink-muted" />
          <span>Scan Receipt</span>
        </button>

        <button
          onClick={() => onQuickAction('add')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-semibold bg-forest text-white hover:bg-forest-light transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-lime" />
          <span>Add Transaction</span>
        </button>
      </div>
    </header>
  );
};

