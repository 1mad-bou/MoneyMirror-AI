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
  Loader2
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
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">Settings & Preferences</h2>
        <p className="text-xs text-ink-muted">
          Manage your account profile, custom categories, and AI infrastructure
        </p>
      </div>

      {/* Profile & Currency Form */}
      <div className="rounded-card bg-panel border border-borderSubtle p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-borderSubtle">
          <UserIcon className="w-4 h-4 text-lime" />
          <h3 className="text-sm font-bold text-ink-primary">Account Profile</h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-app/50 border border-borderSubtle rounded-control px-3 py-2 text-xs text-ink-muted cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-lime/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Default Currency
              </label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-lime/60 cursor-pointer"
              >
                {['MAD', 'USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AED', 'SAR'].map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {profileMessage && (
            <div
              className={`p-3 rounded-control text-xs flex items-center gap-2 ${
                profileMessage.type === 'success'
                  ? 'bg-success/15 border border-success/40 text-success'
                  : 'bg-danger/15 border border-danger/40 text-danger'
              }`}
            >
              {profileMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2 rounded-control text-xs font-bold bg-lime text-app hover:bg-lime-hover disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-glow"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Category Manager */}
      <div className="rounded-card bg-panel border border-borderSubtle p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-borderSubtle">
          <Tag className="w-4 h-4 text-lime" />
          <h3 className="text-sm font-bold text-ink-primary">Custom Categories</h3>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="p-4 rounded-control bg-cardRaised border border-borderSubtle space-y-3">
          <p className="text-xs font-semibold text-ink-primary">Add New Category</p>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <input
                type="text"
                placeholder="Category name (e.g. Subscriptions)"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-lime/60"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={catKind}
                onChange={(e) => setCatKind(e.target.value as 'expense' | 'income')}
                className="w-full bg-app border border-borderSubtle rounded-control px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-lime/60 cursor-pointer"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={addingCategory || !catName.trim()}
                className="w-full py-2 rounded-control text-xs font-bold bg-lime text-app hover:bg-lime-hover disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shadow-glow"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Category</span>
              </button>
            </div>
          </div>

          {/* Quick emoji presets */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1">
            <span className="text-[10px] text-ink-muted">Icon:</span>
            {emojiPresets.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setCatIcon(em)}
                className={`p-1 text-sm rounded hover:bg-cardHover ${catIcon === em ? 'bg-greenActive border border-borderSubtle' : ''}`}
              >
                {em}
              </button>
            ))}
          </div>

          {catError && <p className="text-xs text-danger">{catError}</p>}
        </form>

        {/* Existing Categories List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-2.5 rounded-control bg-cardRaised border border-borderSubtle flex items-center justify-between group hover:border-lime/30 transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-base flex-shrink-0">{c.icon || '📁'}</span>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-ink-primary truncate">{c.name}</p>
                  <p className="text-[9px] uppercase font-mono text-ink-muted">{c.kind}</p>
                </div>
              </div>

              {!c.is_default && (
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-ink-muted hover:text-danger transition-opacity"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI & System Health Status */}
      <div className="rounded-card bg-panel border border-borderSubtle p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-borderSubtle">
          <Cpu className="w-4 h-4 text-lime" />
          <h3 className="text-sm font-bold text-ink-primary">AI & Vector Infrastructure</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-control bg-cardRaised border border-borderSubtle space-y-1">
            <span className="text-[10px] uppercase font-mono text-ink-muted">LLM Reasoning</span>
            <p className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${aiStatus?.gemma_configured ? 'bg-success' : 'bg-danger'}`} />
              {aiStatus?.gemma_model || 'Gemma 3'}
            </p>
            <p className="text-[10px] text-ink-muted">Zero-mutation read sandbox</p>
          </div>

          <div className="p-3.5 rounded-control bg-cardRaised border border-borderSubtle space-y-1">
            <span className="text-[10px] uppercase font-mono text-ink-muted">Vector Search</span>
            <p className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              bge-small-en-v1.5
            </p>
            <p className="text-[10px] text-ink-muted">FastEmbed + PostgreSQL pgvector</p>
          </div>

          <div className="p-3.5 rounded-control bg-cardRaised border border-borderSubtle space-y-1">
            <span className="text-[10px] uppercase font-mono text-ink-muted">Vision OCR</span>
            <p className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              RapidOCR & Vision Engine
            </p>
            <p className="text-[10px] text-ink-muted">Mandatory human review guardrail</p>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <div className="rounded-card bg-panel border border-borderSubtle p-6 shadow-card flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-ink-primary">Log Out of MoneyMirror</p>
          <p className="text-xs text-ink-muted">Terminates session on this browser device</p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-control text-xs font-bold bg-danger/15 text-danger border border-danger/30 hover:bg-danger hover:text-white transition-all flex items-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
