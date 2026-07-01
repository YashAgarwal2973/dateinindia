'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { getAuthClient, supabase } from './supabase';
import type { Database } from './database.types';

type User = Database['public']['Tables']['users']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'];

export interface AuthUser extends User {
  photos: Photo[];
}

interface Session {
  access_token: string;
  refresh_token: string;
  user_id: string;
  expires_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  /** Authenticated Supabase client — use this (not the bare `supabase` export)
   *  for all queries inside protected pages so RLS policies are enforced. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
  signIn: (accessToken: string, refreshToken: string) => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  db: supabase,
  signIn: () => {},
  signOut: () => {},
  refreshUser: async () => {},
});

const SESSION_KEY = 'dateinindia_session';
// Renew the access token this far ahead of its expiry so an active user's
// session effectively never ends — real session length is bounded by the
// refresh token's validity, not the short-lived access token's.
const REFRESH_MARGIN_MS = 10 * 60 * 1000;
const REFRESH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

/** Decode JWT payload without verifying signature.
 *  Signature verification happens server-side on every Supabase request. */
function decodeJWTPayload(token: string): { sub: string; exp: number } | null {
  try {
    const [, payload] = token.split('.');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJWTPayload(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now();
}

function expiresSoon(token: string): boolean {
  const payload = decodeJWTPayload(token);
  if (!payload) return true;
  return payload.exp * 1000 - Date.now() < REFRESH_MARGIN_MS;
}

function readSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeSession(accessToken: string, refreshToken: string): Session | null {
  const payload = decodeJWTPayload(accessToken);
  if (!payload) return null;
  const session: Session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    user_id: payload.sub,
    expires_at: new Date(payload.exp * 1000).toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState<any>(supabase); // eslint-disable-line @typescript-eslint/no-explicit-any

  const loadUser = useCallback(async (token: string) => {
    const authClient = getAuthClient(token);
    setDb(authClient);

    const payload = decodeJWTPayload(token);
    if (!payload) return;

    const { data: userData, error } = await authClient
      .from('users')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (error || !userData) {
      setUser(null);
      return;
    }

    const { data: photos } = await authClient
      .from('photos')
      .select('*')
      .eq('user_id', payload.sub)
      .order('display_order');

    setUser({ ...userData, photos: photos || [] });

    // Fire-and-forget — update last_active
    authClient
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', payload.sub);
  }, []);

  /** Exchange the stored refresh token for a fresh access token, keeping the
   *  user signed in well beyond the access token's short expiry. Returns
   *  false if the refresh token itself is invalid/expired, in which case the
   *  caller should fall back to signing the user out. */
  const renewSession = useCallback(async (session: Session): Promise<boolean> => {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: session.refresh_token });
    if (error || !data.session) return false;
    writeSession(data.session.access_token, data.session.refresh_token);
    await loadUser(data.session.access_token);
    return true;
  }, [loadUser]);

  const refreshUser = useCallback(async () => {
    const session = readSession();
    if (!session) return;
    if (isTokenExpired(session.access_token) || expiresSoon(session.access_token)) {
      const renewed = await renewSession(session);
      if (renewed) return;
      if (isTokenExpired(session.access_token)) return;
    }
    await loadUser(session.access_token);
  }, [loadUser, renewSession]);

  useEffect(() => {
    const session = readSession();
    if (!session) { setLoading(false); return; }

    (async () => {
      if (isTokenExpired(session.access_token)) {
        const renewed = await renewSession(session);
        if (!renewed) {
          // Flag so AuthGuard can show "session expired" message instead of generic redirect
          try { sessionStorage.setItem('session_expired', '1'); } catch {}
          localStorage.removeItem(SESSION_KEY);
        }
      } else {
        await loadUser(session.access_token);
      }
      setLoading(false);
    })();
  }, [loadUser, renewSession]);

  // Proactively renew the access token in the background so an active
  // session survives indefinitely (bounded only by the refresh token).
  useEffect(() => {
    const interval = setInterval(() => {
      const session = readSession();
      if (!session) return;
      if (isTokenExpired(session.access_token) || expiresSoon(session.access_token)) {
        renewSession(session);
      }
    }, REFRESH_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [renewSession]);

  const signIn = useCallback((accessToken: string, refreshToken: string) => {
    if (!writeSession(accessToken, refreshToken)) return;
    loadUser(accessToken).finally(() => setLoading(false));
  }, [loadUser]);

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setDb(supabase);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, db, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
