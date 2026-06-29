'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Phone, ArrowRight, ChevronLeft, Clock } from 'lucide-react';
import { sendOTP, verifyOTPAndAuth } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otpId, setOtpId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpInputRef = useRef<HTMLInputElement>(null);

  const sessionExpired = searchParams.get('reason') === 'expired';

  // Scroll OTP input into view when virtual keyboard opens on mobile
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  useEffect(() => { document.title = 'Sign In | DateInIndia'; }, []);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!phone || phone.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const id = await sendOTP(phone);
      setOtpId(id);
      setStep('otp');
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (code.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const { accessToken, isNewUser } = await verifyOTPAndAuth(otpId, code, phone);
      signIn(accessToken);
      if (isNewUser) {
        router.push('/onboarding');
      } else {
        router.push('/browse');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
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
            {step === 'phone' ? 'Welcome back' : 'Enter your OTP'}          </h1>
          <p className="text-gray-500 mt-2">
            {step === 'phone'
              ? 'Sign in with your mobile number'
              : `We sent a 6-digit code to +91 ${phone}`}
          </p>
          {step === 'phone' && (
            <p className="text-xs text-orange-500 mt-1 font-medium">[Dev mode: Use OTP 123456]</p>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-medium text-sm whitespace-nowrap">
                    &#127470;&#127475; +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-lg tracking-wider"
                    maxLength={10}
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Sending OTP...' : (
                  <>
                    <Phone className="w-5 h-5" />
                    Send OTP
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
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OTP Code</label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onFocus={() => setTimeout(() => otpInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-2xl tracking-[0.5em] text-center font-bold"
                  maxLength={6}
                />
                <p className="text-xs text-gray-400 mt-2 text-center">OTP expires in 5 minutes</p>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Verifying...' : (
                  <>
                    Verify & Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Change number
              </button>
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
