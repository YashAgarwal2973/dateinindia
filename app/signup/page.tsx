'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Phone, ArrowRight, ChevronLeft, User } from 'lucide-react';
import { sendOTP, verifyOTPAndAuth } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Step = 'details' | 'phone' | 'otp';

export default function SignupPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpId, setOtpId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        otpInputRef.current?.focus();
      }, 300);
    }
  }, [step]);

  useEffect(() => { document.title = 'Create Account | DateInIndia'; }, []);

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
      const { accessToken } = await verifyOTPAndAuth(otpId, code, phone, name);
      signIn(accessToken);
      router.push('/onboarding');
    } catch {
      setError('Verification failed. Please try again.');
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

          <div className="flex items-center justify-center gap-2 mb-4">
            {(['details', 'phone', 'otp'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s ? 'bg-orange-500 text-white' :
                  ['details', 'phone', 'otp'].indexOf(step) > i ? 'bg-green-500 text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {['details', 'phone', 'otp'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 2 && <div className={`w-8 h-0.5 ${['details', 'phone', 'otp'].indexOf(step) > i ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-display font-bold text-gray-900">
            {step === 'details' ? 'Create your account' :
             step === 'phone' ? 'Verify your number' :
             'Enter your OTP'}
          </h1>
          {step === 'otp' && (
            <p className="text-xs text-orange-500 mt-1 font-medium">[Dev mode: Use OTP 123456]</p>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          {step === 'details' && (
            <form onSubmit={(e) => { e.preventDefault(); if (name.trim().length < 2) { setError('Enter your full name'); return; } setError(''); setStep('phone'); }} className="space-y-5">
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

          {step === 'phone' && (
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
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">We&apos;ll send a one-time password to verify</p>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Sending...' : (
                  <>
                    <Phone className="w-5 h-5" />
                    Send OTP
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('details'); setError(''); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </form>
          )}

          {step === 'otp' && (
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
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Sent to +91 {phone} · Expires in 5 minutes
                </p>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Verifying...' : (
                  <>
                    Verify & Create Account
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
          By signing up you agree to our{' '}
          <Link href="/terms" className="underline hover:text-gray-600">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.<br />
          Compliant with India&apos;s DPDP Act 2023. You must be 18 or older.
        </p>
      </div>
    </div>
  );
}
