'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Briefcase, GraduationCap, Heart, MessageCircle, Flag, Ban, ArrowLeft, ChevronLeft, ChevronRight, Music } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { getAge, isOnline, formatLastActive, getTrustScoreColor, getTrustScoreTextColor } from '@/lib/api';
import type { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'];
type UserWithPhotos = User & { photos: Photo[] };

const EDUCATION_LABELS: Record<string, string> = {
  school: 'High School', graduate: 'Graduate', postgraduate: 'Post Graduate', phd: 'PhD', other: 'Other'
};

const GOAL_LABELS: Record<string, string> = {
  serious: 'Serious Relationship', marriage: 'Marriage', friendship: 'Friendship First',
  casual: 'Casual Dating', not_sure: 'Not Sure Yet'
};

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, db } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserWithPhotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const [isMatch, setIsMatch] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await db
        .from('users')
        .select('*, photos(*)')
        .eq('id', id)
        .single();

      setProfile(data as UserWithPhotos);
      setLoading(false);
    }
    fetchProfile();
  }, [id]);

  useEffect(() => { document.title = 'Profile | DateInIndia'; }, []);

  useEffect(() => {
    if (!currentUser || !id) return;
    async function checkRelationship() {
      const { data: like } = await db
        .from('likes').select('id').eq('liker_id', currentUser!.id).eq('liked_id', id).single();
      setLiked(!!like);

      const [u1, u2] = [currentUser!.id, id].sort();
      const { data: match } = await db
        .from('matches').select('id').eq('user_1_id', u1).eq('user_2_id', u2).single();
      if (match) { setIsMatch(true); setMatchId(match.id); }

      const { data: block } = await db
        .from('blocks').select('blocker_id').eq('blocker_id', currentUser!.id).eq('blocked_id', id).single();
      setBlocked(!!block);
    }
    checkRelationship();
  }, [currentUser, id]);

  async function handleLike() {
    if (!currentUser) return;
    if (liked) {
      await db.from('likes').delete().eq('liker_id', currentUser.id).eq('liked_id', id);
      setLiked(false);
    } else {
      await db.from('likes').upsert({ liker_id: currentUser.id, liked_id: id });
      setLiked(true);
      const { data: rev } = await db.from('likes').select('id').eq('liker_id', id).eq('liked_id', currentUser.id).single();
      if (rev) {
        const [u1, u2] = [currentUser.id, id].sort();
        const { data: m } = await db.from('matches').upsert({
          user_1_id: u1, user_2_id: u2,
          compatibility_score: Math.floor(Math.random() * 30) + 70,
          icebreakers: ["What's your favorite place in your city?", "If you could travel anywhere in India right now, where?"],
        }).select('id').single();
        if (m) { setIsMatch(true); setMatchId(m.id); }
      }
    }
  }

  async function handleMessage() {
    if (!currentUser) return;
    if (matchId) { router.push(`/messages?match=${matchId}`); return; }
    const [u1, u2] = [currentUser.id, id].sort();
    const { data: m } = await db.from('matches').upsert({ user_1_id: u1, user_2_id: u2 }).select('id').single();
    if (m) router.push(`/messages?match=${m.id}`);
  }

  async function handleBlock() {
    if (!currentUser) return;
    if (blocked) {
      await db.from('blocks').delete().eq('blocker_id', currentUser.id).eq('blocked_id', id);
      setBlocked(false);
    } else {
      await db.from('blocks').upsert({ blocker_id: currentUser.id, blocked_id: id });
      setBlocked(true);
    }
  }

  async function handleReport() {
    if (!currentUser || !reportReason) return;
    await db.from('reports').insert({
      reporter_id: currentUser.id, reported_id: id,
      reason: reportReason, status: 'pending',
    });
    setShowReportModal(false);
    alert('Report submitted. We review all reports within 24 hours.');
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
            <div className="flex gap-6">
              <div className="w-80 h-96 bg-gray-100 rounded-2xl" />
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-20 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!profile) {
    return (
      <AuthGuard>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Profile not found or has been removed.</p>
        </div>
      </AuthGuard>
    );
  }

  const photos = profile.photos?.sort((a, b) => a.display_order - b.display_order) || [];
  const currentPhoto = photos[photoIdx];
  const age = getAge(profile.date_of_birth);
  const online = isOnline(profile.last_active_at);
  const scoreColor = getTrustScoreColor(profile.trust_score);
  const scoreTextColor = getTrustScoreTextColor(profile.trust_score);
  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-5 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </button>

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row">
            {/* Photo section */}
            <div className="lg:w-96 flex-shrink-0">
              <div className="relative aspect-[3/4] lg:aspect-auto lg:h-full min-h-[400px] bg-gray-100">
                {currentPhoto ? (
                  <img
                    src={`${currentPhoto.storage_url}?auto=compress&cs=tinysrgb&w=600`}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-orange-50">
                    <span className="text-6xl text-orange-200">?</span>
                  </div>
                )}

                {/* Photo navigation */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setPhotoIdx(i => Math.max(0, i - 1))}
                      disabled={photoIdx === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))}
                      disabled={photoIdx === photos.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIdx(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${i === photoIdx ? 'bg-white' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Online badge */}
                {online && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 rounded-full px-2.5 py-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white text-xs font-medium">Online now</span>
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {photos.length > 1 && (
                <div className="flex gap-1.5 p-3 bg-gray-50">
                  {photos.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setPhotoIdx(i)}
                      className={`w-14 h-16 rounded-lg overflow-hidden flex-shrink-0 ring-2 transition-all ${i === photoIdx ? 'ring-orange-500' : 'ring-transparent opacity-60'}`}
                    >
                      <img src={`${p.storage_url}?auto=compress&cs=tinysrgb&w=100`} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile info */}
            <div className="flex-1 p-6 lg:p-8">
              {/* Name & basics */}
              <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                <div>
                  <h1 className="text-3xl font-display font-bold text-gray-900">
                    {profile.name}, {age}
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5 text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{profile.city}, {profile.state}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm">{online ? 'Online now' : formatLastActive(profile.last_active_at)}</span>
                  </div>
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        liked ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-white' : ''}`} />
                      {liked ? 'Liked' : 'Like'}
                    </button>
                    <button
                      onClick={handleMessage}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-700 rounded-xl font-semibold text-sm hover:bg-green-100 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                  </div>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/me/edit')}
                    className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                {profile.phone_verified && (
                  <span className="trust-badge-phone">📱 Phone Verified</span>
                )}
                {profile.selfie_verified && (
                  <span className="trust-badge-photo">🤳 Photo Verified</span>
                )}
                {profile.aadhaar_verified && (
                  <span className="trust-badge-id">🏛️ ID Verified</span>
                )}
                {profile.is_premium && profile.premium_tier === 'trust' && (
                  <span className="trust-badge-human">✨ Human Verified</span>
                )}
              </div>

              {/* Trust score */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Trust Score</span>
                  <span className={`text-lg font-bold ${scoreTextColor}`}>{profile.trust_score}/100</span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full trust-score-fill ${scoreColor}`} style={{ width: `${profile.trust_score}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {profile.trust_score >= 71 ? 'Highly trusted member' : profile.trust_score >= 41 ? 'Building trust' : 'New member'}
                </p>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">About</h3>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {profile.occupation && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{profile.occupation}</span>
                  </div>
                )}
                {profile.education && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{EDUCATION_LABELS[profile.education] || profile.education}</span>
                  </div>
                )}
                {profile.mother_tongue && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Music className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{profile.mother_tongue}</span>
                  </div>
                )}
                {profile.religion && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-gray-400 flex-shrink-0">🙏</span>
                    <span>{profile.religion}</span>
                  </div>
                )}
                {profile.height_cm && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-gray-400 flex-shrink-0">↕</span>
                    <span>{profile.height_cm} cm</span>
                  </div>
                )}
                {profile.relationship_goal && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Heart className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{GOAL_LABELS[profile.relationship_goal] || profile.relationship_goal}</span>
                  </div>
                )}
              </div>

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map(i => (
                      <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded-full border border-orange-100">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lifestyle */}
              {(profile.smoking || profile.drinking) && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Lifestyle</h3>
                  <div className="flex gap-3">
                    {profile.smoking && (
                      <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                        🚬 Smoking: {profile.smoking}
                      </span>
                    )}
                    {profile.drinking && (
                      <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                        🍷 Drinking: {profile.drinking}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Report/Block actions (not own profile) */}
              {!isOwnProfile && (
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Report
                  </button>
                  <button
                    onClick={handleBlock}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {blocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="font-display font-bold text-gray-900 text-lg mb-4">Report Profile</h3>
              <p className="text-sm text-gray-500 mb-4">Why are you reporting {profile.name}?</p>
              <div className="space-y-2 mb-5">
                {[
                  ['fake_profile', 'Fake profile / impersonation'],
                  ['scam_fraud', 'Scam or fraud attempt'],
                  ['harassment', 'Harassment or abuse'],
                  ['explicit_photos', 'Explicit or inappropriate photos'],
                  ['underage', 'Appears to be underage'],
                  ['spam', 'Spam or bot'],
                  ['other', 'Other'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-gray-50">
                    <input
                      type="radio"
                      name="reason"
                      value={val}
                      checked={reportReason === val}
                      onChange={() => setReportReason(val)}
                      className="accent-orange-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={!reportReason}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-red-600"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
