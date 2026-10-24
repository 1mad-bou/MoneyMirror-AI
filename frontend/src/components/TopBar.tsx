import React, { useEffect, useRef, useState } from 'react';
import { Menu, Search, Bell, ChevronDown, Settings, LogOut } from 'lucide-react';
import { User } from '@/lib/api';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  onQuickAction: (action: string) => void;
  user: User | null;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  onQuickAction,
  user,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  onLogout,
}) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-app/85 backdrop-blur-xl border-b border-borderSubtle px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-control bg-cardRaised border border-borderSubtle text-ink-primary hover:bg-cardHover"
          aria-label="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-[17px] font-bold text-ink-primary tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-ink-muted hidden sm:block truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <form
        className="hidden md:flex items-center flex-1 max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit?.(searchQuery);
        }}
      >
        <label className="relative w-full">
          <span className="sr-only">Search transactions or merchants</span>
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search transactions, merchants, or ask anything..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full bg-panel border border-borderSubtle rounded-control pl-9 pr-14 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-lime/50"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] bg-cardRaised border border-borderSubtle text-ink-muted px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </label>
      </form>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              setNotesOpen((v) => !v);
              setMenuOpen(false);
            }}
            className="w-9 h-9 rounded-control bg-cardRaised border border-borderSubtle text-ink-secondary hover:text-ink-primary hover:bg-cardHover flex items-center justify-center"
          >
            <Bell className="w-4 h-4" />
          </button>
          {notesOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-card bg-panel border border-borderSubtle shadow-card p-3 z-50">
              <p className="text-xs font-bold text-ink-primary">Notifications</p>
              <p className="text-[11px] text-ink-muted mt-1">
                No alerts yet. Transaction and budget notices will appear here when available.
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setNotesOpen(false);
            }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-control bg-cardRaised border border-borderSubtle hover:bg-cardHover"
            aria-label="Account menu"
          >
            <div className="w-7 h-7 rounded-full bg-greenDeep text-lime text-[11px] font-bold flex items-center justify-center">
              {user ? (user.full_name?.[0] || user.email[0]).toUpperCase() : 'K'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted hidden sm:block" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-card bg-panel border border-borderSubtle shadow-card py-1 z-50">
              <div className="px-3 py-2 border-b border-borderSubtle">
                <p className="text-xs font-bold text-ink-primary truncate">
                  {user?.full_name || 'Account'}
                </p>
                <p className="text-[10px] text-ink-muted truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onQuickAction('settings');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink-secondary hover:bg-cardHover hover:text-ink-primary"
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-cardHover"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
