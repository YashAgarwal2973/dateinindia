'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Lock, MapPin, Sparkles, MessageCircle, X } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { getAge } from '@/lib/api';
import type { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'];

interface Like {
  id: string;
  liker_id: string;
  created_at: string;
  is_super_like: boolean;
  liker: User & { photos: Photo[] };
}

interface Match {
  id: string;
  user_1_id: string;
  user_2_id: string;
  compatibility_score: number | null;
  created_at: string;
  otherUser: User & { photos: Photo[] };
}

export default function LikesPage() {
  const { user, db } = useAuth();
  const router = useRouter();
  const [likes, setLikes] = useState<Like[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tab, setTab] = useState<'likes' | 'matches'>('likes');
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      // Fetch block lists for filtering
      const [outgoing, incoming] = await Promise.all([
        db.from('blocks').select('blocked_id').eq('blocker_id', user!.id),
        db.from('blocks').select('blocker_id').eq('blocked_id', user!.id),
      ]);
      const blockedSet = new Set([
        ...((outgoing.data || []) as Array<{ blocked_id: string }>).map(b => b.blocked_id),
        ...((incoming.data || []) as Array<{ blocker_id: string }>).map(b => b.blocker_id),
      ]);

      // Fetch likes received
      const { data: rawLikes } = await db
        .from('likes')
        .select('*')
        .eq('liked_id', user!.id)
        .order('created_at', { ascending: false });

      const likesData = rawLikes as Array<{ id: string; liker_id: string; liked_id: string; is_super_like: boolean; created_at: string }> | null;

      if (likesData) {
        const filtered = likesData.filter(l => !blockedSet.has(l.liker_id));
        const withUsers = await Promise.all(
          filtered.map(async (l) => {
            const { data: liker } = await db.from('users').select('*, photos(*)').eq('id', l.liker_id).single();
            return { ...l, liker: liker as unknown as User & { photos: Photo[] } };
          })
        );
        setLikes(withUsers as Like[]);
      }

      // Fetch matches
      const { data: rawMatches } = await db
        .from('matches')
        .select('*')
        .or(`user_1_id.eq.${user!.id},user_2_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });

      const matchesData = rawMatches as Array<{ id: string; user_1_id: string; user_2_id: string; compatibility_score: number | null; compatibility_explanation: string | null; icebreakers: string[]; is_active: boolean; created_at: string }> | null;

      if (matchesData) {
        const filtered = matchesData.filter(m => {
          const otherId = m.user_1_id === user!.id ? m.user_2_id : m.user_1_id;
          return !blockedSet.has(otherId);
        });
        const withUsers = await Promise.all(
          filtered.map(async (m) => {
            const otherId = m.user_1_id === user!.id ? m.user_2_id : m.user_1_id;
            const { data: other } = await db.from('users').select('*, photos(*)').eq('id', otherId).single();
            return { ...m, otherUser: other as unknown as User & { photos: Photo[] } };
          })
        );
        setMatches(withUsers as Match[]);
      }

      setLoading(false);
    }
    fetchData();
  }, [user, db]);

  useEffect(() => { document.title = 'Likes & Activity | DateInIndia'; }, []);

  async function handleLikeBack(likerId: string) {
    if (!user) return;
    setActioning(likerId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('likes') as any).upsert({ liker_id: user.id, liked_id: likerId });
    const [u1, u2] = [user.id, likerId].sort();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: m } = await (db.from('matches') as any).upsert({
      user_1_id: u1, user_2_id: u2,
      compatibility_score: Math.floor(Math.random() * 30) + 70,
      icebreakers: ["What's your favorite place in your city?", "Tell me about your perfect weekend!", "What are you passionate about right now?"],
    }).select('id').single();
    setActioning(null);
    if (m) router.push(`/messages?match=${m.id}`);
  }

  async function handlePass(likeId: string, likerId: string) {
    if (!user) return;
    setActioning(likeId);
    await db.from('likes').delete().eq('id', likeId);
    setLikes(prev => prev.filter(l => l.id !== likeId));
    setActioning(null);
  }

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">Your Activity</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab('likes')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'likes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Likes Received
            {likes.length > 0 && (
              <span className="ml-1.5 w-5 h-5 inline-flex items-center justify-center bg-orange-500 text-white text-xs rounded-full">{likes.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab('matches')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'matches' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Matches
            {matches.length > 0 && (
              <span className="ml-1.5 w-5 h-5 inline-flex items-center justify-center bg-green-500 text-white text-xs rounded-full">{matches.length}</span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-[3/4] bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'likes' ? (
          <>
            {likes.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No likes yet</h3>
                <p className="text-gray-400 text-sm mb-6">Complete your profile to get more likes</p>
                <button onClick={() => router.push('/browse')} className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors">
                  Browse Members
                </button>
              </div>
            ) : (
              <>
                {!user?.is_premium && (
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 mb-6 text-white">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg mb-1">See who liked you</h3>
                        <p className="text-orange-100 text-sm mb-3">
                          {likes.length} {likes.length === 1 ? 'person has' : 'people have'} liked your profile. Upgrade to see them clearly and like back instantly.
                        </p>
                        <button onClick={() => router.push('/premium')} className="px-5 py-2 bg-white text-orange-600 font-bold text-sm rounded-xl hover:bg-orange-50 transition-colors">
                          Unlock for ₹49/week
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {likes.map((like) => {
                    const photo = like.liker?.photos?.find(p => p.is_primary) || like.liker?.photos?.[0];
                    const blurred = !user?.is_premium;
                    const isActioning = actioning === like.liker_id || actioning === like.id;
                    return (
                      <div key={like.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative aspect-[3/4]">
                          {photo ? (
                            <img
                              src={`${photo.storage_url}?auto=compress&cs=tinysrgb&w=400`}
                              alt=""
                              className={`w-full h-full object-cover transition-all ${blurred ? 'blur-md scale-105' : ''}`}
                            />
                          ) : (
                            <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                              <span className="text-4xl text-orange-200">?</span>
                            </div>
                          )}
                          {blurred && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white/90 rounded-2xl p-3 text-center shadow-sm">
                                <Lock className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                                <p className="text-xs font-semibold text-gray-700">Premium</p>
                              </div>
                            </div>
                          )}
                          {like.is_super_like && (
                            <div className="absolute top-2 right-2">
                              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">Super Like</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          {!blurred ? (
                            <>
                              <p className="font-semibold text-gray-900 text-sm">{like.liker?.name}, {getAge(like.liker?.date_of_birth || '')}</p>
                              <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                                <MapPin className="w-3 h-3" />
                                {like.liker?.city}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleLikeBack(like.liker_id)}
                                  disabled={isActioning}
                                  className="flex-1 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                                >
                                  {isActioning ? (
                                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Heart className="w-3 h-3 fill-current" />
                                  )}
                                  Like Back
                                </button>
                                <button
                                  onClick={() => handlePass(like.id, like.liker_id)}
                                  disabled={isActioning}
                                  className="w-8 h-7 flex items-center justify-center bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-60"
                                  title="Pass"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button
                                onClick={() => router.push(`/profile/${like.liker_id}`)}
                                className="w-full mt-1.5 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                View Profile
                              </button>
                            </>
                          ) : (
                            <div className="text-center py-1">
                              <p className="text-xs text-gray-400">Unlock to see</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {matches.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No matches yet</h3>
                <p className="text-gray-400 text-sm mb-6">Like someone and when they like you back, it&apos;s a match!</p>
                <button onClick={() => router.push('/browse')} className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors">
                  Browse Members
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {matches.map(match => {
                  const photo = match.otherUser?.photos?.find(p => p.is_primary) || match.otherUser?.photos?.[0];
                  return (
                    <div key={match.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                      <div
                        className="relative aspect-[3/4] cursor-pointer"
                        onClick={() => router.push(`/messages?match=${match.id}`)}
                      >
                        {photo ? (
                          <img src={`${photo.storage_url}?auto=compress&cs=tinysrgb&w=400`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                            <Heart className="w-8 h-8 text-orange-200 fill-orange-200" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white font-semibold text-sm">{match.otherUser?.name}</p>
                          {match.compatibility_score && (
                            <p className="text-green-300 text-xs">{match.compatibility_score}% match</p>
                          )}
                        </div>
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          Match!
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <MapPin className="w-3 h-3" />
                          {match.otherUser?.city}
                        </div>
                        <button
                          onClick={() => router.push(`/messages?match=${match.id}`)}
                          className="w-full py-1.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Send Message
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AuthGuard>
  );
}
