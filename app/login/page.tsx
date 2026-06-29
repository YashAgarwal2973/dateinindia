'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Mail, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { sendMagicLink, verifyMagicLink } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Step = 'email' | 'sent' | 'verifying';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sessionExpired = searchParams.get('reason') === 'expired';
  const token = searchParams.get('token');

  useEffect(() => { document.title = 'Sign In | DateInIndia'; }, []);

  // Auto-verify when landing with a magic link token in the URL
  useEffect(() => {
    if (!token) return;
    setStep('verifying');
    const name = sessionStorage.getItem('signup_name') || undefined;
    verifyMagicLink(token, name)
      .then(({ accessToken, isNewUser }) => {
        sessionStorage.removeItem('signup_name');
        signIn(accessToken);
        router.replace(isNewUser ? '/onboarding' : '/browse');
      })
      .catch(() => {
        setError('This magic link is invalid or has expired. Please request a new one.');
        setStep('email');
      });
  }, [token, signIn, router]);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await sendMagicLink(email.trim());
      setStep('sent');
    } catch {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
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

          {sessionExpired && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-left">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">Your session expired. Please sign in again to continue.</p>
            </div>
          )}

          <h1 className="text-2xl font-display font-bold text-gray-900">
            {step === 'verifying' ? 'Signing you in…' :
             step === 'sent' ? 'Check your email' :
             'Welcome back'}
          </h1>
          <p className="text-gray-500 mt-2">
            {step === 'email' ? 'Sign in with your email — no password needed' :
             step === 'sent' ? `We sent a magic link to ${email} — check spam if you don't see it` :
             'Verifying your magic link…'}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          {step === 'verifying' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <p className="text-gray-500 text-sm">Just a moment&hellip;</p>
            </div>
          )}

          {step === 'sent' && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-center text-sm text-gray-600 leading-relaxed">
                Click the link in your email to sign in. It expires in 15 minutes.
              </p>
              <div className="w-full bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                <p className="text-orange-700 font-bold text-sm">📧 Check your spam folder!</p>
                <p className="text-orange-600 text-xs mt-1">Our emails sometimes land in spam. Move it to inbox and click the link.</p>
              </div>
              <p className="text-center text-sm font-bold text-orange-500">
                Didn&apos;t get it?{' '}
                <button
                  onClick={() => { setStep('email'); setError(''); }}
                  className="underline hover:text-orange-600"
                >
                  Try again
                </button>.
              </p>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendLink} className="space-y-5">
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
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Sending link…' : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Magic Link
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                New here?{' '}
                <Link href="/signup" className="text-orange-500 font-semibold hover:underline">
                  Create account
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
          By continuing you agree to our{' '}
          <Link href="/terms" className="underline hover:text-gray-600">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.<br />
          Compliant with India&apos;s DPDP Act 2023.
        </p>
      </div>
    </div>
  );
}
