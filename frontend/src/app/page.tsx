'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  api,
  clearToken,
  User,
  Category,
  Transaction,
  DashboardSummary,
  TrendPoint,
} from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { HomeView } from '@/components/HomeView';
import { ActivityView } from '@/components/ActivityView';
import { AddMoneyView } from '@/components/AddMoneyView';
import { ReceiptScanView } from '@/components/ReceiptScanView';
import { AIAssistantView } from '@/components/AIAssistantView';
import { CardsView } from '@/components/CardsView';
import { TransfersView } from '@/components/TransfersView';
import { GoalsView } from '@/components/GoalsView';
import SettingsView from '@/components/SettingsView';
import AuthModal from '@/components/AuthModal';
import TransactionDetailModal from '@/components/TransactionDetailModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Selected currency for views
  const [selectedCurrency, setSelectedCurrency] = useState<string>('MAD');

  // Dashboard & Activity data
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [period, setPeriod] = useState<string>('30d');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [addMoneyType, setAddMoneyType] = useState<'income' | 'expense'>('income');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Detail Modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Fetch reference categories
  const fetchCategories = useCallback(async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch {
      // ignore
    }
  }, []);

  // Fetch Dashboard summary & recent transactions
  const fetchDashboardData = useCallback(async (curr: string) => {
    try {
      const [sum, recents] = await Promise.all([
        api.getSummary(curr),
        api.getTransactions({ page: 1, size: 5, currency: curr }),
      ]);
      setSummary(sum);
      setRecentTransactions(recents.items);
    } catch {
      // ignore
    }
  }, []);

  // Fetch Activity transactions & trends
  const fetchActivityData = useCallback(
    async (
      curr: string,
      page: number,
      pPeriod: string,
      search: string,
      type: string,
      catId: string
    ) => {
      try {
        const [txRes, trRes] = await Promise.all([
          api.getTransactions({
            page,
            size: 10,
            currency: curr,
            search: search || undefined,
            type: type !== 'all' && type !== 'transfer' ? type : undefined,
            category_id: catId !== 'all' ? Number(catId) : undefined,
          }),
          api.getTrends(curr, pPeriod),
        ]);
        setTransactions(txRes.items);
        setTotalTransactions(txRes.total);
        setCurrentPage(txRes.page);
        setTotalPages(txRes.pages || 1);
        setTrends(trRes);
      } catch {
        // ignore
      }
    },
    []
  );

  // Refresh all current data
  const refreshCurrentView = useCallback(() => {
    fetchDashboardData(selectedCurrency);
    fetchActivityData(
      selectedCurrency,
      currentPage,
      period,
      searchQuery,
      typeFilter,
      categoryFilter
    );
  }, [
    fetchDashboardData,
    fetchActivityData,
    selectedCurrency,
    currentPage,
    period,
    searchQuery,
    typeFilter,
    categoryFilter,
  ]);

  // Load user profile on startup
  const loadUser = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
      setSelectedCurrency(u.preferred_currency || 'MAD');
      setAuthModalOpen(false);
      await fetchCategories();
      await fetchDashboardData(u.preferred_currency || 'MAD');
    } catch {
      setUser(null);
      setAuthModalOpen(true);
    } finally {
      setLoadingInitial(false);
    }
  }, [fetchCategories, fetchDashboardData]);

  useEffect(() => {
    loadUser();

    const handleAuthRequired = () => {
      setUser(null);
      setAuthModalOpen(true);
    };

    window.addEventListener('auth_required', handleAuthRequired);
    return () => window.removeEventListener('auth_required', handleAuthRequired);
  }, [loadUser]);

  // When currency, page, filters or period change, refresh activity
  useEffect(() => {
    if (user) {
      if (currentTab === 'home') {
        fetchDashboardData(selectedCurrency);
      } else if (currentTab === 'activity') {
        fetchActivityData(
          selectedCurrency,
          currentPage,
          period,
          searchQuery,
          typeFilter,
          categoryFilter
        );
      }
    }
  }, [
    currentTab,
    selectedCurrency,
    currentPage,
    period,
    searchQuery,
    typeFilter,
    categoryFilter,
    user,
    fetchDashboardData,
    fetchActivityData,
  ]);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setAuthModalOpen(true);
  };

  const handleAuthenticated = (loggedInUser: User) => {
    setUser(loggedInUser);
    setSelectedCurrency(loggedInUser.preferred_currency || 'MAD');
    setAuthModalOpen(false);
    fetchCategories();
    fetchDashboardData(loggedInUser.preferred_currency || 'MAD');
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.deleteTransaction(id);
      refreshCurrentView();
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction');
    }
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'home':
        return {
          title: `Welcome back, ${user?.full_name?.split(' ')[0] || 'Member'}`,
          subtitle: 'Balance, actions, and your financial copilot.',
        };
      case 'activity':
        return {
          title: 'Your Activity',
          subtitle: 'Cash-flow analytics and transaction history.',
        };
      case 'add':
        return {
          title: addMoneyType === 'expense' ? 'Withdraw' : 'Add Money',
          subtitle: 'Choose an amount and record the source.',
        };
      case 'scan':
        return {
          title: 'Receipt Scanner',
          subtitle: 'Extract a draft, then confirm before it is saved.',
        };
      case 'ai':
        return {
          title: 'KHAZI AI',
          subtitle: 'Read-only questions about your recorded finances.',
        };
      case 'cards':
        return { title: 'Cards', subtitle: 'Linked payment methods, when available.' };
      case 'transfers':
        return { title: 'Transfers', subtitle: 'Record an outgoing transfer on your ledger.' };
      case 'goals':
        return { title: 'Goals', subtitle: 'Savings targets when the product stores them.' };
      case 'settings':
        return {
          title: 'Settings',
          subtitle: 'Profile, categories, and preferences.',
        };
      default:
        return { title: 'KHAZI' };
    }
  };

  const handleNavigate = (
    tab: string,
    options?: { moneyType?: 'income' | 'expense'; recipient?: string }
  ) => {
    if (options?.moneyType) setAddMoneyType(options.moneyType);
    if (tab === 'add' && !options?.moneyType) setAddMoneyType('income');
    setCurrentTab(tab);
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-app bg-glow-radial flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-control bg-greenDeep text-lime border border-borderSubtle flex items-center justify-center font-extrabold text-2xl">
          K
        </div>
        <p className="text-sm font-semibold text-ink-muted tracking-wider uppercase">
          Loading KHAZI...
        </p>
      </div>
    );
  }

  const { title, subtitle } = getPageTitle();

  return (
    <div className="min-h-screen bg-app text-ink-primary flex bg-glow-radial">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 md:pl-[188px]">
        <TopBar
          title={title}
          subtitle={subtitle}
          user={user}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onQuickAction={(action) => setCurrentTab(action)}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          onSearchSubmit={(q) => {
            setSearchQuery(q);
            setCurrentPage(1);
            setCurrentTab('activity');
          }}
          onLogout={handleLogout}
        />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'home' && (
            <HomeView
              summary={summary}
              recentTransactions={recentTransactions}
              onNavigate={handleNavigate}
              onOpenTransactionDetail={(tx) => setSelectedTx(tx)}
              onSelectCurrency={(c) => setSelectedCurrency(c)}
              selectedCurrency={selectedCurrency}
            />
          )}

          {currentTab === 'activity' && (
            <ActivityView
              transactions={transactions}
              totalTransactions={totalTransactions}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
              categories={categories}
              selectedCurrency={selectedCurrency}
              trends={trends}
              period={period}
              onPeriodChange={(p) => setPeriod(p)}
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              typeFilter={typeFilter}
              onTypeFilterChange={(t) => {
                setTypeFilter(t);
                setCurrentPage(1);
              }}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={(c) => {
                setCategoryFilter(c);
                setCurrentPage(1);
              }}
              onOpenTransactionDetail={(tx) => setSelectedTx(tx)}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {currentTab === 'add' && (
            <AddMoneyView
              categories={categories}
              preferredCurrency={selectedCurrency}
              initialType={addMoneyType}
              onScanReceipt={() => setCurrentTab('scan')}
              onSuccess={() => {
                refreshCurrentView();
                setCurrentTab('activity');
              }}
            />
          )}

          {currentTab === 'cards' && <CardsView />}

          {currentTab === 'transfers' && (
            <TransfersView
              preferredCurrency={selectedCurrency}
              onSuccess={() => {
                refreshCurrentView();
                setCurrentTab('activity');
              }}
            />
          )}

          {currentTab === 'goals' && <GoalsView />}

          {currentTab === 'scan' && (
            <ReceiptScanView
              categories={categories}
              preferredCurrency={selectedCurrency}
              onSuccess={() => {
                refreshCurrentView();
                setCurrentTab('activity');
              }}
            />
          )}

          {currentTab === 'ai' && <AIAssistantView />}

          {currentTab === 'settings' && (
            <SettingsView
              user={user}
              categories={categories}
              onUserUpdated={(u) => {
                setUser(u);
                setSelectedCurrency(u.preferred_currency || 'MAD');
              }}
              onCategoriesUpdated={() => fetchCategories()}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Transaction Details & Inline Editing Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        categories={categories}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        onUpdated={() => {
          setSelectedTx(null);
          refreshCurrentView();
        }}
        onDeleted={() => {
          setSelectedTx(null);
          refreshCurrentView();
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  );
}
