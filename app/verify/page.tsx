'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Shield, CheckCircle, XCircle, Phone, Camera,
  ArrowRight, Video, VideoOff, RefreshCw, AlertCircle, X,
} from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@/lib/auth-context';

// Read the session JWT from localStorage (set by auth-context on sign-in)
function getSessionToken(): string | null {
  try {
    const raw = localStorage.getItem('dateinindia_session');
    if (!raw) return null;
    return JSON.parse(raw)?.access_token ?? null;
  } catch {
    return null;
  }
}

function edgeFunctionUrl(name: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`;
}

// ── Aadhaar Consent Modal ──────────────────────────────────────────────────

interface ConsentModalProps {
  onAccept: () => void;
  onClose: () => void;
}

function AadhaarConsentModal({ onAccept, onClose }: ConsentModalProps) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-5">
          <Shield className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Aadhaar Consent Required</h2>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          We use UIDAI&apos;s OKYC service to verify your identity. Before proceeding, please understand:
        </p>
        <ul className="space-y-3 mb-6">
          {[
            'Your Aadhaar number will be sent to UIDAI for identity verification only.',
            'We will never store your Aadhaar number — only the pass/fail result.',
            'An OTP will be sent to the mobile number linked to your Aadhaar.',
            'This data is handled under India\'s DPDP Act 2023.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I voluntarily consent to Aadhaar-based identity verification and understand the above terms.
          </span>
        </label>
        <div className="flex gap-3">
          <a
            href="/privacy#aadhaar-verification"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-5 py-3 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
          >
            Learn More
          </a>
          <button
            onClick={onAccept}
            disabled={!agreed}
            className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            I Consent — Proceed
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Selfie Panel ───────────────────────────────────────────────────────────

function SelfiePanel({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStreamRef(stream);
      setCameraActive(true);
    } catch {
      setError('Camera access denied. Please allow camera access in your browser settings.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef?.getTracks().forEach(t => t.stop());
    setStreamRef(null);
    setCameraActive(false);
  }, [streamRef]);

  const captureAndVerify = useCallback(async () => {
    if (!videoRef.current || !cameraActive) return;
    setError('');
    setLoading(true);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];

    stopCamera();

    try {
      const token = getSessionToken();
      const res = await fetch(edgeFunctionUrl('verify-selfie'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, image_base64: imageBase64 }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Selfie verification failed. Please try again.');
        return;
      }

      onSuccess();
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [cameraActive, userId, stopCamera, onSuccess]);

  return (
    <div className="mt-4 space-y-3">
      {!cameraActive && !loading && (
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
        >
          <Video className="w-4 h-4" />
          Open Camera
        </button>
      )}

      {cameraActive && (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-w-sm">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute inset-0 border-4 border-dashed border-white/30 rounded-2xl pointer-events-none" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={captureAndVerify}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-semibold text-sm rounded-xl hover:bg-orange-600 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Capture &amp; Verify
            </button>
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <VideoOff className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
          Checking liveness — this takes a few seconds...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  );
}

// ── Aadhaar Panel ──────────────────────────────────────────────────────────

function AadhaarPanel({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devMode, setDevMode] = useState(false);

  const digits = aadhaar.replace(/\D/g, '');

  // Format as XXXX XXXX XXXX while typing
  const formatAadhaar = (val: string) => {
    const d = val.replace(/\D/g, '').slice(0, 12);
    return d.replace(/(\d{4})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(' ')
    );
  };

  async function initiateOkyc() {
    setError('');
    if (digits.length !== 12) {
      setError('Enter a valid 12-digit Aadhaar number.');
      return;
    }
    setLoading(true);
    try {
      const token = getSessionToken();
      const res = await fetch(edgeFunctionUrl('verify-aadhaar'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'initiate', user_id: userId, aadhaar_number: digits, consent: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to initiate verification. Please try again.');
        return;
      }
      setTransactionId(data.transaction_id);
      setDevMode(data.dev_mode ?? false);
      setStep('otp');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError('');
    if (otp.length < 4) {
      setError('Enter the OTP sent to your Aadhaar-linked mobile.');
      return;
    }
    setLoading(true);
    try {
      const token = getSessionToken();
      const res = await fetch(edgeFunctionUrl('verify-aadhaar'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'verify-otp', user_id: userId, transaction_id: transactionId, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Invalid OTP. Please try again.');
        return;
      }
      onSuccess();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'otp') {
    return (
      <div className="mt-4 space-y-3 max-w-sm">
        {devMode && (
          <div className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg font-medium">
            Dev mode — use OTP: <strong>000000</strong>
          </div>
        )}
        <p className="text-sm text-gray-600">
          An OTP has been sent to the mobile number linked to your Aadhaar. Enter it below.
        </p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit OTP"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base tracking-widest font-mono text-center focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
        <div className="flex gap-2">
          <button
            onClick={verifyOtp}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white font-semibold text-sm rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Verifying...' : 'Confirm OTP'}
          </button>
          <button
            onClick={() => { setStep('form'); setOtp(''); setError(''); }}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        </div>
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 max-w-sm">
      <input
        type="text"
        inputMode="numeric"
        value={aadhaar}
        onChange={e => setAadhaar(formatAadhaar(e.target.value))}
        placeholder="XXXX XXXX XXXX"
        maxLength={14}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base tracking-widest font-mono text-center focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
      <button
        onClick={initiateOkyc}
        disabled={loading || digits.length !== 12}
        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-semibold text-sm rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        {loading ? 'Sending OTP...' : 'Send OTP to Aadhaar Mobile'}
      </button>
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function VerifyPage() {
  const { user, refreshUser, db } = useAuth();

  const [activePanels, setActivePanels] = useState<Record<string, boolean>>({});
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => { document.title = 'Get Verified | DateInIndia'; }, []);

  function togglePanel(key: string) {
    if (key === 'aadhaar' && !activePanels[key]) {
      setShowConsentModal(true);
      return;
    }
    setActivePanels(p => ({ ...p, [key]: !p[key] }));
  }

  async function handleAadhaarConsent() {
    setShowConsentModal(false);
    // Log consent to DB (fire-and-forget — non-blocking)
    if (user) {
      db.from('consents').insert({
        user_id: user.id,
        consent_type: 'aadhaar_okyc',
        user_agent: navigator.userAgent,
      }).then(() => {});
    }
    setActivePanels(p => ({ ...p, aadhaar: true }));
  }

  async function handleVerificationSuccess(key: string) {
    setActivePanels(p => ({ ...p, [key]: false }));
    await refreshUser();
  }

  const trustScore = user?.trust_score ?? 0;

  const CHECKS = [
    {
      key: 'phone',
      label: 'Phone Verified',
      desc: 'Your mobile number has been verified via OTP.',
      points: '+10 points',
      verified: user?.phone_verified,
      icon: Phone,
      badge: '📱',
      panel: null,
      free: true,
    },
    {
      key: 'aadhaar',
      label: 'Aadhaar Verified',
      desc: 'Verify your identity via UIDAI OKYC. An OTP will be sent to your Aadhaar-linked mobile. Your Aadhaar number is never stored.',
      points: '+30 points',
      verified: user?.aadhaar_verified,
      icon: Shield,
      badge: '🏛️',
      panel: (uid: string) => (
        <AadhaarPanel userId={uid} onSuccess={() => handleVerificationSuccess('aadhaar')} />
      ),
      free: true,
    },
    {
      key: 'selfie',
      label: 'Selfie / Photo Verified',
      desc: 'Take a quick liveness selfie to prove you\'re a real person. Your photo is checked then immediately discarded.',
      points: '+15 points',
      verified: user?.selfie_verified,
      icon: Camera,
      badge: '🤳',
      panel: (uid: string) => (
        <SelfiePanel userId={uid} onSuccess={() => handleVerificationSuccess('selfie')} />
      ),
      free: true,
    },
  ];

  return (
    <AuthGuard>
      {showConsentModal && (
        <AadhaarConsentModal
          onAccept={handleAadhaarConsent}
          onClose={() => setShowConsentModal(false)}
        />
      )}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-3">Verification Hub</h1>
          <p className="text-gray-500">
            Verified profiles get 5x more messages. Build your Trust Score and stand out.
          </p>
        </div>

        {/* Trust Score */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-gray-900">Your Trust Score</h2>
            <span className={`text-3xl font-display font-bold ${trustScore >= 71 ? 'text-green-600' : trustScore >= 41 ? 'text-yellow-600' : 'text-red-600'}`}>
              {trustScore}/100
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ${trustScore >= 71 ? 'bg-green-500' : trustScore >= 41 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${trustScore}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            {trustScore >= 71
              ? 'Excellent! Your profile is highly trusted.'
              : trustScore >= 41
              ? 'Good start. Complete verifications to rank higher.'
              : 'Complete your profile and verifications to build trust.'}
          </p>
        </div>

        {/* Verification steps */}
        <div className="space-y-4">
          {CHECKS.map((check) => (
            <div
              key={check.key}
              className={`bg-white rounded-2xl border p-6 shadow-sm transition-colors ${check.verified ? 'border-green-200' : 'border-gray-100'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${check.verified ? 'bg-green-50' : 'bg-gray-50'}`}>
                  {check.badge}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{check.label}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${check.verified ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600'}`}>
                      {check.points}
                    </span>
                    {check.verified && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    )}
                    {check.free && !check.verified && (
                      <span className="text-xs font-bold text-green-600">Free</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{check.desc}</p>

                  {/* Expandable verification panel */}
                  {!check.verified && check.panel && user && (
                    <>
                      {activePanels[check.key] ? (
                        check.panel(user.id)
                      ) : (
                        <button
                          onClick={() => togglePanel(check.key)}
                          className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-semibold text-sm rounded-xl hover:bg-orange-600 transition-all"
                        >
                          Verify Now
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {check.verified && (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Privacy notice */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h3 className="font-semibold text-blue-800 mb-2 text-sm">Your privacy is protected</h3>
          <ul className="text-sm text-blue-700 space-y-1.5">
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              We never store your Aadhaar number — only the verification result.
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              Your selfie is checked for liveness and immediately discarded.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              Compliant with India&apos;s DPDP Act 2023.
            </li>
          </ul>
        </div>
      </div>
    </AuthGuard>
  );
}
