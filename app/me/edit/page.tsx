'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Camera } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@/lib/auth-context';

const INTERESTS = [
  'Cricket', 'Travel', 'Cooking', 'Yoga', 'Music', 'Movies', 'Reading', 'Fitness',
  'Photography', 'Dance', 'Art', 'Gaming', 'Hiking', 'Badminton', 'Chess', 'Meditation',
  'Food', 'Fashion', 'Technology', 'Gardening', 'Cycling', 'Swimming', 'Writing', 'Spirituality',
];

export default function EditProfilePage() {
  const { user, refreshUser, db } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = 'Edit Profile | DateInIndia'; }, []);

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    occupation: user?.occupation || '',
    city: user?.city || '',
    state: user?.state || '',
    mother_tongue: user?.mother_tongue || '',
    religion: user?.religion || '',
    height_cm: user?.height_cm ? String(user.height_cm) : '',
    smoking: user?.smoking || '',
    drinking: user?.drinking || '',
    relationship_goal: user?.relationship_goal || '',
    want_children: user?.want_children || '',
    interests: user?.interests || [],
  });

  function toggleInterest(i: string) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i)
        ? f.interests.filter(x => x !== i)
        : f.interests.length < 10 ? [...f.interests, i] : f.interests,
    }));
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('users') as any).update({
      ...form,
      height_cm: form.height_cm ? parseInt(form.height_cm) : null,
      smoking: form.smoking || null,
      drinking: form.drinking || null,
    }).eq('id', user.id);
    await refreshUser();
    router.push('/me');
    setSaving(false);
  }

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-display font-bold text-gray-900">Edit Profile</h1>
        </div>

        <div className="space-y-6">
          {/* Photos section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">Profile Photos</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user?.photos?.length || 0} photo{(user?.photos?.length || 0) !== 1 ? 's' : ''} uploaded
              </p>
            </div>
            <button
              onClick={() => router.push('/me/edit/photos')}
              className="px-4 py-2 bg-orange-50 text-orange-600 text-sm font-semibold rounded-xl hover:bg-orange-100 transition-colors"
            >
              Manage
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Basic Info</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio ({form.bio.length}/500)</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, 500) }))}
                  rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                  <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Background</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Occupation</label>
                <input value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mother Tongue</label>
                <input value={form.mother_tongue} onChange={e => setForm(f => ({ ...f, mother_tongue: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Religion</label>
                <select value={form.religion} onChange={e => setForm(f => ({ ...f, religion: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm bg-white">
                  <option value="">Prefer not to say</option>
                  {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Height (cm)</label>
                <input type="number" value={form.height_cm} onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))}
                  min={140} max={220} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Relationship Goals</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[['serious', 'Serious'], ['marriage', 'Marriage'], ['friendship', 'Friendship'], ['casual', 'Casual'], ['not_sure', 'Not Sure']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setForm(f => ({ ...f, relationship_goal: v }))}
                  className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${form.relationship_goal === v ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Interests ({form.interests.length}/10)</h3>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(i => (
                <button key={i} type="button" onClick={() => toggleInterest(i)}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 font-medium transition-all ${form.interests.includes(i) ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-orange-200'}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </AuthGuard>
  );
}
