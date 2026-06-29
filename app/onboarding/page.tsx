'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import PhotoUpload from '@/components/PhotoUpload';

const STEP_LABELS = [
  'Basic Info',
  'Location',
  'Background',
  'Relationship Goals',
  'About You',
  'Photos',
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Surat', 'Lucknow', 'Kochi', 'Chandigarh', 'Nagpur', 'Indore', 'Bhopal',
  'Visakhapatnam', 'Vadodara', 'Coimbatore', 'Gurgaon', 'Noida', 'Thiruvananthapuram', 'Mangalore', 'Trivandrum',
];

const STATES = [
  'Andhra Pradesh', 'Delhi', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
];

const INTERESTS = [
  'Cricket', 'Travel', 'Cooking', 'Yoga', 'Music', 'Movies', 'Reading', 'Fitness',
  'Photography', 'Dance', 'Art', 'Gaming', 'Hiking', 'Badminton', 'Chess', 'Meditation',
  'Food', 'Fashion', 'Technology', 'Gardening', 'Cycling', 'Swimming', 'Writing', 'Spirituality',
];

const PEXELS_PHOTOS_W = [
  'https://images.pexels.com/photos/3756981/pexels-photo-3756981.jpeg',
  'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
  'https://images.pexels.com/photos/3064079/pexels-photo-3064079.jpeg',
  'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg',
  'https://images.pexels.com/photos/2169434/pexels-photo-2169434.jpeg',
  'https://images.pexels.com/photos/1520760/pexels-photo-1520760.jpeg',
];

const PEXELS_PHOTOS_M = [
  'https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg',
  'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg',
  'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg',
  'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg',
  'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg',
  'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg',
];

