'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, Search, MessageCircle, Users, ChevronDown, LogOut, Settings, User, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, useRef } from 'react';

const TRUST_BANNERS = [
  '✅ 3,241 verified members online · 0 fake profiles this month',
  '🏛️ Every Aadhaar-verified profile reviewed by humans · No bots',
  '💬 Messaging is always free · No subscription needed',
  '🔒 Chat locked for first 7 days · Your safety by design',
  '📊 Monthly transparency report published · Nothing to hide',
  '🛡️ All photos checked by AI before approval · Zero tolerance for fakes',
];

export default function AppNavbar() {
  const { user, signOut, db } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [bannerIdx, setBannerIdx] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIdx(i => (i + 1) % TRUST_BANNERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!user) return;
    async function fetchUnread() {
      const { count } = await db
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user!.id);
      setUnreadMessages(count || 0);
    }
    fetchUnread();
  }, [user]);

  function handleSignOut() {
    signOut();
    router.push('/');
  }

  const primaryPhoto = user?.photos?.[0]?.storage_url;

  const navLinks = [
    { href: '/browse', label: 'Browse', icon: Search },
    { href: '/messages', label: 'Messages', icon: MessageCircle, badge: unreadMessages },
    { href: '/likes', label: 'Likes', icon: Heart },
    { href: '/trust', label: 'Trust Report', icon: Shield },
  ];

  return (
    <>
      {/* Trust Banner */}
      <div className="bg-orange-500 h-10 flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <p
            key={bannerIdx}
            className="text-white text-sm font-medium text-center transition-all animate-in fade-in slide-in-from-bottom-1 duration-500"
          >
            {TRUST_BANNERS[bannerIdx]}
          </p>
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/browse" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900 hidden sm:block">DateInIndia</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon, badge }) => (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  pathname.startsWith(href)
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{label}</span>
                {badge != null && badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* User menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {primaryPhoto ? (
                <img src={`${primaryPhoto}?auto=compress&cs=tinysrgb&w=80`} alt={user?.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-500" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[80px] truncate">
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.city}, {user?.state}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${user?.trust_score && user.trust_score >= 71 ? 'bg-green-500' : user?.trust_score && user.trust_score >= 41 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${user?.trust_score || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{user?.trust_score}/100</span>
                  </div>
                </div>

                <div className="py-1">
                  <Link href="/me" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  <Link href="/verify" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Shield className="w-4 h-4" />
                    Verification
                  </Link>
                  <Link href="/premium" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Users className="w-4 h-4" />
                    Premium
                  </Link>
                  <Link href="/settings" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
