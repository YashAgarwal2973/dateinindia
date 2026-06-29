'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, UserX } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import type { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'];

interface BlockedUser {
  block_id: string;
  blocked_at: string;
  user: User & { photos: Photo[] };
}

export default function BlockedUsersPage() {
  const { user, db } = useAuth();
  const router = useRouter();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function fetchBlocked() {
      const { data } = await db
        .from('blocks')
        .select('id, created_at, blocked_id')
        .eq('blocker_id', user!.id)
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      const withUsers = await Promise.all(
        (data as Array<{ id: string; created_at: string; blocked_id: string }>).map(async (b) => {
          const { data: u } = await db.from('users').select('*, photos(*)').eq('id', b.blocked_id).single();
          return {
            block_id: b.id,
            blocked_at: b.created_at,
            user: u as unknown as User & { photos: Photo[] },
          };
        })
      );

      setBlocked(withUsers.filter(b => b.user != null));
      setLoading(false);
    }
    fetchBlocked();
  }, [user, db]);

  useEffect(() => { document.title = 'Blocked Users | DateInIndia'; }, []);

  async function handleUnblock(blockId: string, blockedUserId: string) {
    if (!user) return;
    setUnblocking(blockId);
    await db.from('blocks').delete().eq('id', blockId);
    setBlocked(prev => prev.filter(b => b.block_id !== blockId));
    setUnblocking(null);
  }

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-display font-bold text-gray-900">Blocked Users</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : blocked.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No blocked users</h3>
            <p className="text-gray-400 text-sm">
              Users you block won&apos;t appear in your browse results and can&apos;t message you.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Blocked users cannot see your profile or send you messages.
            </p>
            <div className="space-y-3">
              {blocked.map((b) => {
                const photo = b.user?.photos?.find(p => p.is_primary) || b.user?.photos?.[0];
                return (
                  <div key={b.block_id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                    {photo ? (
                      <img
                        src={`${photo.storage_url}?auto=compress&cs=tinysrgb&w=80`}
                        alt=""
                        className="w-14 h-14 rounded-full object-cover flex-shrink-0 grayscale opacity-60"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <UserX className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-700 text-sm">{b.user?.name}</p>
                      <p className="text-xs text-gray-400">{b.user?.city}</p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        Blocked {new Date(b.blocked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnblock(b.block_id, b.user.id)}
                      disabled={unblocking === b.block_id}
                      className="flex-shrink-0 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
                    >
                      {unblocking === b.block_id ? 'Unblocking...' : 'Unblock'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  );
}
