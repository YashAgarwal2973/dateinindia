'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Loader2, XCircle } from 'lucide-react';
import { verifyMagicLink } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Signing In | DateInIndia';
    const token = searchParams.get('token');

    if (!token) {
      router.replace('/login');
      return;
    }

    const name = sessionStorage.getItem('signup_name') || undefined;
    verifyMagicLink(token, name)
      .then(({ accessToken, isNewUser }) => {
        sessionStorage.removeItem('signup_name');
        signIn(accessToken);
        router.replace(isNewUser ? '/onboarding' : '/browse');
      })
      .catch(() => {
        setError('This link has expired or already been used. Request a new one.');
      });
  }, [searchParams, signIn, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-display font-bold text-2xl text-gray-900">DateInIndia</span>
        </Link>

        {error ? (
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 space-y-5">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-900 mb-2">Link expired</h1>
              <p className="text-gray-500 text-sm leading-relaxed">{error}</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
            <p className="text-gray-500 text-sm">Verifying your magic link&hellip;</p>
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
