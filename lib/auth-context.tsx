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
  signIn: (accessToken: string) => void;
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

  const refreshUser = useCallback(async () => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    let session: Session;
    try { session = JSON.parse(raw); } catch { return; }
    if (isTokenExpired(session.access_token)) return;
    await loadUser(session.access_token);
  }, [loadUser]);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) { setLoading(false); return; }

    let session: Session;
    try {
      session = JSON.parse(raw);
    } catch {
      localStorage.removeItem(SESSION_KEY);
      setLoading(false);
      return;
    }

    if (isTokenExpired(session.access_token)) {
      // Flag so AuthGuard can show "session expired" message instead of generic redirect
      try { sessionStorage.setItem('session_expired', '1'); } catch {}
      localStorage.removeItem(SESSION_KEY);
      setLoading(false);
      return;
    }

    loadUser(session.access_token).finally(() => setLoading(false));
  }, [loadUser]);

  const signIn = useCallback((accessToken: string) => {
    const payload = decodeJWTPayload(accessToken);
    if (!payload) return;
    const session: Session = {
      access_token: accessToken,
      user_id: payload.sub,
      expires_at: new Date(payload.exp * 1000).toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