interface FormData {
  name: string;
  dateOfBirth: string;
  gender: string;
  lookingFor: string;
  city: string;
  state: string;
  occupation: string;
  education: string;
  motherTongue: string;
  religion: string;
  relationshipGoal: string;
  wantChildren: string;
  meetingTimeline: string;
  bio: string;
  interests: string[];
  height_cm: string;
  smoking: string;
  drinking: string;
  selectedPhoto: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser, db } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: user?.name || '',
    dateOfBirth: user?.date_of_birth || '1995-01-01',
    gender: user?.gender || '',
    lookingFor: user?.looking_for || '',
    city: user?.city || '',
    state: user?.state || '',
    occupation: user?.occupation || '',
    education: user?.education || '',
    motherTongue: user?.mother_tongue || '',
    religion: user?.religion || '',
    relationshipGoal: user?.relationship_goal || '',
    wantChildren: user?.want_children || '',
    meetingTimeline: user?.meeting_timeline || '',
    bio: user?.bio || '',
    interests: user?.interests || [],
    height_cm: user?.height_cm ? String(user.height_cm) : '',
    smoking: user?.smoking || '',
    drinking: user?.drinking || '',
    selectedPhoto: '',
  });

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  useEffect(() => { document.title = 'Get Started | DateInIndia'; }, []);

  function set(key: keyof FormData, val: string | string[]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function toggleInterest(interest: string) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : f.interests.length < 10 ? [...f.interests, interest] : f.interests,
    }));
  }

  async function saveStep() {
    if (!user) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        onboarding_step: step + 1,
      };

      if (step === 1) {
        updates.name = form.name;
        updates.date_of_birth = form.dateOfBirth;
        updates.gender = form.gender;
        updates.looking_for = form.lookingFor;
      } else if (step === 2) {
        updates.city = form.city;
        updates.state = form.state;
      } else if (step === 3) {
        updates.occupation = form.occupation;
        updates.education = form.education || null;
        updates.mother_tongue = form.motherTongue;
        updates.religion = form.religion;
        updates.height_cm = form.height_cm ? parseInt(form.height_cm) : null;
        updates.smoking = form.smoking || null;
        updates.drinking = form.drinking || null;
      } else if (step === 4) {
        updates.relationship_goal = form.relationshipGoal;
        updates.want_children = form.wantChildren;
        updates.meeting_timeline = form.meetingTimeline;
      } else if (step === 5) {
        updates.bio = form.bio;
        updates.interests = form.interests;
        const completed = [form.name, form.dateOfBirth, form.gender, form.city, form.bio, form.interests.length > 0].filter(Boolean).length;
        updates.profile_complete_pct = Math.round((completed / 6) * 100);
      } else if (step === 6) {
        updates.onboarding_complete = true;
        updates.onboarding_step = 6;
        updates.profile_complete_pct = 85;
        if (form.selectedPhoto) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db.from('photos') as any).upsert({
            user_id: user.id,
            storage_url: form.selectedPhoto,
            is_primary: true,
            display_order: 1,
          });
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.from('users') as any).update(updates).eq('id', user.id);
      await refreshUser();

      if (step === 6) {
        router.push('/browse');
      } else {
        setStep(s => s + 1);
      }
    } finally {
      setSaving(false);
    }
  }

  const photoOptions = form.gender === 'woman' ? PEXELS_PHOTOS_W : PEXELS_PHOTOS_M;

  const canProceed = (() => {
    if (step === 1) return form.name && form.dateOfBirth && form.gender && form.lookingFor;
    if (step === 2) return form.city && form.state;
    if (step === 3) return true;
    if (step === 4) return form.relationshipGoal;
    if (step === 5) return form.bio.length >= 20 && form.interests.length >= 3;
    if (step === 6) return true;
    return true;
  })();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="font-display font-bold text-gray-900">DateInIndia</span>
            </div>
            <span className="text-sm text-gray-500">Step {step} of 6</span>
          </div>

          {/* Progress */}
          <div className="flex gap-1">
            {STEP_LABELS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 <= step ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {STEP_LABELS.map((label, i) => (
              <span key={label} className={`text-xs transition-colors ${i + 1 === step ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Tell us about yourself</h2>
                  <p className="text-gray-500">This information will appear on your profile.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => set('dateOfBirth', e.target.value)}
                    max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[['man', 'Man'], ['woman', 'Woman'], ['non_binary', 'Non-binary']].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => set('gender', val)}
                        className={`py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                          form.gender === val
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600 hover:border-orange-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Looking for</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[['men', 'Men'], ['women', 'Women'], ['everyone', 'Everyone']].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => set('lookingFor', val)}
                        className={`py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                          form.lookingFor === val
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600 hover:border-orange-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Where are you based?</h2>
                  <p className="text-gray-500">We&apos;ll show you profiles in your area.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <select
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-white"
                  >
                    <option value="">Select your city</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <select
                    value={form.state}
                    onChange={e => set('state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-white"
                  >
                    <option value="">Select your state</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Background */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Your background</h2>
                  <p className="text-gray-500">All optional. Add what you&apos;re comfortable sharing.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                    <input
                      value={form.occupation}
                      onChange={e => set('occupation', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                    <select
                      value={form.education}
                      onChange={e => set('education', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-white"
                    >
                      <option value="">Select</option>
                      {[['school', 'High School'], ['graduate', 'Graduate'], ['postgraduate', 'Post Graduate'], ['phd', 'PhD'], ['other', 'Other']].map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mother Tongue</label>
                    <input
                      value={form.motherTongue}
                      onChange={e => set('motherTongue', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
                      placeholder="e.g. Hindi, Tamil"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                    <select
                      value={form.religion}
                      onChange={e => set('religion', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-white"
                    >
                      <option value="">Prefer not to say</option>
                      {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                    <input
                      type="number"
                      value={form.height_cm}
                      onChange={e => set('height_cm', e.target.value)}
                      min={140} max={220}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
                      placeholder="165"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Smoking</label>
                    <div className="flex gap-2">
                      {[['never', 'Never'], ['socially', 'Socially'], ['regularly', 'Regularly']].map(([v, l]) => (
                        <button key={v} type="button" onClick={() => set('smoking', v)}
                          className={`flex-1 py-2 text-xs rounded-lg border-2 font-medium transition-all ${form.smoking === v ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Drinking</label>
                    <div className="flex gap-2">
                      {[['never', 'Never'], ['socially', 'Socially'], ['regularly', 'Regularly']].map(([v, l]) => (
                        <button key={v} type="button" onClick={() => set('drinking', v)}
                          className={`flex-1 py-2 text-xs rounded-lg border-2 font-medium transition-all ${form.drinking === v ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Relationship Goals */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">What are you looking for?</h2>
                  <p className="text-gray-500">Honesty here helps find better matches.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Relationship Goal</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      ['serious', 'Serious Relationship'],
                      ['marriage', 'Marriage'],
                      ['friendship', 'Friendship First'],
                      ['casual', 'Casual Dating'],
                      ['not_sure', 'Not Sure Yet'],
                    ].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => set('relationshipGoal', val)}
                        className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all text-left ${
                          form.relationshipGoal === val
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600 hover:border-orange-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Want Children?</label>
                  <div className="flex flex-wrap gap-3">
                    {['Yes', 'No', 'Maybe', 'Already have, open to more', 'Not sure'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => set('wantChildren', val)}
                        className={`px-4 py-2 rounded-full text-sm border-2 font-medium transition-all ${
                          form.wantChildren === val
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600 hover:border-orange-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Timeline to meet?</label>
                  <div className="flex flex-wrap gap-3">
                    {['Right now', 'Within 3 months', 'Within 6 months', 'Within a year', 'No rush'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => set('meetingTimeline', val)}
                        className={`px-4 py-2 rounded-full text-sm border-2 font-medium transition-all ${
                          form.meetingTimeline === val
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600 hover:border-orange-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: About You */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Tell your story</h2>
                  <p className="text-gray-500">People with a good bio get 4x more matches.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Bio <span className="text-gray-400 font-normal">({form.bio.length}/500)</span>
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={e => set('bio', e.target.value.slice(0, 500))}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
                    placeholder="Tell people who you are, what you love doing, what you're looking for..."
                  />
                  {form.bio.length < 20 && form.bio.length > 0 && (
                    <p className="text-sm text-orange-500 mt-1">Minimum 20 characters for a good bio</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests <span className="text-gray-400 font-normal">({form.interests.length}/10 selected)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(interest => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-full text-sm border-2 font-medium transition-all ${
                          form.interests.includes(interest)
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600 hover:border-orange-200'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                  {form.interests.length < 3 && (
                    <p className="text-sm text-gray-400 mt-2">Select at least 3 interests</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Photo */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Add your profile photo</h2>
                  <p className="text-gray-500">Profiles with photos get 10x more views.</p>
                </div>

                {/* Upload your own */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Upload your own photo</p>
                  <PhotoUpload
                    onUploadComplete={(url) => {
                      set('selectedPhoto', url);
                    }}
                  />
                  {form.selectedPhoto && form.selectedPhoto.startsWith('https://') && !form.selectedPhoto.includes('pexels') && (
                    <div className="mt-3 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <img src={form.selectedPhoto} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <p className="text-sm font-semibold text-green-700">Photo uploaded!</p>
                        <p className="text-xs text-green-600">This will be your profile photo.</p>
                      </div>
                      <div className="ml-auto w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Or pick a sample */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-3">Or choose a sample photo for now</p>
                  <div className="grid grid-cols-3 gap-3">
                    {photoOptions.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => set('selectedPhoto', url)}
                        className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-4 transition-all ${
                          form.selectedPhoto === url ? 'border-orange-500 shadow-lg shadow-orange-200' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={`${url}?auto=compress&cs=tinysrgb&w=300`}
                          alt="Profile option"
                          className="w-full h-full object-cover"
                        />
                        {form.selectedPhoto === url && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={saveStep}
                disabled={!canProceed || saving}
                className="flex items-center gap-2 px-8 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : step === 6 ? 'Start Browsing!' : 'Continue'}
                {!saving && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
