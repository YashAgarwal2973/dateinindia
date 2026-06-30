'use client';

import { useEffect, useState, useRef, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import AppNavbar from '@/components/shared/AppNavbar';
import AppFooter from '@/components/shared/AppFooter';
import { Camera, X, Clock } from 'lucide-react';

function getSessionExpiresAt(): Date | null {
  try {
    const raw = localStorage.getItem('dateinindia_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session.expires_at ? new Date(session.expires_at) : null;
  } catch {
    return null;
  }
}

function SessionExpiryBanner() {
  const router = useRouter();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const exp = getSessionExpiresAt();
    if (!exp) return;
    const days = Math.floor((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 5) setDaysLeft(days);

    const interval = setInterval(() => {
      const exp2 = getSessionExpiresAt();
      if (!exp2) return;
      const d = Math.floor((exp2.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (d < 5) setDaysLeft(d);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (daysLeft === null || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-amber-800 text-sm">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>
          Your session expires in <strong>{daysLeft === 0 ? 'less than a day' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}</strong>.
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => router.push('/login')}
          className="text-xs font-semibold text-amber-700 underline hover:text-amber-900"
        >
          Sign in again
        </button>
        <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-700">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function NoPhotosBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="bg-orange-50 border-b border-orange-200 px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-orange-800 text-sm">
        <Camera className="w-4 h-4 flex-shrink-0" />
        <span>Add photos so others can see you.</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/me/edit/photos"
          className="text-xs font-semibold text-orange-700 underline hover:text-orange-900"
        >
          Add Photos
        </Link>
        <button onClick={() => setDismissed(true)} className="text-orange-400 hover:text-orange-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, db, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // FIX 3: isChecking prevents any redirect until DB verification completes.
  const [isChecking, setIsChecking] = useState(false);
  // FIX 2: track which user we've already DB-verified to avoid repeated queries.
  const checkedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      checkedForUserRef.current = null;
      try {
        const wasExpired = sessionStorage.getItem('session_expired');
        if (wasExpired) {
          sessionStorage.removeItem('session_expired');
          router.push('/login?reason=expired');
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
      return;
    }

    // Already on the onboarding page or context confirms completion — nothing to do.
    if (pathname === '/onboarding' || user.onboarding_complete) return;

    // Context says onboarding is incomplete. If we've already verified this user
    // from the DB (and confirmed they're genuinely incomplete), redirect immediately.
    if (checkedForUserRef.current === user.id) {
      router.push('/onboarding');
      return;
    }

    // FIX 2: verify directly from DB before redirecting — context may be stale
    // (e.g. refreshUser() committed to DB but React state update raced with navigation).
    checkedForUserRef.current = user.id;
    let active = true;
    setIsChecking(true);

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (db.from('users') as any)
          .select('onboarding_complete')
          .eq('id', user.id)
          .single();

        if (!active) return;

        if (data?.onboarding_complete) {
          // DB says complete but context was stale — re-sync context then allow through.
          await refreshUser();
        } else {
          router.push('/onboarding');
        }
      } catch {
        if (active) router.push('/onboarding');
      } finally {
        if (active) setIsChecking(false);
      }
    })();

    return () => { active = false; };
  }, [user, loading, router, pathname, db, refreshUser]);

  // FIX 3: show spinner while initial load OR DB verification is in flight.
  if (loading || isChecking) return <LoadingScreen />;

  if (!user) return null;
  if (!user.onboarding_complete && pathname !== '/onboarding') return null;

  const hasNoPhotos = user.photos.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppNavbar />
      <SessionExpiryBanner />
      {hasNoPhotos && pathname !== '/onboarding' && pathname !== '/me/edit/photos' && (
        <NoPhotosBanner />
      )}
      <div className="flex-1">
        {children}
      </div>
      <AppFooter />
    </div>
  );
}
