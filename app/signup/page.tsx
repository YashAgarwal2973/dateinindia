'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Mail, ArrowRight, ChevronLeft, User, CheckCircle } from 'lucide-react';
import { sendMagicLink } from '@/lib/api';

type Step = 'name' | 'email' | 'sent';

export default function SignupPage() {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { document.title = 'Create Account | DateInIndia'; }, []);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      // Store name in sessionStorage so the login page can pass it to verify-magic-link
      sessionStorage.setItem('signup_name', name.trim());
      await sendMagicLink(email.trim(), name.trim());
      setStep('sent');
    } catch {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const STEPS: Step[] = ['name', 'email', 'sent'];
  const stepIndex = STEPS.indexOf(step);

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

          <div className="flex items-center justify-center gap-2 mb-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s ? 'bg-orange-500 text-white' :
                  stepIndex > i ? 'bg-green-500 text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {stepIndex > i ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 ${stepIndex > i ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-display font-bold text-gray-900">
            {step === 'name' ? 'Create your account' :
             step === 'email' ? 'Your email address' :
             'Check your email'}
          </h1>
          {step === 'sent' && (
            <p className="text-gray-500 mt-2">We sent a magic link to {email}</p>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          {step === 'name' && (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (name.trim().length < 2) { setError('Enter your full name'); return; }
                setError('');
                setStep('email');
              }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Priya Sharma"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">This is how you&apos;ll appear on DateInIndia</p>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-orange-500 font-semibold hover:underline">
                  Log in
                </Link>
              </p>
            </form>
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
                <p className="text-xs text-gray-400 mt-1.5">We&apos;ll send a magic link — no password needed</p>
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

              <button
                type="button"
                onClick={() => { setStep('name'); setError(''); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </form>
          )}

          {step === 'sent' && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-center text-sm text-gray-600 leading-relaxed">
                Click the link in your email to complete signup. It expires in 15 minutes.
              </p>
              <p className="text-center text-xs text-gray-400">
                No email? Check your spam folder or{' '}
                <button
                  onClick={() => { setStep('email'); setError(''); }}
                  className="text-orange-500 font-semibold hover:underline"
                >
                  try again
                </button>.
              </p>
            </div>
          )}
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
