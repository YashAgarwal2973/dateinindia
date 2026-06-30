import { functionsUrl, supabase } from './supabase';

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function edgeFetch(path: string, body: Record<string, unknown>) {
  return fetch(`${functionsUrl}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  });
}

/** Send a magic link to the given email. Pass name on signup. */
export async function sendMagicLink(email: string, name?: string): Promise<void> {
  const res = await edgeFetch('send-magic-link', { email, ...(name ? { name } : {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send magic link');
}

/** Sign in with email + password via Supabase auth. */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ accessToken: string; userId: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('No session returned');
  return {
    accessToken: data.session.access_token,
    userId: data.user.id,
  };
}

/** Update the authenticated user's password via Supabase Auth REST API. */
export async function setPassword(jwt: string, password: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({ password, data: { has_password: true } }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.message || 'Failed to set password');
}

/** Verify a magic link token and return a signed JWT + user info. */
export async function verifyMagicLink(
  token: string,
  name?: string
): Promise<{ accessToken: string; userId: string; isNewUser: boolean; hasPassword: boolean }> {
  const res = await edgeFetch('verify-magic-link', { token, ...(name ? { name } : {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Verification failed');
  return {
    accessToken: data.access_token as string,
    userId: data.user_id as string,
    isNewUser: data.is_new_user as boolean,
    hasPassword: data.has_password === true,
  };
}

/** Calculate trust score from factors */
export function calculateTrustScore(factors: {
  phoneVerified: boolean;
  aadhaarVerified: boolean;
  selfieVerified: boolean;
  profileCompletePct: number;
  accountAgeDays: number;
  reportCount: number;
  strikeCount: number;
}): number {
  let score = 0;
  if (factors.phoneVerified) score += 10;
  if (factors.aadhaarVerified) score += 30;
  if (factors.selfieVerified) score += 20;
  if (factors.profileCompletePct >= 80) score += 10;
  if (factors.accountAgeDays >= 90) score += 10;
  if (factors.reportCount === 0) score += 5;
  if (factors.reportCount === 1) score -= 20;
  if (factors.reportCount === 2) score -= 40;
  score -= factors.strikeCount * 15;
  return Math.max(0, Math.min(100, score));
}

/** Get age from date of birth */
export function getAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/** Check if user is online (active in last 30 minutes) */
export function isOnline(lastActiveAt: string): boolean {
  return Date.now() - new Date(lastActiveAt).getTime() < 30 * 60 * 1000;
}

/** Format last active timestamp */
export function formatLastActive(lastActiveAt: string): string {
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Online now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Get trust score color */
export function getTrustScoreColor(score: number): string {
  if (score >= 71) return 'bg-green-500';
  if (score >= 41) return 'bg-yellow-500';
  return 'bg-red-500';
}

/** Get trust score text color */
export function getTrustScoreTextColor(score: number): string {
  if (score >= 71) return 'text-green-600';
  if (score >= 41) return 'text-yellow-600';
  return 'text-red-600';
}

const BLOCK_PATTERNS = [
  /\b[6-9]\d{9}\b/g,
  /\b[\w.]+@(paytm|okaxis|okicici|okhdfcbank|ybl|ibl|axisbank|sbi|upi)\b/gi,
  /\b(whatsapp|telegram|instagram|snapchat|signal)\b.*\b(id|number|handle|@)\b/gi,
  /\b(send|transfer|need|urgent).{0,20}(₹|\brupee|\bmoney|\bpaytm|\bphonepay|\bgpay)\b/gi,
];

/** Check if message content is safe */
export function checkMessageSafety(content: string): { safe: boolean; reason?: string } {
  for (const pattern of BLOCK_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      return { safe: false, reason: 'Contact info or fraud pattern detected. This message was blocked for your safety.' };
    }
  }
  return { safe: true };
}
