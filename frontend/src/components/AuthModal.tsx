'use client';

import React, { useState } from 'react';
import { api, setToken, User } from '@/lib/api';
import { Lock, Mail, User as UserIcon, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onAuthenticated: (user: User) => void;
  onClose?: () => void;
}

export default function AuthModal({ isOpen, onAuthenticated, onClose }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await api.login({ email, password });
        setToken(res.access_token);
        onAuthenticated(res.user);
      } else {
        const res = await api.register({
          email,
          password,
          full_name: fullName || undefined,
        });
        setToken(res.access_token);
        onAuthenticated(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    const demoEmail = 'demo@moneymirror.ai';
    const demoPassword = 'moneymirror-demo-password-123';

    try {
      // First try to login
      try {
        const res = await api.login({ email: demoEmail, password: demoPassword });
        setToken(res.access_token);
        onAuthenticated(res.user);
        return;
      } catch (e) {
        // If login failed, try to register
        const res = await api.register({
          email: demoEmail,
          password: demoPassword,
          full_name: 'Demo Explorer',
        });
        setToken(res.access_token);
        onAuthenticated(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to auto-sign in demo account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-surface rounded-3xl border border-borderSubtle shadow-2xl p-6 sm:p-8 space-y-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-forest text-lime shadow-md mb-2">
            <span className="font-extrabold text-2xl tracking-tight">M</span>
          </div>
          <h2 className="text-2xl font-extrabold text-ink tracking-tight">
            MoneyMirror AI
          </h2>
          <p className="text-xs text-inkMuted">
            Autonomous Financial Intelligence & Multimodal Receipt Extraction
          </p>
        </div>

        {/* 1-Click Demo Button */}
        <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/15 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-forest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-forest" /> Quick Evaluator Access
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-inkMuted">
              No setup required
            </span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-forest text-lime font-bold text-xs hover:bg-forest/90 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
          >
            <span>Launch with 1-Click Demo Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative flex items-center justify-center text-xs text-inkMuted">
          <div className="border-t border-borderSubtle w-full" />
          <span className="bg-surface px-3 uppercase tracking-wider text-[10px] font-semibold">
            Or Use Account
          </span>
          <div className="border-t border-borderSubtle w-full" />
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-surfaceAlt rounded-2xl border border-borderSubtle">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-inkMuted hover:text-ink'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-inkMuted hover:text-ink'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-inkMuted mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Alex Hunter"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-borderSubtle bg-surfaceAlt text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-inkMuted mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-borderSubtle bg-surfaceAlt text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-inkMuted mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-borderSubtle bg-surfaceAlt text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-forest text-white font-bold text-sm hover:bg-forest/90 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

