'use client';

import React, { useState, useEffect } from 'react';
import { User, Category, api } from '@/lib/api';
import {
  Settings,
  User as UserIcon,
  Tag,
  Plus,
  Trash2,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
} from 'lucide-react';

interface Props {
  user: User | null;
  categories: Category[];
  onUserUpdated: (u: User) => void;
  onCategoriesUpdated: () => void;
  onLogout: () => void;
}

export default function SettingsView({
  user,
  categories,
  onUserUpdated,
  onCategoriesUpdated,
  onLogout,
}: Props) {
  // Profile state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [preferredCurrency, setPreferredCurrency] = useState(
    user?.preferred_currency || 'MAD'
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // New Category State
  const [catName, setCatName] = useState('');
  const [catKind, setCatKind] = useState<'expense' | 'income'>('expense');
  const [catIcon, setCatIcon] = useState('🏷️');
  const [addingCategory, setAddingCategory] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // System & AI Status
  const [aiStatus, setAiStatus] = useState<{
    gemma_configured: boolean;
    gemma_model: string;
    ocr_enabled: boolean;
    embeddings_enabled: boolean;
  } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPreferredCurrency(user.preferred_currency || 'MAD');
    }
  }, [user]);

  useEffect(() => {
    api.getAIStatus().then(setAiStatus).catch(() => {});
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const updated = await api.updateMe({
        full_name: fullName,
        preferred_currency: preferredCurrency,
      });
      onUserUpdated(updated);
      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setProfileMessage({
        text: err.message || 'Failed to update profile',
        type: 'error',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setAddingCategory(true);
    setCatError(null);
    try {
      await api.createCategory({
        name: catName.trim(),
        kind: catKind,
        icon: catIcon.trim() || '📁',
      });
      setCatName('');
      onCategoriesUpdated();
    } catch (err: any) {
      setCatError(err.message || 'Failed to create category');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this custom category?')) return;
    try {
      await api.deleteCategory(id);
      onCategoriesUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const emojiPresets = ['🍔', '🛒', '🚕', '💡', '🏠', '🎬', '💊', '✈️', '💼', '📈', '🎁', '🎓'];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Title */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-ink tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-sm text-inkMuted mt-1">
          Manage your account profile, custom categories, and AI system capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Profile & AI Status) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-surface rounded-3xl p-6 border border-borderSubtle shadow-card space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-ink">User Profile</h3>
                <p className="text-xs text-inkMuted">{user?.email}</p>
              </div>
            </div>

            {profileMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  profileMessage.type === 'success'
                    ? 'bg-lime/20 text-forest border border-lime/40'
                    : 'bg-danger/10 text-danger border border-danger/20'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-inkMuted mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-borderSubtle bg-surfaceAlt text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-inkMuted mb-1">
                  Preferred Currency
                </label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-borderSubtle bg-surfaceAlt text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest font-medium"
                >
                  <option value="MAD">MAD (Moroccan Dirham)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-forest text-white hover:bg-forest/90 transition-all shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>

            <div className="pt-4 border-t border-borderSubtle">
              <button
                onClick={onLogout}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* AI & Security Status */}
          <div className="bg-surface rounded-3xl p-6 border border-borderSubtle shadow-card space-y-4">
            <div className="flex items-center gap-2 text-forest font-bold text-sm">
              <Cpu className="w-4 h-4" />
              <span>AI Engine Architecture</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surfaceAlt border border-borderSubtle/50">
                <span className="text-inkMuted">LLM Assistant:</span>
                <span className="font-semibold text-ink">
                  {aiStatus?.gemma_model || 'Gemma 3 (27B IT)'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surfaceAlt border border-borderSubtle/50">
                <span className="text-inkMuted">Vector Embeddings:</span>
                <span className="font-semibold text-forest">
                  {aiStatus?.embeddings_enabled ? 'FastEmbed BGE-small' : 'Active'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surfaceAlt border border-borderSubtle/50">
                <span className="text-inkMuted">OCR Engine:</span>
                <span className="font-semibold text-forest">
                  {aiStatus?.ocr_enabled ? 'RapidOCR (PP-OCRv4)' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-forest/5 border border-forest/15 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-forest shrink-0 mt-0.5" />
              <p className="text-[11px] text-ink leading-relaxed">
                <strong>Read-Only Guard:</strong> AI Chatbot executes queries under isolated read-only
                Postgres sessions. Transaction writing is strictly forbidden in conversational flows.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (Category Management) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-3xl p-6 border border-borderSubtle shadow-card space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-ink flex items-center gap-2">
                  <Tag className="w-4 h-4 text-forest" />
                  Category Management
                </h3>
                <p className="text-xs text-inkMuted mt-0.5">
                  Customize and organize spending & income categories.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surfaceAlt border border-borderSubtle text-inkMuted">
                {categories.length} Total
              </span>
            </div>

            {/* Add Category Form */}
            <form
              onSubmit={handleAddCategory}
              className="p-4 rounded-2xl bg-surfaceAlt border border-borderSubtle space-y-3"
            >
              <div className="text-xs font-bold text-ink uppercase tracking-wider">
                Create New Category
              </div>

              {catError && (
                <div className="text-xs text-danger bg-danger/10 p-2 rounded-lg border border-danger/20">
                  {catError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-inkMuted mb-1">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    maxLength={4}
                    className="w-full text-center py-2 rounded-xl border border-borderSubtle bg-surface text-ink text-base focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-inkMuted mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Freelance, Gym, Pets"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-borderSubtle bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-inkMuted mb-1">
                    Kind
                  </label>
                  <select
                    value={catKind}
                    onChange={(e) => setCatKind(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-borderSubtle bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest font-medium"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="submit"
                    disabled={addingCategory || !catName.trim()}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold bg-forest text-white hover:bg-forest/90 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Emoji quick presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {emojiPresets.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setCatIcon(em)}
                    className="text-base p-1.5 rounded-lg bg-surface border border-borderSubtle/60 hover:bg-lime/20 hover:border-forest transition-colors"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </form>

            {/* Category Lists */}
            <div className="space-y-6">
              {/* Expense Categories */}
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
                  Expense Categories (
                  {categories.filter((c) => c.kind === 'expense').length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {categories
                    .filter((c) => c.kind === 'expense')
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-surfaceAlt border border-borderSubtle/60 text-sm"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">{cat.icon || '📁'}</span>
                          <span className="font-semibold text-ink truncate">
                            {cat.name}
                          </span>
                        </div>
                        {cat.is_default ? (
                          <span className="text-[10px] text-inkMuted uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface border border-borderSubtle shrink-0">
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 rounded-lg text-inkMuted hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Income Categories */}
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
                  Income Categories (
                  {categories.filter((c) => c.kind === 'income').length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {categories
                    .filter((c) => c.kind === 'income')
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-surfaceAlt border border-borderSubtle/60 text-sm"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">{cat.icon || '💰'}</span>
                          <span className="font-semibold text-ink truncate">
                            {cat.name}
                          </span>
                        </div>
                        {cat.is_default ? (
                          <span className="text-[10px] text-inkMuted uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface border border-borderSubtle shrink-0">
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 rounded-lg text-inkMuted hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

