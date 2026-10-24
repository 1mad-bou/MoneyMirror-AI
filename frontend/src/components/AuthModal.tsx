'use client';

import React, { useState } from 'react';
import { api, setToken, User } from '@/lib/api';
import { Lock, Mail, User as UserIcon, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onAuthenticated: (user: User) => void;
  onClose?: () => void;
}

export default function AuthModal({ isOpen, onAuthenticated }: Props) {
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
      try {
        const res = await api.login({ email: demoEmail, password: demoPassword });
        setToken(res.access_token);
        onAuthenticated(res.user);
        return;
      } catch {
        const res = await api.register({
          email: demoEmail,
          password: demoPassword,
          full_name: 'Demo Explorer',
        });
        setToken(res.access_token);
        onAuthenticated(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in to the demo account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md bg-panel rounded-hero border border-borderSubtle shadow-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-control bg-greenDeep text-lime border border-borderSubtle mb-2 font-black text-xl">
            K
          </div>
          <h2 className="text-2xl font-extrabold text-ink-primary tracking-[0.14em]">KHAZI</h2>
          <p className="text-xs text-ink-muted">Dark forest-green finance workspace</p>
        </div>

        <div className="p-3.5 rounded-card bg-greenDeep/40 border border-borderSubtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-lime flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Quick access
            </span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-control bg-lime text-app font-bold text-xs hover:bg-lime-hover disabled:opacity-50"
          >
            Launch demo account
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex p-1 bg-cardRaised rounded-control border border-borderSubtle">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-control ${
              tab === 'login' ? 'bg-greenActive text-ink-primary' : 'text-ink-muted'
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
            className={`flex-1 py-2 text-xs font-bold rounded-control ${
              tab === 'register' ? 'bg-greenActive text-ink-primary' : 'text-ink-muted'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-control bg-danger/15 border border-danger/30 text-danger text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1" htmlFor="full-name">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                <input
                  id="full-name"
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-control border border-borderSubtle bg-app text-ink-primary text-sm focus:outline-none focus:border-lime/60"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
              <input
                id="email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-control border border-borderSubtle bg-app text-ink-primary text-sm focus:outline-none focus:border-lime/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
              <input
                id="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-control border border-borderSubtle bg-app text-ink-primary text-sm focus:outline-none focus:border-lime/60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-control bg-lime text-app font-bold text-sm hover:bg-lime-hover disabled:opacity-50"
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
