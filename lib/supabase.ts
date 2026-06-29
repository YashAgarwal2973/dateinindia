import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Unauthenticated client — safe only for public data (landing page,
// transparency reports, public photos). Intentionally loosely typed
// (as any) so existing pages continue to compile; auth'd pages should
// use getAuthClient(jwt) from useAuth().db instead.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
}) as ReturnType<typeof createClient> & any;

// Returns an authenticated Supabase client that sends the user's JWT
// on every request. PostgREST verifies the JWT against SUPABASE_JWT_SECRET,
// so auth.uid() in RLS policies resolves to the token's `sub` claim.
// Intentionally loosely typed to match the rest of the codebase's pattern;
// RLS enforces data isolation server-side.
export function getAuthClient(jwt: string) {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${jwt}` },
    },
  });
  // Required for Realtime RLS: WebSocket connections don't pick up
  // global.headers, so set the access token explicitly.
  client.realtime.setAuth(jwt);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client as ReturnType<typeof createClient> & any;
}

// The base URL for edge function calls (send-otp, verify-otp, etc.)
export const functionsUrl = `${supabaseUrl}/functions/v1`;
