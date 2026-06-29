'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { setPassword } from '@/lib/api';
import AuthGuard from '@/components/shared/AuthGuard';

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passwordValue, setPasswordValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const next = searchParams.get('next') || '/browse';

  useEffect(() => { document.title = 'Set Password | DateInIndia'; }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (passwordValue.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (passwordValue !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const raw = localStorage.getItem('dateinindia_session');
      const jwt = raw ? JSON.parse(raw).access_token : null;
      if (!jwt) throw new Error('No active session');
      await setPassword(jwt, passwordValue);
      setDone(true);
      setTimeout(() => router.replace(next), 1500);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Set a password</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Optional — lets you sign in faster next time without waiting for an email.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <p className="font-semibold text-gray-900">Password set!</p>
              <p className="text-sm text-gray-500">Redirecting you now…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordValue}
                    onChange={e => setPasswordValue(e.target.value)}
                    placeholder="At least 8 characters"
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Setting password…</> : <><Lock className="w-5 h-5" /> Set Password</>}
              </button>

              <button
                type="button"
                onClick={() => router.replace(next)}
                className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Skip for now
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          You can always set a password later in{' '}
          <Link href="/settings" className="underline hover:text-gray-600">Settings</Link>.
        </p>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        </div>
      }>
        <SetPasswordContent />
      </Suspense>
    </AuthGuard>
  );
}
