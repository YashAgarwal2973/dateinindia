'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Bell, Shield, Trash2, Lock, ChevronRight, Eye, MessageCircle, Mail, CheckCircle } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user, signOut, refreshUser, db } = useAuth();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [privacySaving, setPrivacySaving] = useState(false);

  // Email state
  const [email, setEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => { document.title = 'Settings | DateInIndia'; }, []);

  useEffect(() => {
    if (!user) return;
    setIsDiscoverable(user.is_discoverable ?? true);
    setAllowMessages(user.allow_messages_from_strangers ?? true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEmail((user as any).email ?? '');
  }, [user]);

  async function saveEmail() {
    if (!user) return;
    setEmailError('');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailSaving(true);
    const hadEmailBefore = !!(user as { email?: string }).email;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (db.from('users') as any).update({ email: email || null }).eq('id', user.id);
    if (error) {
      setEmailError(error.message.includes('unique') ? 'That email is already in use.' : 'Failed to save. Please try again.');
      setEmailSaving(false);
      return;
    }
    await refreshUser();
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 3000);

    // Send welcome email the first time an email is added
    if (!hadEmailBefore && email) {
      const token = (() => {
        try { return JSON.parse(localStorage.getItem('dateinindia_session') ?? '{}')?.access_token ?? null; } catch { return null; }
      })();
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: 'welcome', user_id: user.id }),
      }).catch(() => { /* fire-and-forget */ });
    }
    setEmailSaving(false);
  }

  async function handleToggle(field: 'is_discoverable' | 'allow_messages_from_strangers', value: boolean) {
    if (!user) return;
    setPrivacySaving(true);
    if (field === 'is_discoverable') setIsDiscoverable(value);
    else setAllowMessages(value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('users') as any).update({ [field]: value }).eq('id', user.id);
    await refreshUser();
    setPrivacySaving(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE' || !user) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('users') as any).update({ is_suspended: true, suspension_reason: 'User deleted account' }).eq('id', user.id);
    signOut();
    router.push('/');
  }

  const NAV_SECTIONS = [
    {
      title: 'Profile',
      icon: User,
      items: [
        { label: 'Edit Profile', desc: 'Update your bio, interests, and info', href: '/me/edit' },
        { label: 'Manage Photos', desc: 'Upload, delete, or reorder your photos', href: '/me/edit/photos' },
        { label: 'Verification', desc: 'Manage Aadhaar and selfie verification', href: '/verify' },
        { label: 'Premium', desc: 'Manage subscription and purchases', href: '/premium' },
      ],
    },
    {
      title: 'Safety',
      icon: Shield,
      items: [
        { label: 'Trust Report', desc: 'View our monthly transparency report', href: '/trust' },
      ],
    },
  ];

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Settings</h1>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 flex items-center gap-4">
          {user?.photos?.[0] ? (
            <img src={`${user.photos[0].storage_url}?auto=compress&cs=tinysrgb&w=80`} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 text-xl font-bold">
              {user?.name?.[0]}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.city}, {user?.state}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-shrink-0 h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${user?.trust_score && user.trust_score >= 71 ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${user?.trust_score || 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">Trust: {user?.trust_score}/100</span>
            </div>
          </div>
          <button onClick={() => router.push('/me/edit')} className="ml-auto text-sm text-orange-500 font-medium hover:underline">
            Edit
          </button>
        </div>

        {/* Privacy toggles */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Privacy</h3>
          </div>

          <div className="divide-y divide-gray-50">
            {/* Discoverable toggle */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Show in Browse</p>
                <p className="text-xs text-gray-400 mt-0.5">When off, your profile won&apos;t appear in browse results</p>
              </div>
              <button
                onClick={() => handleToggle('is_discoverable', !isDiscoverable)}
                disabled={privacySaving}
                className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none flex-shrink-0 ${isDiscoverable ? 'bg-orange-500' : 'bg-gray-200'}`}
                role="switch"
                aria-checked={isDiscoverable}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDiscoverable ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Allow messages toggle */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Messages from Matches Only</p>
                <p className="text-xs text-gray-400 mt-0.5">When on, only matched members can message you</p>
              </div>
              <button
                onClick={() => handleToggle('allow_messages_from_strangers', !allowMessages)}
                disabled={privacySaving}
                className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none flex-shrink-0 ${allowMessages ? 'bg-gray-200' : 'bg-orange-500'}`}
                role="switch"
                aria-checked={!allowMessages}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${allowMessages ? 'translate-x-0' : 'translate-x-5'}`} />
              </button>
            </div>

            {/* Blocked users */}
            <button
              onClick={() => router.push('/settings/blocked')}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Blocked Users</p>
                <p className="text-xs text-gray-400 mt-0.5">View and manage blocked profiles</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Nav sections */}
        <div className="space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
                <section.icon className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{section.title}</h3>
              </div>
              <div>
                {section.items.map((item, i) => (
                  <button
                    key={item.label}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left ${i > 0 ? 'border-t border-gray-50' : ''}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Email & notifications */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email &amp; Notifications</h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-gray-500 leading-relaxed">
              Add your email to receive match notifications and important account updates.
              Your email is never shown to other members.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                placeholder="you@example.com"
                className="flex-1 min-w-0 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <button
                onClick={saveEmail}
                disabled={emailSaving}
                className="px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                {emailSaved
                  ? <><CheckCircle className="w-4 h-4" /> Saved</>
                  : emailSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
            {emailError && (
              <p className="text-xs text-red-600">{emailError}</p>
            )}
            {email && !emailError && (
              <p className="text-xs text-gray-400">
                You&apos;ll receive match notifications at this address.
              </p>
            )}
          </div>
        </div>

        {/* Notifications placeholder — kept minimal */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notifications</h3>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-gray-400">Push notification preferences are managed through your device settings.</p>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-6 bg-white rounded-2xl border border-red-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-red-50 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wide">Danger Zone</h3>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-600 mb-4">
              Deleting your account will remove your profile, photos, and all data permanently. This cannot be undone.
            </p>
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Type <strong>DELETE</strong> to confirm:</p>
                <input
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  className="w-full px-4 py-2 border border-red-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
                  placeholder="DELETE"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}
                    className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== 'DELETE' || saving}
                    className="flex-1 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 disabled:opacity-40 transition-colors"
                  >
                    {saving ? 'Deleting...' : 'Delete Forever'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => { signOut(); router.push('/'); }}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </AuthGuard>
  );
}
