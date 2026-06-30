'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Loader2, XCircle, LogIn } from 'lucide-react';
import { verifyMagicLink } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const token = searchParams.get('token');

  useEffect(() => { document.title = 'Sign In | DateInIndia'; }, []);

  async function handleSignIn() {
    if (!token) return;
    setStatus('loading');
    const name = sessionStorage.getItem('signup_name') || undefined;
    try {
      const { accessToken, isNewUser, hasPassword } = await verifyMagicLink(token, name);
      sessionStorage.removeItem('signup_name');
      signIn(accessToken);
      if (isNewUser) {
        router.replace('/set-password?next=/onboarding');
      } else if (!hasPassword) {
        router.replace('/set-password?next=/browse');
      } else {
        router.replace('/browse');
      }
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg((err as Error).message || 'This link has expired or already been used. Request a new one.');
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-2xl text-gray-900">DateInIndia</span>
          </Link>
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 space-y-5">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-gray-500 text-sm">No sign-in link found. Please request a new one.</p>
            <Link href="/login" className="inline-flex items-center justify-center w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-display font-bold text-2xl text-gray-900">DateInIndia</span>
        </Link>

        {status === 'error' ? (
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 space-y-5">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-900 mb-2">Link expired</h1>
              <p className="text-gray-500 text-sm leading-relaxed">{errorMsg}</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 space-y-6">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-orange-500 fill-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-900 mb-2">Ready to sign in</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Click the button below to complete your sign-in to DateInIndia.
              </p>
            </div>
            <button
              onClick={handleSignIn}
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              {status === 'loading' ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in…</>
              ) : (
                <><LogIn className="w-5 h-5" /> Click to Sign In</>
              )}
            </button>
            <p className="text-xs text-gray-400">
              This link can only be used once and expires in 15 minutes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
