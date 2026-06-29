import type { Metadata } from 'next';
import Link from 'next/link';
import AppFooter from '@/components/shared/AppFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How DateInIndia collects, uses, and protects your personal data. Compliant with India\'s DPDP Act 2023.',
};

const LAST_UPDATED = 'June 25, 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-orange-500 font-bold text-lg">DateInIndia</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 text-sm">Privacy Policy</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 prose prose-gray prose-sm sm:prose-base max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: {LAST_UPDATED}</p>

        <Section title="1. Who We Are">
          <p>
            DateInIndia ("we", "us", "our") is a relationship platform connecting adults in India. We are committed to protecting your personal data in accordance with India's <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and applicable rules.
          </p>
          <p>
            For any privacy-related queries, contact us at: <strong>privacy@dateinindia.com</strong>
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li><strong>Phone number</strong> — Required for OTP-based sign-in and identity verification.</li>
            <li><strong>Profile information</strong> — Name, date of birth, city, gender, religion, occupation, bio, and preferences.</li>
            <li><strong>Photos</strong> — Profile photos you upload. These are stored securely and only displayed to other members.</li>
            <li><strong>Messages</strong> — Content of messages you send to other members via our platform.</li>
            <li><strong>Aadhaar number (temporary)</strong> — Used exclusively for identity verification via UIDAI's OKYC service. <strong>Your Aadhaar number is never stored</strong> — only the verification result (pass/fail) is retained.</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <ul>
            <li><strong>Device and browser data</strong> — User agent, IP address (for fraud prevention only).</li>
            <li><strong>Usage data</strong> — Pages visited, likes sent, matches created, last active timestamp.</li>
            <li><strong>Location (approximate)</strong> — City-level location from your profile. We do not track precise GPS location.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul>
            <li>To provide, maintain, and improve the DateInIndia platform.</li>
            <li>To verify your identity and prevent fake profiles.</li>
            <li>To show your profile to potential matches based on preferences.</li>
            <li>To deliver messages between matched users.</li>
            <li>To send service-related communications (OTPs, match notifications).</li>
            <li>To enforce our community guidelines and safety policies.</li>
            <li>To comply with legal obligations under Indian law.</li>
          </ul>
          <p>We do <strong>not</strong> sell your personal data to third parties. We do <strong>not</strong> use your data for profiling or advertising outside our platform.</p>
        </Section>

        <Section title="4. Aadhaar and Government ID Data" id="aadhaar-verification">
          <p>
            Aadhaar verification is processed via UIDAI's official OKYC API. When you choose to verify:
          </p>
          <ul>
            <li>Your Aadhaar number is transmitted directly and securely to UIDAI. It is <strong>never stored in our database.</strong></li>
            <li>We record only the outcome: verified or not verified.</li>
            <li>Your consent is obtained and logged before any verification attempt, as required under the DPDP Act 2023.</li>
            <li>You may request deletion of your verification record at any time by contacting us.</li>
          </ul>
        </Section>

        <Section title="5. Photos and Selfies">
          <ul>
            <li><strong>Profile photos</strong> are stored in our secure cloud storage and displayed to members.</li>
            <li><strong>Selfies for liveness checks</strong> are used only to confirm you're a real person. They are discarded immediately after the check is complete and are never stored.</li>
            <li>You can delete your photos at any time from your profile settings.</li>
          </ul>
        </Section>

        <Section title="6. Consent and Your Rights (DPDP Act 2023)">
          <p>Under the Digital Personal Data Protection Act, 2023, you have the right to:</p>
          <ul>
            <li><strong>Access</strong> — Request a copy of personal data we hold about you.</li>
            <li><strong>Correction</strong> — Request correction of inaccurate data.</li>
            <li><strong>Erasure</strong> — Request deletion of your account and all associated data.</li>
            <li><strong>Withdraw consent</strong> — Withdraw consent for any processing we rely on consent for.</li>
            <li><strong>Grievance redressal</strong> — Lodge a complaint with our Data Protection Officer at <strong>dpo@dateinindia.com</strong>.</li>
          </ul>
          <p>To exercise any of these rights, email us at privacy@dateinindia.com. We will respond within 30 days.</p>
        </Section>

        <Section title="7. Data Retention">
          <ul>
            <li>Active accounts: We retain your data as long as your account is active.</li>
            <li>Deleted accounts: All personal data is purged within 30 days of account deletion, except where retention is required by law.</li>
            <li>Messages: Deleted within 30 days of account deletion.</li>
          </ul>
        </Section>

        <Section title="8. Data Security">
          <p>
            We protect your data using industry-standard safeguards: TLS encryption in transit, encrypted storage at rest, row-level security on all database tables, and strict access controls. Access to personal data is limited to staff who need it to operate the service.
          </p>
          <p>
            In the event of a data breach affecting your rights, we will notify you and the relevant authorities as required by law.
          </p>
        </Section>

        <Section title="9. Third-Party Services">
          <p>We use the following third-party services, each with their own privacy policies:</p>
          <ul>
            <li><strong>Supabase</strong> — Database and authentication infrastructure.</li>
            <li><strong>UIDAI OKYC</strong> — Aadhaar identity verification.</li>
            <li><strong>Razorpay</strong> — Payment processing. We never receive or store your card details.</li>
          </ul>
        </Section>

        <Section title="10. Cookies">
          <p>
            We use only essential session cookies required for login and security. We do not use tracking cookies or third-party advertising cookies.
          </p>
        </Section>

        <Section title="11. Children's Privacy">
          <p>
            DateInIndia is strictly for adults aged 18 and above. We do not knowingly collect data from anyone under 18. If we discover a minor has registered, we will immediately delete the account.
          </p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>
            We may update this policy as our practices evolve or to comply with legal changes. We will notify you of material changes via in-app notice or email at least 14 days in advance.
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-500">
          Questions? Email <a href="mailto:privacy@dateinindia.com" className="text-orange-500 hover:underline">privacy@dateinindia.com</a>
          {' · '}
          <Link href="/terms" className="text-orange-500 hover:underline">Terms of Service</Link>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-600 space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:mt-4 [&_h3]:mb-2">
        {children}
      </div>
    </section>
  );
}
