import Link from 'next/link';
import { Heart, Shield, AlertTriangle, Phone, MapPin, MessageCircle, CheckCircle } from 'lucide-react';

const TIPS = [
  {
    icon: Shield,
    title: 'Verify before you meet',
    desc: 'Only meet people with at least a Phone Verified badge. Aadhaar Verified profiles are the safest.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: MapPin,
    title: 'Meet in public first',
    desc: 'Always meet for the first time in a busy public place — coffee shop, mall, restaurant. Never at home.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Phone,
    title: 'Tell a friend',
    desc: 'Tell a trusted friend or family member where you are going, who you are meeting, and when to expect you back.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    icon: AlertTriangle,
    title: 'Never send money',
    desc: 'No legitimate match will ever ask you for money, UPI transfers, or cryptocurrency. This is always a scam. Report immediately.',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    icon: MessageCircle,
    title: 'Stay on platform initially',
    desc: 'Keep conversations on DateInIndia for the first 7 days. Our chat safety system protects you from fraud and manipulation.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: CheckCircle,
    title: 'Trust your instincts',
    desc: 'If something feels wrong, it probably is. Block and report any profile that makes you uncomfortable. We review all reports.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
];

const RED_FLAGS = [
  'Asks to move to WhatsApp or Telegram immediately',
  'Asks for money, gift cards, or UPI transfer',
  'Story seems inconsistent or changes often',
  'Profile photo looks like a stock photo or celebrity',
  'Refuses video call before meeting in person',
  'Creates urgency or emotional pressure',
  'Says they are abroad or in the military and needs "help"',
  'Asks for your home address early',
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900">DateInIndia</span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-orange-500">Log In</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">Your safety is our priority</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Safety Tips</h1>
          <p className="text-xl text-gray-500">How to stay safe while finding genuine connections on DateInIndia.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {TIPS.map((tip) => (
            <div key={tip.title} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className={`w-10 h-10 ${tip.bg} rounded-xl flex items-center justify-center mb-4`}>
                <tip.icon className={`w-5 h-5 ${tip.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 mb-10">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-display font-bold text-gray-900">Red Flags to Watch For</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {RED_FLAGS.map((flag) => (
              <div key={flag} className="flex items-start gap-2.5">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-500 text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-gray-700">{flag}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-3xl p-8 text-white text-center">
          <h2 className="text-2xl font-display font-bold mb-3">Seen something suspicious?</h2>
          <p className="text-gray-400 mb-6">Every report is reviewed by a human within 24 hours. If your report is urgent, add details in the &ldquo;Other&rdquo; section.</p>
          <Link href="/browse" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-400 transition-colors">
            Go to Browse → Report a Profile
          </Link>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-800 mb-3">Emergency Resources</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-blue-700">
            <div><strong>Women Helpline:</strong> 1091</div>
            <div><strong>National Emergency:</strong> 112</div>
            <div><strong>Cyber Crime:</strong> cybercrime.gov.in</div>
            <div><strong>iCall (Mental Health):</strong> 9152987821</div>
          </div>
        </div>
      </div>
    </div>
  );
}
