'use client';

import Link from 'next/link';
import { Shield, MessageCircle, CheckCircle, ArrowRight, Star, Lock, Heart, Eye, Award } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const STATS = [
  { label: 'Verified Members', value: '3,241+' },
  { label: 'Fake Profiles', value: '0' },
  { label: 'Matches Made', value: '847+' },
  { label: 'Success Stories', value: '23' },
];

const FEATURES = [
  {
    icon: Shield,
    title: 'Government Verified',
    desc: 'Every profile verified via Aadhaar through DigiLocker — the same technology used by banks and the Government of India.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: MessageCircle,
    title: 'Messaging Always Free',
    desc: 'No subscription wall to talk. Message anyone, anytime. Premium unlocks extras — but conversation is always free.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: Eye,
    title: 'Public Transparency',
    desc: 'We publish a monthly report: how many fake profiles removed, scams caught, messages scanned. No hiding.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Lock,
    title: 'Chat Lockdown',
    desc: 'Phone numbers, UPI IDs and social handles are blocked in chat for the first 7 days. Your safety by design.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    icon: Award,
    title: 'Public Trust Score',
    desc: "Every profile has a Trust Score (0–100). It's always public and can never be hidden. Real accountability.",
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Heart,
    title: 'Safe Meeting Checklist',
    desc: 'Share your first-date location with a trusted contact. We check in after 8 hours. Your safety matters.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
];

const TESTIMONIALS = [
  {
    name: 'Sneha R.',
    city: 'Bangalore',
    text: 'I tried every app. The Aadhaar verification on DateInIndia is the only thing that made me feel actually safe.',
    rating: 5,
    photo: 'https://images.pexels.com/photos/3064079/pexels-photo-3064079.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
  {
    name: 'Rahul G.',
    city: 'Delhi',
    text: 'Found my match in 3 weeks. What I love most? I could message her for free. No paywall nonsense.',
    rating: 5,
    photo: 'https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
  {
    name: 'Meera P.',
    city: 'Mumbai',
    text: "The transparency report is what sold me. A dating site that shows you exactly what they're doing. Unheard of.",
    rating: 5,
    photo: 'https://images.pexels.com/photos/3756981/pexels-photo-3756981.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
];

const HERO_PROFILES = [
  { url: 'https://images.pexels.com/photos/3756981/pexels-photo-3756981.jpeg', name: 'Priya', city: 'Mumbai', score: 85, verified: true, online: true },
  { url: 'https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg', name: 'Rahul', city: 'Delhi', score: 72, verified: true, online: false },
  { url: 'https://images.pexels.com/photos/3064079/pexels-photo-3064079.jpeg', name: 'Anjali', city: 'Bangalore', score: 90, verified: true, online: true },
  { url: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg', name: 'Vikram', city: 'Hyderabad', score: 68, verified: false, online: true },
  { url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg', name: 'Sneha', city: 'Chennai', score: 95, verified: true, online: true },
  { url: 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg', name: 'Arjun', city: 'Pune', score: 78, verified: true, online: false },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/browse');
    }
  }, [user, loading, router]);

  useEffect(() => { document.title = 'DateInIndia — Real Dating, Real India'; }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900">DateInIndia</span>
            <span className="text-lg">&#127470;&#127475;</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/trust" className="text-sm text-gray-600 hover:text-orange-500 transition-colors hidden sm:block">
              Transparency
            </Link>
            <Link href="/safety" className="text-sm text-gray-600 hover:text-orange-500 transition-colors hidden sm:block">
              Safety
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors">
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
            >
              Join Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-green-50 pt-16 pb-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">3,241 verified members online now</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-display font-bold text-gray-900 leading-tight mb-6">
                Real people.<br />
                <span className="text-orange-500">Free messaging.</span><br />
                <span className="text-green-600">Govt. verified.</span>
              </h1>

              <p className="text-xl text-gray-600 mb-4 leading-relaxed">
                Tinder is full of fake profiles. Shaadi.com is for your parents.
              </p>
              <p className="text-xl font-semibold text-gray-900 mb-8">
                DateInIndia is real people, free messaging, Aadhaar verified.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold text-lg rounded-2xl hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5"
                >
                  Create Free Profile
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/trust"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 font-semibold text-lg rounded-2xl border-2 border-gray-200 hover:border-orange-300 hover:text-orange-600 transition-all"
                >
                  <Eye className="w-5 h-5" />
                  Transparency Report
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Free to message forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Aadhaar verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">No swipe games</span>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                {HERO_PROFILES.map((p, i) => (
                  <div key={i} className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-lg group cursor-pointer">
                    <img
                      src={`${p.url}?auto=compress&cs=tinysrgb&w=300`}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {p.online && (
                      <div className="absolute top-2 left-2">
                        <span className="w-2.5 h-2.5 bg-green-400 rounded-full block animate-pulse" />
                      </div>
                    )}
                    {p.verified && (
                      <div className="absolute top-2 right-2">
                        <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-medium">ID</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-semibold">{p.name}</p>
                      <p className="text-white/70 text-xs">{p.city} · {p.score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="bg-orange-500 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-display font-bold text-white">{stat.value}</div>
                <div className="text-orange-100 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem we solve */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-display font-bold text-gray-900 mb-6">
            Every other app has the same problem.
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              { app: 'Tinder', problem: 'Fake profiles everywhere. Catfishes. No accountability.' },
              { app: 'Bumble', problem: 'Paid wall to see matches. Expensive subscriptions.' },
              { app: 'Shaadi.com', problem: 'Your parents choose. Horoscopes. Not for you.' },
            ].map((item) => (
              <div key={item.app} className="p-6 bg-red-50 border border-red-100 rounded-2xl text-left">
                <div className="font-bold text-red-700 mb-2">{item.app}</div>
                <div className="text-gray-600 text-sm">{item.problem}</div>
              </div>
            ))}
          </div>
          <div className="inline-flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-2xl px-8 py-4">
            <p className="text-lg font-semibold text-gray-900">
              DateInIndia is <span className="text-green-600">built differently</span>. By design.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Safety is the product.
            </h2>
            <p className="text-xl text-gray-500">Every design decision was made with your safety in mind.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-5`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-xl text-gray-500">From signup to first date in 4 simple steps.</p>
          </div>
          <div className="grid sm:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Sign up with phone', desc: 'OTP verification in 30 seconds.' },
              { step: '2', title: 'Build your profile', desc: 'Add photos, your story, your vibe.' },
              { step: '3', title: 'Get Aadhaar verified', desc: 'Free via DigiLocker. Takes 2 minutes.' },
              { step: '4', title: 'Browse and message free', desc: 'No subscription. No paywall. Just connect.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-green-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">Real stories</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img src={t.photo} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-gray-500 text-xs">{t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-display font-bold text-white mb-6">
            Asli log. Asli pyaar.
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Real people. Real India. Built to be trusted.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 px-10 py-5 bg-orange-500 text-white font-bold text-xl rounded-2xl hover:bg-orange-400 transition-all hover:shadow-2xl hover:shadow-orange-900/30 hover:-translate-y-1"
          >
            Join DateInIndia — Free
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="mt-6 text-gray-500 text-sm">No credit card required. Messaging always free.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-orange-500 fill-orange-500" />
                <span className="font-display font-bold text-white">DateInIndia</span>
              </div>
              <p className="text-gray-500 text-sm">India&apos;s most trusted dating website. Built on transparency, safety, and real connections.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Platform</h4>
              <div className="space-y-2">
                {['Browse Members', 'How It Works', 'Pricing', 'Success Stories'].map(l => (
                  <div key={l} className="text-gray-500 text-sm hover:text-gray-300 cursor-pointer">{l}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Trust</h4>
              <div className="space-y-2">
                {['Transparency Report', 'Safety Tips', 'Verification', 'Community Guidelines'].map(l => (
                  <div key={l} className="text-gray-500 text-sm hover:text-gray-300 cursor-pointer">{l}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Legal</h4>
              <div className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'DPDP Compliance', 'Cookie Policy'].map(l => (
                  <div key={l} className="text-gray-500 text-sm hover:text-gray-300 cursor-pointer">{l}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-wrap justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">&copy; 2026 DateInIndia. All rights reserved. Made with love in India.</p>
            <p className="text-gray-600 text-sm">Compliant with India&apos;s DPDP Act 2023</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
