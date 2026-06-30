'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2 } from 'lucide-react';
import { supabase, getAuthClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function SignupPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirm, setNeedsConfirm] = useState(false);

  useEffect(() => { document.title = 'Create Account | DateInIndia'; }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) { setError('Enter your full name'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email address'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: name.trim() } },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered')) {
          throw new Error('An account with this email already exists. Sign in instead.');
        }
        throw new Error(signUpError.message);
      }

      if (!data.user) throw new Error('Signup failed. Please try again.');

      if (!data.session) {
        // Email confirmation is enabled in Supabase — user must confirm first.
        // Disable it in: Dashboard → Authentication → Providers → Email → "Confirm email" toggle OFF
        setNeedsConfirm(true);
        return;
      }

      // Create the public.users profile row using the new session JWT.
      // Requires "users_insert_own" RLS policy (auth.uid() = id).
      const authClient = getAuthClient(data.session.access_token);
      const { error: profileError } = await authClient.from('users').insert({
        id: data.user.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        // Unique placeholder — replaced with real phone during onboarding if collected
        phone: `em_${data.user.id.replace(/-/g, '').slice(0, 12)}`,
        date_of_birth: '1990-01-01',  // placeholder; updated in onboarding
        gender: 'man',                // placeholder; updated in onboarding
        looking_for: 'everyone',
        relationship_goal: 'not_sure',
        trust_score: 10,
        onboarding_step: 1,
        onboarding_complete: false,
      });

      if (profileError) {
        console.error('Profile creation failed:', profileError);
        throw new Error('Account created but profile setup failed. Please contact support.');
      }

      signIn(data.session.access_token);
      router.replace('/onboarding');
    } catch (err: unknown) {
      setError((err as Error).message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-2xl text-gray-900">DateInIndia</span>
          </Link>
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 space-y-4">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-xl font-display font-bold text-gray-900">Check your email</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-2xl text-gray-900">DateInIndia</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-2 text-sm">Find your person. Start for free.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Priya Sharma"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">This is how you&apos;ll appear on DateInIndia</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creating account…</>
              ) : (
                <>Create Account <ArrowRight className="w-5 h-5" /></>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-orange-500 font-semibold hover:underline">Sign in</Link>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
          By signing up you agree to our{' '}
          <Link href="/terms" className="underline hover:text-gray-600">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.<br />
          Compliant with India&apos;s DPDP Act 2023. You must be 18 or older.
        </p>
      </div>
    </div>
  );
}
