'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MapPin, Briefcase, GraduationCap, Heart, Edit, Shield, CheckCircle } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { getAge, getTrustScoreColor, getTrustScoreTextColor } from '@/lib/api';

const GOAL_LABELS: Record<string, string> = {
  serious: 'Serious Relationship', marriage: 'Marriage', friendship: 'Friendship First',
  casual: 'Casual Dating', not_sure: 'Not Sure Yet'
};

const EDUCATION_LABELS: Record<string, string> = {
  school: 'High School', graduate: 'Graduate', postgraduate: 'Post Graduate', phd: 'PhD', other: 'Other'
};

export default function MyProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => { document.title = 'My Profile | DateInIndia'; }, []);

  if (!user) return null;

  const primaryPhoto = user.photos?.find(p => p.is_primary) || user.photos?.[0];
  const age = getAge(user.date_of_birth);
  const scoreColor = getTrustScoreColor(user.trust_score);
  const scoreTextColor = getTrustScoreTextColor(user.trust_score);

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-display font-bold text-gray-900">My Profile</h1>
          <button
            onClick={() => router.push('/me/edit')}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm transition-all"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        </div>

        {/* Profile completeness */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-orange-700">Profile Completeness</span>
              <span className="text-sm font-bold text-orange-700">{user.profile_complete_pct}%</span>
            </div>
            <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${user.profile_complete_pct}%` }} />
            </div>
          </div>
          {user.profile_complete_pct < 100 && (
            <button
              onClick={() => router.push('/me/edit')}
              className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 whitespace-nowrap"
            >
              Complete Profile
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row">
            {/* Photos */}
            <div className="sm:w-72 flex-shrink-0">
              <div className="relative aspect-[3/4] bg-gray-100">
                {primaryPhoto ? (
                  <img src={`${primaryPhoto.storage_url}?auto=compress&cs=tinysrgb&w=500`} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-orange-50">
                    <div className="text-4xl text-orange-200">📷</div>
                    <p className="text-sm text-orange-400 font-medium">No photo yet</p>
                    <button onClick={() => router.push('/me/edit')} className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl">
                      Add Photo
                    </button>
                  </div>
                )}
              </div>
              {user.photos && user.photos.length > 1 && (
                <div className="flex gap-1.5 p-2 bg-gray-50">
                  {user.photos.slice(0, 5).map((p) => (
                    <div key={p.id} className="w-12 h-14 rounded-lg overflow-hidden">
                      <img src={`${p.storage_url}?auto=compress&cs=tinysrgb&w=100`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-6">
              <div className="mb-5">
                <h2 className="text-2xl font-display font-bold text-gray-900">{user.name}, {age}</h2>
                <div className="flex items-center gap-2 mt-1 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{user.city}, {user.state}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                {user.phone_verified && <span className="trust-badge-phone">📱 Phone Verified</span>}
                {user.selfie_verified && <span className="trust-badge-photo">🤳 Photo Verified</span>}
                {user.aadhaar_verified && <span className="trust-badge-id">🏛️ ID Verified</span>}
                {user.is_premium && user.premium_tier === 'trust' && <span className="trust-badge-human">✨ Human Verified</span>}
                {!user.aadhaar_verified && (
                  <button onClick={() => router.push('/verify')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
                    + Get ID Verified (Free)
                  </button>
                )}
              </div>

              {/* Trust score */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Trust Score</span>
                  <span className={`text-lg font-bold ${scoreTextColor}`}>{user.trust_score}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${user.trust_score}%` }} />
                </div>
              </div>

              {user.bio && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">About</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{user.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-5">
                {user.occupation && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{user.occupation}</span>
                  </div>
                )}
                {user.education && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span>{EDUCATION_LABELS[user.education] || user.education}</span>
                  </div>
                )}
                {user.relationship_goal && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Heart className="w-4 h-4 text-gray-400" />
                    <span>{GOAL_LABELS[user.relationship_goal] || user.relationship_goal}</span>
                  </div>
                )}
                {user.mother_tongue && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-gray-400">🗣</span>
                    <span>{user.mother_tongue}</span>
                  </div>
                )}
              </div>

              {user.interests && user.interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {user.interests.map(i => (
                    <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-100">{i}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Verify Identity', desc: 'Get Aadhaar verified for free', icon: Shield, href: '/verify', color: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Browse Members', desc: 'Find your match', icon: Heart, href: '/browse', color: 'bg-orange-50 border-orange-200 text-orange-700' },
            { label: 'Go Premium', desc: 'Unlock all features', icon: CheckCircle, href: '/premium', color: 'bg-green-50 border-green-200 text-green-700' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`flex items-center gap-3 p-4 rounded-2xl border ${item.color} hover:opacity-80 transition-opacity text-left`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
