'use client';

import { useEffect, useState } from 'react';
import { Shield, CheckCircle, Eye, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@/lib/auth-context';

interface Report {
  id: string;
  report_month: string;
  total_messages_scanned: number;
  fake_profiles_removed: number;
  scam_accounts_banned: number;
  harassment_warnings: number;
  reports_assisted_law: number;
  avg_resolution_hours: number | null;
  new_users: number;
  aadhaar_verified_count: number;
  published_at: string | null;
  created_at: string;
}

export default function TrustPage() {
  const { db } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    document.title = 'Trust & Transparency | DateInIndia';
    db.from('transparency_reports')
      .select('*')
      .not('published_at', 'is', null)
      .order('report_month', { ascending: false })
      .then(({ data }: { data: Report[] | null }) => setReports(data || []));
  }, [db]);

  const latest = reports[0];

  return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-6">
            <Eye className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Public Transparency Report</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Nothing to hide. Everything published.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Every month we publish exactly what happened on DateInIndia — fake profiles removed, scams caught, messages scanned.
            No spin. No PR fluff. Just numbers.
          </p>
        </div>

        {/* Latest month hero */}
        {latest && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">
                  {new Date(latest.report_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-sm text-green-600 font-medium mt-1">✅ Published &amp; verified</p>
              </div>
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-5 py-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-medium">Fake Profiles</p>
                  <p className="text-2xl font-display font-bold text-green-700">{latest.fake_profiles_removed}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Messages Scanned', value: latest.total_messages_scanned.toLocaleString(), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Scam Accounts Banned', value: latest.scam_accounts_banned, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Harassment Warnings', value: latest.harassment_warnings, icon: Shield, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'New Verified Members', value: latest.aadhaar_verified_count.toLocaleString(), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} rounded-2xl p-4 text-center`}>
                  <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-2`} />
                  <p className={`text-2xl font-display font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-gray-600 mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            {latest.avg_resolution_hours && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>Average report resolution time: <strong className="text-gray-700">{latest.avg_resolution_hours} hours</strong></span>
                <span>New members this month: <strong className="text-gray-700">{latest.new_users?.toLocaleString()}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Our promises */}
        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          {[
            {
              icon: '🔍',
              title: 'Every message scanned',
              desc: 'Our AI reads every message for fraud patterns, harassment, and phone number sharing. Humans review flagged content.',
            },
            {
              icon: '🏛️',
              title: 'Aadhaar-level identity',
              desc: 'We verify identity via DigiLocker — the same system banks use. Fake profiles are structurally impossible at scale.',
            },
            {
              icon: '📊',
              title: 'Published every month',
              desc: 'This report is published on the 1st of every month, no exceptions. Anyone can read it. No login required.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Historical reports */}
        {reports.length > 1 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-8">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-display font-bold text-gray-900">Historical Reports</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Month', 'New Members', 'ID Verified', 'Messages Scanned', 'Fake Profiles', 'Scams Banned'].map(h => (
                      <th key={h} className="text-left py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 font-medium text-gray-900 whitespace-nowrap">
                        {new Date(r.report_month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{r.new_users?.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-gray-600">{r.aadhaar_verified_count?.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-gray-600">{r.total_messages_scanned?.toLocaleString()}</td>
                      <td className={`py-3 pr-4 font-semibold ${r.fake_profiles_removed === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {r.fake_profiles_removed}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{r.scam_accounts_banned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Methodology */}
        <div className="mt-10 bg-gray-900 rounded-3xl p-8 text-white">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-display font-bold">How we generate this report</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 text-sm text-gray-400 leading-relaxed">
            <p>All metrics are pulled directly from our database and moderation logs. Numbers are not manually adjusted. The report generation code is automated and runs at 9 AM on the 1st of every month.</p>
            <p>We define &ldquo;fake profile&rdquo; as any account suspended after a human moderation review confirmed identity fraud. &ldquo;Scam account&rdquo; means accounts where our AI or a user report identified a financial fraud attempt.</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
