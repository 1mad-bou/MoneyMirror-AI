import React from 'react';
import { 
  Home, 
  Activity, 
  PlusCircle, 
  Receipt, 
  Bot, 
  Settings, 
  LogOut, 
  Sparkles,
  Wallet
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

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'add', label: 'Add Money', icon: PlusCircle },
    { id: 'scan', label: 'Scan Receipt', icon: Receipt },
    { id: 'ai', label: 'AI Assistant', icon: Bot, badge: 'Gemma' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    setCurrentTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-forest text-white flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Brand */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-control bg-lime flex items-center justify-center text-forest font-bold text-xl shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                MoneyMirror <span className="text-lime text-xs px-1.5 py-0.5 rounded bg-lime/20 border border-lime/30">AI</span>
              </h1>
              <p className="text-xs text-white/60">Personal Finance</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-control text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-lime text-forest shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-forest' : 'text-white/70'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-forest/20 text-forest' : 'bg-lime/20 text-lime border border-lime/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile / Logout */}
      <div className="p-4 border-t border-white/10 bg-forest-deep/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-lime/20 text-lime border border-lime/30 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user ? (user.full_name?.[0] || user.email[0]).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name || user?.email || 'Guest User'}
              </p>
              <p className="text-xs text-white/50 truncate">
                {user?.preferred_currency || 'MAD'} Account
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="p-2 rounded-control text-white/60 hover:text-danger hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

