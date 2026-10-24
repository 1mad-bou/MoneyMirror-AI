import React from 'react';
import {
  Home,
  Activity,
  CreditCard,
  Send,
  Target,
  Bot,
  Settings,
  LogOut,
  Receipt,
  PlusCircle,
} from 'lucide-react';
import { User } from '@/lib/api';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const primaryNav = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'transfers', label: 'Transfers', icon: Send },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'ai', label: 'AI Assistant', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const toolsNav = [
  { id: 'add', label: 'Add Money', icon: PlusCircle },
  { id: 'scan', label: 'Scan Receipt', icon: Receipt },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}) => {
  const handleSelect = (id: string) => {
    setCurrentTab(id);
    onCloseMobile?.();
  };

  const renderItem = (item: { id: string; label: string; icon: typeof Home }) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleSelect(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-control text-[13px] font-semibold transition-colors ${
          isActive
            ? 'bg-greenActive text-ink-primary'
            : 'text-ink-secondary hover:bg-cardHover hover:text-ink-primary'
        }`}
      >
        <span
          className={`w-0.5 h-4 rounded-full ${isActive ? 'bg-lime' : 'bg-transparent'}`}
          aria-hidden
        />
        <Icon className={`w-4 h-4 ${isActive ? 'text-lime' : 'text-ink-muted'}`} />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {isOpenMobile && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[188px] bg-sidebar border-r border-borderSubtle flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-[64px] px-5 border-b border-borderSubtle flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-control bg-greenDeep border border-borderSubtle flex items-center justify-center text-lime font-black">
            M
          </div>
          <div>
            <p className="font-extrabold text-[15px] tracking-[0.08em] text-ink-primary leading-none">
              MoneyMirror
            </p>
            <p className="text-[10px] text-ink-muted mt-0.5">Finance workspace</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Menu
            </p>
            <div className="space-y-0.5">{primaryNav.map(renderItem)}</div>
          </div>
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Record
            </p>
            <div className="space-y-0.5">{toolsNav.map(renderItem)}</div>
          </div>
        </nav>

        <div className="p-3 border-t border-borderSubtle">
          <div className="p-2.5 rounded-control bg-cardRaised border border-borderSubtle flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-greenDeep text-lime border border-borderSubtle flex items-center justify-center text-xs font-bold shrink-0">
              {user ? (user.full_name?.[0] || user.email[0]).toUpperCase() : 'K'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-ink-primary truncate">
                {user?.full_name || user?.email || 'Guest'}
              </p>
              <p className="text-[10px] text-ink-muted truncate">
                {user?.preferred_currency || 'MAD'}
              </p>
            </div>
            <button
              onClick={onLogout}
              title="Log out"
              aria-label="Log out"
              className="p-1.5 rounded-control text-ink-muted hover:text-danger hover:bg-cardHover"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
