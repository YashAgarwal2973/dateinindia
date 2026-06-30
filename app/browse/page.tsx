'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Search, SlidersHorizontal, MapPin, Star, X } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { getAge, isOnline, getTrustScoreColor } from '@/lib/api';
import type { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'];
type UserWithPhotos = User & { photos: Photo[] };

const CITIES = ['All Cities', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Kochi', 'Chandigarh'];
const RELIGIONS = ['Any', 'Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain'];

interface Filters {
  showMe: 'everyone' | 'women' | 'men';
  city: string;
  minAge: number;
  maxAge: number;
  religion: string;
  verifiedOnly: boolean;
  onlineOnly: boolean;
  sortBy: 'online_first' | 'newest' | 'trust_score';
}

export default function BrowsePage() {
  const { user, db } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<UserWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [blockedByIds, setBlockedByIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    showMe: 'everyone', city: '', minAge: 18, maxAge: 65, religion: '',
    verifiedOnly: false, onlineOnly: false, sortBy: 'online_first',
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const PER_PAGE = 24;

  useEffect(() => {
    if (!user) return;
    Promise.all([
      db.from('blocks').select('blocked_id').eq('blocker_id', user.id),
      db.from('blocks').select('blocker_id').eq('blocked_id', user.id),
    ]).then(([outgoing, incoming]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBlockedIds((outgoing.data || []).map((b: any) => b.blocked_id));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBlockedByIds((incoming.data || []).map((b: any) => b.blocker_id));
    });
  }, [user, db]);

  const fetchMembers = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = db
      .from('users')
      .select('*, photos(*)', { count: 'exact' })
      .neq('id', user.id)
      .eq('onboarding_complete', true)
      .eq('is_suspended', false)
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    const excludedIds = [...blockedIds, ...blockedByIds];
    if (excludedIds.length > 0) {
      query = query.not('id', 'in', `(${excludedIds.join(',')})`);
    }

    if (filters.showMe === 'women') query = query.eq('gender', 'woman');
    else if (filters.showMe === 'men') query = query.eq('gender', 'man');

    if (filters.city) query = query.eq('city', filters.city);
    if (filters.verifiedOnly) query = query.eq('aadhaar_verified', true);
    if (filters.religion) query = query.eq('religion', filters.religion);

    const minDob = new Date();
    minDob.setFullYear(minDob.getFullYear() - filters.maxAge);
    const maxDob = new Date();
    maxDob.setFullYear(maxDob.getFullYear() - filters.minAge);
    query = query.gte('date_of_birth', minDob.toISOString().split('T')[0]);
    query = query.lte('date_of_birth', maxDob.toISOString().split('T')[0]);

    if (filters.onlineOnly) {
      query = query.gte('last_active_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());
    }

    if (filters.sortBy === 'online_first') query = query.order('last_active_at', { ascending: false });
    else if (filters.sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else query = query.order('trust_score', { ascending: false });

    const { data, count } = await query;
    setMembers((data as UserWithPhotos[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [user, db, page, filters, blockedIds, blockedByIds]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    if (!user) return;
    db.from('likes').select('liked_id').eq('liker_id', user.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any[] | null }) => {
        if (data) setLikedIds(new Set(data.map(l => l.liked_id)));
      });
  }, [user, db]);

  useEffect(() => { document.title = 'Browse | DateInIndia'; }, []);

  async function handleLike(memberId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) return;
    if (likedIds.has(memberId)) {
      await db.from('likes').delete().eq('liker_id', user.id).eq('liked_id', memberId);
      setLikedIds(s => { const n = new Set(s); n.delete(memberId); return n; });
    } else {
      await db.from('likes').upsert({ liker_id: user.id, liked_id: memberId });
      setLikedIds(s => new Set([...Array.from(s), memberId]));
      const { data: rev } = await db.from('likes').select('id').eq('liker_id', memberId).eq('liked_id', user.id).single();
      if (rev) {
        const [u1, u2] = [user.id, memberId].sort();
        await db.from('matches').upsert({
          user_1_id: u1, user_2_id: u2,
          compatibility_score: Math.floor(Math.random() * 30) + 70,
          icebreakers: ["What's your favorite place in your city?", "If you could travel anywhere in India right now, where?", "What's the last book or show that really stuck with you?"],
        });
        // Fire-and-forget match notification emails to both users
        try {
          const token = JSON.parse(localStorage.getItem('dateinindia_session') ?? '{}')?.access_token;
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify-match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ type: 'match', user_id: user.id, other_user_id: memberId }),
          });
        } catch { /* notifications are non-critical */ }
      }
    }
  }

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Show me</label>
        <select value={filters.showMe} onChange={e => setFilter('showMe', e.target.value as Filters['showMe'])}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-orange-400">
          <option value="everyone">Everyone</option>
          <option value="women">Women</option>
          <option value="men">Men</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
        <select value={filters.sortBy} onChange={e => setFilter('sortBy', e.target.value as Filters['sortBy'])}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-orange-400">
          <option value="online_first">Online First</option>
          <option value="newest">Newest Members</option>
          <option value="trust_score">Highest Trust Score</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
        <select value={filters.city} onChange={e => setFilter('city', e.target.value === 'All Cities' ? '' : e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-orange-400">
          {CITIES.map(c => <option key={c} value={c === 'All Cities' ? '' : c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Age Range: {filters.minAge}–{filters.maxAge}</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-8">Min:{filters.minAge}</span>
            <input type="range" min={18} max={filters.maxAge - 1} value={filters.minAge}
              onChange={e => setFilter('minAge', parseInt(e.target.value))} className="flex-1 accent-orange-500" />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-8">Max:{filters.maxAge}</span>
            <input type="range" min={filters.minAge + 1} max={65} value={filters.maxAge}
              onChange={e => setFilter('maxAge', parseInt(e.target.value))} className="flex-1 accent-orange-500" />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Religion</label>
        <select value={filters.religion} onChange={e => setFilter('religion', e.target.value === 'Any' ? '' : e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-orange-400">
          {RELIGIONS.map(r => <option key={r} value={r === 'Any' ? '' : r}>{r}</option>)}
        </select>
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={filters.verifiedOnly} onChange={e => setFilter('verifiedOnly', e.target.checked)} className="w-4 h-4 accent-orange-500" />
          <span className="text-sm font-medium text-gray-700">Aadhaar Verified Only</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={filters.onlineOnly} onChange={e => setFilter('onlineOnly', e.target.checked)} className="w-4 h-4 accent-orange-500" />
          <span className="text-sm font-medium text-gray-700">Online Now Only</span>
        </label>
      </div>
      <button onClick={() => { setFilters({ showMe: 'everyone', city: '', minAge: 18, maxAge: 65, religion: '', verifiedOnly: false, onlineOnly: false, sortBy: 'online_first' }); setPage(1); }}
        className="w-full py-2 text-sm text-orange-500 font-medium hover:underline">Reset Filters</button>
    </div>
  );

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-[130px]">
              <div className="flex items-center gap-2 mb-5">
                <SlidersHorizontal className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-gray-900">Filters</h3>
              </div>
              <FilterPanel />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">Browse Members</h1>
                <p className="text-sm text-gray-500">{total.toLocaleString()} profiles found</p>
              </div>
              <button onClick={() => setShowMobileFilters(v => !v)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                <SlidersHorizontal className="w-4 h-4" />Filters
              </button>
            </div>

            {showMobileFilters && (
              <div className="lg:hidden bg-white rounded-2xl border border-gray-100 p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <FilterPanel />
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                    <div className="aspect-[3/4] bg-gray-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No one nearby yet</h3>
                <p className="text-gray-400 text-sm mb-5">Try widening your filters to see more people.</p>
                <button
                  onClick={() => { setFilters({ showMe: 'everyone', city: '', minAge: 18, maxAge: 65, religion: '', verifiedOnly: false, onlineOnly: false, sortBy: 'online_first' }); setPage(1); }}
                  className="px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl text-sm hover:bg-orange-600 transition-colors"
                >
                  Adjust Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {members.map(member => {
                    const photo = member.photos?.find(p => p.is_primary) || member.photos?.[0];
                    const age = getAge(member.date_of_birth);
                    const online = isOnline(member.last_active_at);
                    const liked = likedIds.has(member.id);
                    const scoreColor = getTrustScoreColor(member.trust_score);
                    return (
                      <div key={member.id} onClick={() => router.push(`/profile/${member.id}`)} className="member-card">
                        <div className="relative aspect-[3/4] bg-gray-100">
                          {photo ? (
                            <img src={`${photo.storage_url}?auto=compress&cs=tinysrgb&w=400`} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-orange-50">
                              <span className="text-4xl font-bold text-orange-200">{member.name[0]}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          {online && <div className="absolute top-2.5 left-2.5"><span className="w-2.5 h-2.5 bg-green-400 rounded-full block ring-2 ring-white animate-pulse" /></div>}
                          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1">
                            {member.aadhaar_verified && <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-md font-bold">ID</span>}
                            {member.selfie_verified && <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-md font-bold">PV</span>}
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {online && <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />}
                              <p className="font-semibold text-gray-900 text-sm truncate">{member.name}, {age}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <p className="text-xs text-gray-500 truncate">{member.city}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-400">Trust</span>
                              <span className="text-xs font-semibold text-gray-600">{member.trust_score}</span>
                            </div>
                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${member.trust_score}%` }} />
                            </div>
                          </div>
                          {member.occupation && <p className="text-xs text-gray-400 mt-1.5 truncate">{member.occupation}</p>}
                          <div className="flex gap-2 mt-3">
                            <button onClick={(e) => handleLike(member.id, e)}
                              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${liked ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                              {liked ? '♥ Liked' : '♡ Like'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); router.push(`/messages?new=${member.id}`); }}
                              className="flex-1 py-1.5 text-xs font-semibold bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50">Previous</button>
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50">Next</button>
                  </div>
                )}
              </>
            )}
          </main>

          <aside className="w-56 flex-shrink-0 hidden xl:block">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-[130px]">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Your Stats</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">Trust Score</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getTrustScoreColor(user?.trust_score || 0)}`} style={{ width: `${user?.trust_score || 0}%` }} />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{user?.trust_score}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {[
                    { label: 'Phone', verified: user?.phone_verified, icon: '📱' },
                    { label: 'Aadhaar', verified: user?.aadhaar_verified, icon: '🏛️' },
                    { label: 'Selfie', verified: user?.selfie_verified, icon: '🤳' },
                    { label: 'Premium', verified: user?.is_premium, icon: '⭐' },
                  ].map(item => (
                    <div key={item.label} className={`p-2 rounded-lg text-center ${item.verified ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className="text-sm">{item.icon}</div>
                      <div className={`text-xs font-medium ${item.verified ? 'text-green-600' : 'text-gray-400'}`}>{item.label}</div>
                    </div>
                  ))}
                </div>
                {!user?.aadhaar_verified && (
                  <a href="/verify" className="block w-full mt-2 py-2 px-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-lg text-center hover:bg-amber-100">
                    Get Aadhaar Verified — Free
                  </a>
                )}
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 mt-4 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 fill-white" />
                <span className="text-sm font-semibold">This Month</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-100">Fake profiles removed</span>
                  <span className="text-sm font-bold">23</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-100">New verified members</span>
                  <span className="text-sm font-bold">1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-100">Scam attempts blocked</span>
                  <span className="text-sm font-bold">12</span>
                </div>
              </div>
              <a href="/trust" className="block mt-3 text-xs text-orange-200 hover:text-white underline">View full report →</a>
            </div>
          </aside>
        </div>
      </div>
    </AuthGuard>
  );
}
