import type { Metadata } from 'next';
import Link from 'next/link';
import AppFooter from '@/components/shared/AppFooter';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'DateInIndia Terms of Service. Rules of use, eligibility, prohibited conduct, payments, and dispute resolution.',
};

const LAST_UPDATED = 'June 25, 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-orange-500 font-bold text-lg">DateInIndia</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 text-sm">Terms of Service</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: {LAST_UPDATED}</p>

        <Section title="1. Acceptance of Terms">
          <p>
            By creating an account or using DateInIndia ("Service", "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.
          </p>
          <p>
            These Terms form a binding legal agreement between you and DateInIndia. We may update these Terms — continued use after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <ul>
            <li>You must be at least <strong>18 years of age</strong> to use DateInIndia.</li>
            <li>You must be a resident of India or a person connecting with residents of India.</li>
            <li>You must not have been previously banned from the Service.</li>
            <li>You must have the legal capacity to enter into a binding agreement.</li>
          </ul>
          <p>
            By registering, you confirm that all information you provide is accurate and that you meet the eligibility requirements.
          </p>
        </Section>

        <Section title="3. Account and Security">
          <ul>
            <li>One account per person. Multiple accounts are prohibited.</li>
            <li>You are responsible for all activity on your account.</li>
            <li>You must not share your account credentials or let others access your account.</li>
            <li>Notify us immediately at support@dateinindia.com if you suspect unauthorized access.</li>
            <li>We reserve the right to suspend or delete accounts that violate these Terms.</li>
          </ul>
        </Section>

        <Section title="4. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul>
            <li>Create a false identity, impersonate any person, or misrepresent your identity.</li>
            <li>Post or share content that is illegal, obscene, abusive, harassing, defamatory, or threatening.</li>
            <li>Share explicit or sexually suggestive photos of other people without their consent.</li>
            <li>Solicit money, financial assistance, or gifts from other members.</li>
            <li>Promote commercial services, spam, or advertise products.</li>
            <li>Harass, stalk, intimidate, or threaten other users.</li>
            <li>Use the platform for any illegal purpose, including prostitution, trafficking, or fraud.</li>
            <li>Collect or harvest personal data of other users without consent.</li>
            <li>Attempt to reverse-engineer, scrape, or hack the Service.</li>
            <li>Use automated bots, scripts, or tools to interact with the platform.</li>
          </ul>
          <p>
            Violations may result in immediate account suspension and, where required by law, reporting to law enforcement authorities.
          </p>
        </Section>

        <Section title="5. User Content">
          <p>
            You retain ownership of content you post (photos, messages, bio). By posting, you grant DateInIndia a limited, non-exclusive, royalty-free license to display your content to other users as part of the Service.
          </p>
          <p>
            You represent that you own or have the right to share all content you post, and that it does not infringe any third-party rights.
          </p>
          <p>
            We reserve the right to remove any content that violates these Terms or our community guidelines.
          </p>
        </Section>

        <Section title="6. Messaging and Communication">
          <ul>
            <li>Messaging between matched users is free and always will be.</li>
            <li>Phone numbers, social media handles, and external contact details are blocked for the first 7 days after a match for your safety.</li>
            <li>Messages are monitored by automated systems for safety violations. Human review may occur in response to reports.</li>
            <li>Do not share personal financial information (bank details, UPI IDs) in messages. We are not responsible for any financial loss resulting from conversations on the platform.</li>
          </ul>
        </Section>

        <Section title="7. Premium Subscriptions and Payments">
          <ul>
            <li>Premium subscriptions are billed on a weekly or monthly basis as selected at purchase.</li>
            <li>All payments are processed by Razorpay. Prices are in INR and include 18% GST.</li>
            <li>Subscriptions do not auto-renew unless you explicitly enable auto-renewal.</li>
            <li><strong>Refund policy:</strong> Subscriptions are non-refundable once the billing period has started, except where required by applicable consumer protection law. Contact support@dateinindia.com for refund disputes.</li>
            <li>We reserve the right to change pricing with 14 days' notice to existing subscribers.</li>
          </ul>
        </Section>

        <Section title="8. Verification and Trust Score">
          <p>
            Verification badges (Aadhaar, Phone, Selfie) indicate that the user has completed the respective verification step at the time of verification. They do not constitute an endorsement of the user's character, intentions, or honesty. You remain responsible for exercising your own judgment when interacting with other members.
          </p>
        </Section>

        <Section title="9. Safety">
          <p>
            DateInIndia takes user safety seriously. However, we cannot guarantee the conduct of users. You are responsible for your own safety when interacting with other members, especially when meeting in person. Always meet in public places and inform someone you trust.
          </p>
          <p>
            Report suspicious or abusive behavior using the in-app report feature or email safety@dateinindia.com.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            You may delete your account at any time from your profile settings. Upon deletion, your profile and data will be removed within 30 days.
          </p>
          <p>
            We may suspend or permanently ban your account if you violate these Terms, without notice or liability.
          </p>
        </Section>

        <Section title="11. Disclaimers">
          <p>
            The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or that any particular match will result from using the platform. Romantic outcomes are not guaranteed.
          </p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, DateInIndia shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including but not limited to loss of data, loss of revenue, or emotional distress.
          </p>
          <p>
            Our total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim, or ₹1,000 — whichever is greater.
          </p>
        </Section>

        <Section title="13. Governing Law and Dispute Resolution">
          <p>
            These Terms are governed by the laws of India. Any disputes shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration in Mumbai, India, under the Arbitration and Conciliation Act, 1996.
          </p>
          <p>
            Consumer disputes may also be raised with the appropriate Consumer Disputes Redressal Commission as per the Consumer Protection Act, 2019.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            For any questions about these Terms, contact: <strong>legal@dateinindia.com</strong>
          </p>
          <p>
            Registered address: DateInIndia, India.
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-500">
          Questions? Email <a href="mailto:legal@dateinindia.com" className="text-orange-500 hover:underline">legal@dateinindia.com</a>
          {' · '}
          <Link href="/privacy" className="text-orange-500 hover:underline">Privacy Policy</Link>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-600 space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
