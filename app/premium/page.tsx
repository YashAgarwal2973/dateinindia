'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Star, Zap, Crown } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@/lib/auth-context';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface Plan {
  id: 'basic' | 'standard' | 'trust';
  name: string;
  icon: React.ElementType;
  weekly: number;
  monthly: number;
  color: string;
  bg: string;
  badge: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    icon: Star,
    weekly: 49,
    monthly: 149,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badge: 'border-blue-200',
    features: [
      'See who liked you (full, unblurred)',
      '50 likes per day',
      'Ad-free experience',
      'Basic profile stats',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    icon: Zap,
    weekly: 99,
    monthly: 299,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    badge: 'border-orange-400',
    popular: true,
    features: [
      'Everything in Basic',
      'Unlimited likes per day',
      'Advanced search filters',
      '1 profile boost per week (coming soon)',
      'Voice notes in chat',
      'See profile visitors',
    ],
  },
  {
    id: 'trust',
    name: 'Trust Premium',
    icon: Crown,
    weekly: 149,
    monthly: 399,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    badge: 'border-amber-400',
    features: [
      'Everything in Standard',
      'Human-reviewed profile badge',
      'AI Wingman — conversation tips (coming soon)',
      '3 Super Likes per day',
      'Dedicated support',
    ],
  },
];

const MICROS: { label: string; price: number; desc: string; comingSoon?: boolean }[] = [
  { label: 'Profile Boost (24 hours)', price: 29, desc: 'Jump to top of city search', comingSoon: true },
  { label: 'Super Like Bundle (5 pack)', price: 49, desc: 'Stand out from the crowd' },
  { label: 'See who liked you (7 days)', price: 39, desc: 'Without a full subscription' },
  { label: 'Selfie Verification', price: 49, desc: 'Get the blue Photo Verified badge' },
];

export default function PremiumPage() {
  const { user, refreshUser, db } = useAuth();
  const router = useRouter();
  const [billing, setBilling] = useState<'weekly' | 'monthly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const openRazorpay = useCallback(async (
    label: string,
    amountRupees: number,
    tier: string,
    billingPeriod: 'weekly' | 'monthly' | 'one_time'
  ) => {
    if (!user) return;

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) {
      alert('Payments not configured yet. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.');
      return;
    }

    setLoading(label);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Razorpay SDK failed to load');

      // Create order on server
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountRupees * 100,
          currency: 'INR',
          user_id: user.id,
          tier,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }

      const { order } = await orderRes.json();

      // Open Razorpay modal
      const rzp = new window.Razorpay({
        key: keyId,
        amount: amountRupees * 100,
        currency: 'INR',
        order_id: order.id,
        name: 'DateInIndia',
        description: label,
        handler: async (response: Record<string, string>) => {
          // Verify via edge function (HMAC check + DB write)
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: order.id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              user_id: user.id,
              tier,
              billing_period: billingPeriod,
              amount_paise: amountRupees * 100,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            await refreshUser();
            router.push('/browse');
          } else {
            alert('Payment verification failed. Contact support with payment ID: ' + response.razorpay_payment_id);
          }
        },
        prefill: { contact: user.phone || user.email || '' },
        theme: { color: '#f97316' },
        modal: { ondismiss: () => setLoading(null) },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Payment error. Please try again.');
      setLoading(null);
    }
  }, [user, refreshUser, router]);

  async function handleSubscribe(tier: string) {
    const plan = PLANS.find(p => p.id === tier)!;
    const amount = billing === 'weekly' ? plan.weekly : plan.monthly;
    await openRazorpay(`${plan.name} ${billing}`, amount, tier, billing);
  }

  async function handleMicroPurchase(label: string, price: number) {
    if (!user) return;
    if (label === 'Selfie Verification') { router.push('/verify'); return; }
    await openRazorpay(label, price, `micro_${label.toLowerCase().replace(/\s+/g, '_')}`, 'one_time');
  }

  return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-3">
            Messaging is always free.
          </h1>
          <p className="text-xl text-gray-500 mb-6">
            Premium unlocks visibility, features, and trust badges — but you can message anyone for free, forever.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setBilling('weekly')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === 'weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Monthly <span className="text-green-600 text-xs ml-1">Save ~35%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl border-2 ${plan.popular ? 'border-orange-400 shadow-xl shadow-orange-100' : `border-gray-200`} p-8 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">Most Popular</span>
                </div>
              )}

              <div className={`w-12 h-12 ${plan.bg} rounded-2xl flex items-center justify-center mb-4`}>
                <plan.icon className={`w-6 h-6 ${plan.color}`} />
              </div>

              <h3 className="font-display font-bold text-xl text-gray-900 mb-1">{plan.name}</h3>
              <div className="mb-5">
                <span className="text-4xl font-display font-bold text-gray-900">
                  ₹{billing === 'weekly' ? plan.weekly : plan.monthly}
                </span>
                <span className="text-gray-400 text-sm">/{billing === 'weekly' ? 'week' : 'month'}</span>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id || (user?.is_premium && user.premium_tier === plan.id)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${
                  plan.popular
                    ? 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {user?.is_premium && user.premium_tier === plan.id
                  ? 'Current Plan'
                  : loading === plan.id
                  ? 'Processing...'
                  : `Get ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* Free tier reminder */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-10 text-center">
          <h3 className="font-semibold text-green-800 mb-2">Free forever — seriously</h3>
          <p className="text-green-700 text-sm">
            You can browse all members, send unlimited messages, like 10 profiles per day, and report fake profiles — all for free. No credit card. No trial that auto-charges.
          </p>
        </div>

        {/* Microtransactions */}
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">One-time purchases</h2>
          <p className="text-gray-500 mb-6 text-sm">Buy only what you need, when you need it.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MICROS.map((m) => (
              <div key={m.label} className={`bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-shadow ${m.comingSoon ? 'opacity-60' : ''}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                    {m.comingSoon && (
                      <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">Coming Soon</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
                </div>
                <button
                  onClick={() => !m.comingSoon && handleMicroPurchase(m.label, m.price)}
                  disabled={!!m.comingSoon}
                  className={`ml-4 flex-shrink-0 px-4 py-2 font-bold text-sm rounded-xl transition-colors whitespace-nowrap ${
                    m.comingSoon
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                  }`}
                >
                  {m.comingSoon ? 'Soon' : `₹${m.price}`}
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          All prices include 18% GST. GST invoice provided for all purchases. Cancel anytime.
        </p>
      </div>
    </AuthGuard>
  );
}
