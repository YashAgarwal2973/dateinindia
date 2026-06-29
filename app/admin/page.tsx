'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import AdminGuard from '@/lib/adminGuard';
import {
  Flag, Users, ShieldCheck, Ban, CheckCircle,
  XCircle, RefreshCw, AlertTriangle, UserCheck, BarChart3,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  age: number;
  is_premium: boolean;
  is_suspended: boolean;
  is_admin: boolean;
  trust_score: number;
  strike_count: number;
  created_at: string;
  last_active_at: string;
  photos?: { storage_url: string; is_primary: boolean }[];
}

interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string | null;
  status: string;
  action_taken: string | null;
  moderator_note: string | null;
  created_at: string;
  reporter: { name: string; phone: string } | null;
  reported: { id: string; name: string; phone: string; is_suspended: boolean } | null;
}

interface Verification {
  id: string;
  user_id: string;
  verification_type: string;
  status: string;
  created_at: string;
  user: { name: string; phone: string; city: string } | null;
}

interface Stats {
  totalUsers: number;
  suspendedUsers: number;
  pendingReports: number;
  pendingVerifications: number;
}

type Tab = 'reports' | 'users' | 'verifications';

// ── Helpers ────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  fake_profile: 'Fake Profile',
  scam_fraud: 'Scam / Fraud',
  harassment: 'Harassment',
  explicit_photos: 'Explicit Photos',
  underage: 'Underage',
  escort_commercial: 'Escort / Commercial',
  spam: 'Spam',
  other: 'Other',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    reviewing: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-600',
    approved: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Avatar({ name, photoUrl, size = 'sm' }: { name: string; photoUrl?: string; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-12 h-12' : 'w-9 h-9';
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold flex-shrink-0`}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

function AdminDashboard() {
  const { user, db } = useAuth();
  const [tab, setTab] = useState<Tab>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banTarget, setBanTarget] = useState<{ id: string; name: string } | null>(null);

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    const [total, suspended, reports, verifs] = await Promise.all([
      db.from('users').select('*', { count: 'exact', head: true }),
      db.from('users').select('*', { count: 'exact', head: true }).eq('is_suspended', true),
      db.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    setStats({
      totalUsers: total.count ?? 0,
      suspendedUsers: suspended.count ?? 0,
      pendingReports: reports.count ?? 0,
      pendingVerifications: verifs.count ?? 0,
    });
  }, [db]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const { data } = await db
      .from('reports')
      .select('*, reporter:reporter_id(name, phone), reported:reported_id(id, name, phone, is_suspended)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setReports((data as Report[]) ?? []);
    setLoading(false);
  }, [db]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const query = db
      .from('users')
      .select('id, name, phone, city, state, age: date_of_birth, is_premium, is_suspended, is_admin, trust_score, strike_count, created_at, last_active_at, photos(storage_url, is_primary)')
      .order('created_at', { ascending: false })
      .limit(100);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await query as any;
    setUsers(data ?? []);
    setLoading(false);
  }, [db]);

  const loadVerifications = useCallback(async () => {
    setLoading(true);
    const { data } = await db
      .from('verifications')
      .select('*, user:user_id(name, phone, city)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setVerifications((data as Verification[]) ?? []);
    setLoading(false);
  }, [db]);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (tab === 'reports') loadReports();
    else if (tab === 'users') loadUsers();
    else loadVerifications();
  }, [tab, loadReports, loadUsers, loadVerifications]);

  useEffect(() => { document.title = 'Admin Console | DateInIndia'; }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function banUser(userId: string, reason: string, reportId?: string) {
    await db.from('users').update({
      is_suspended: true,
      suspension_reason: reason,
      strike_count: 99,
    }).eq('id', userId);

    if (reportId) {
      await db.from('reports').update({
        status: 'resolved',
        moderator_id: user!.id,
        action_taken: 'user_banned',
        moderator_note: reason,
        resolved_at: new Date().toISOString(),
      }).eq('id', reportId);
    }

    setBanTarget(null);
    setBanReason('');
    loadStats();
    if (tab === 'reports') loadReports();
    else loadUsers();
  }

  async function unbanUser(userId: string) {
    await db.from('users').update({
      is_suspended: false,
      suspension_reason: null,
    }).eq('id', userId);
    loadStats();
    loadUsers();
  }

  async function resolveReport(reportId: string, action: 'resolved' | 'dismissed', note?: string) {
    await db.from('reports').update({
      status: action,
      moderator_id: user!.id,
      action_taken: action === 'dismissed' ? 'false_report' : 'no_action',
      moderator_note: note ?? null,
      resolved_at: new Date().toISOString(),
    }).eq('id', reportId);
    loadStats();
    loadReports();
  }

  async function setVerificationStatus(verificationId: string, userId: string, approved: boolean) {
    await db.from('verifications').update({
      status: approved ? 'approved' : 'failed',
      verified_at: approved ? new Date().toISOString() : null,
    }).eq('id', verificationId);

    // Update user trust score and verification flags
    const verif = verifications.find(v => v.id === verificationId);
    if (verif && approved) {
      const field = verif.verification_type === 'phone'
        ? 'phone_verified'
        : verif.verification_type === 'aadhaar'
        ? 'aadhaar_verified'
        : 'selfie_verified';
      await db.from('users').update({
        [field]: true,
        trust_score: db.rpc ? undefined : undefined, // trust_score update done below
      }).eq('id', userId);
      // Bump trust score by verification type weight
      const bonus = verif.verification_type === 'aadhaar' ? 30 : verif.verification_type === 'selfie' ? 15 : 10;
      const { data: u } = await db.from('users').select('trust_score').eq('id', userId).single();
      if (u) {
        await db.from('users').update({
          trust_score: Math.min(100, (u.trust_score ?? 0) + bonus),
        }).eq('id', userId);
      }
    }

    loadStats();
    loadVerifications();
  }

  // ── Filtered users ────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch) ||
    u.city?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-400 mt-0.5">DateInIndia — Moderation Console</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
            {user?.name}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Suspended', value: stats.suspendedUsers, icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Pending Reports', value: stats.pendingReports, icon: Flag, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Pending Verifs', value: stats.pendingVerifications, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {([
            { key: 'reports', label: 'Reports', icon: Flag },
            { key: 'users', label: 'Users', icon: Users },
            { key: 'verifications', label: 'Verifications', icon: ShieldCheck },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.key === 'reports' && stats?.pendingReports ? (
                <span className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {stats.pendingReports}
                </span>
              ) : null}
              {t.key === 'verifications' && stats?.pendingVerifications ? (
                <span className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {stats.pendingVerifications}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <RefreshCw className="w-8 h-8 text-gray-300 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : tab === 'reports' ? (

          /* ── REPORTS ─────────────────────────────────────────────── */
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-700">No pending reports</p>
                <p className="text-sm text-gray-400 mt-1">All reports have been resolved.</p>
              </div>
            ) : reports.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{REASON_LABELS[r.reason] ?? r.reason}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Reported by <strong>{r.reporter?.name}</strong> · {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-red-500 mb-2 uppercase tracking-wide">Reported User</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-red-200 rounded-full flex items-center justify-center font-bold text-red-700">
                        {r.reported?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{r.reported?.name}</p>
                        <p className="text-xs text-gray-500">{r.reported?.phone}</p>
                        {r.reported?.is_suspended && (
                          <span className="text-xs text-red-600 font-semibold">Already suspended</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {r.details && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Details</p>
                      <p className="text-sm text-gray-700">{r.details}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => resolveReport(r.id, 'dismissed')}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Dismiss (False Report)
                  </button>
                  <button
                    onClick={() => resolveReport(r.id, 'resolved', 'Reviewed, no action needed')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolve (No Ban)
                  </button>
                  {!r.reported?.is_suspended && (
                    <button
                      onClick={() => setBanTarget({ id: r.reported!.id, name: r.reported!.name })}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                      Ban User
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        ) : tab === 'users' ? (

          /* ── USERS ───────────────────────────────────────────────── */
          <div>
            <div className="mb-4">
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by name, phone, or city..."
                className="w-full max-w-sm px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">No users found.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wide">User</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3 uppercase tracking-wide hidden md:table-cell">Location</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3 uppercase tracking-wide hidden lg:table-cell">Trust</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3 uppercase tracking-wide">Status</th>
                      <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map(u => {
                      const photo = u.photos?.find(p => p.is_primary) ?? u.photos?.[0];
                      return (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={u.name} photoUrl={photo?.storage_url} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900 text-sm">{u.name}</span>
                                  {u.is_admin && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">Admin</span>}
                                  {u.is_premium && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold">Premium</span>}
                                </div>
                                <p className="text-xs text-gray-400">{u.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 hidden md:table-cell">
                            <span className="text-sm text-gray-600">{u.city}</span>
                          </td>
                          <td className="px-3 py-4 hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-400 rounded-full"
                                  style={{ width: `${u.trust_score}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{u.trust_score}</span>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <StatusBadge status={u.is_suspended ? 'dismissed' : 'approved'} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            {u.id !== user?.id && !u.is_admin && (
                              u.is_suspended ? (
                                <button
                                  onClick={() => unbanUser(u.id)}
                                  className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                  Unban
                                </button>
                              ) : (
                                <button
                                  onClick={() => setBanTarget({ id: u.id, name: u.name })}
                                  className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  Ban
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        ) : (

          /* ── VERIFICATIONS ───────────────────────────────────────── */
          <div className="space-y-3">
            {verifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <UserCheck className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-700">No pending verifications</p>
                <p className="text-sm text-gray-400 mt-1">All verification requests are up to date.</p>
              </div>
            ) : verifications.map(v => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{v.user?.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                        {v.verification_type.charAt(0).toUpperCase() + v.verification_type.slice(1)}
                      </span>
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {v.user?.phone} · {v.user?.city} · Submitted {new Date(v.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setVerificationStatus(v.id, v.user_id, true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setVerificationStatus(v.id, v.user_id, false)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

        )}
      </div>

      {/* Ban modal */}
      {banTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Ban {banTarget.name}?</h3>
                <p className="text-sm text-gray-500">This will immediately suspend their account.</p>
              </div>
            </div>
            <textarea
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="Suspension reason (required)..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-red-400 mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setBanTarget(null); setBanReason(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => banReason.trim() && banUser(banTarget.id, banReason.trim())}
                disabled={!banReason.trim()}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}
