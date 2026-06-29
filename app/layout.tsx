import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationBootstrap } from '@/components/shared/NotificationBootstrap';
import ClientShell from '@/components/shared/ClientShell';

export const metadata: Metadata = {
  title: {
    default: 'DateInIndia — Real People. Free Messaging. Government Verified.',
    template: '%s | DateInIndia',
  },
  description: "India's first government-verified dating website. Aadhaar-verified profiles, free messaging forever, zero fake profiles. Meet real people near you.",
  keywords: ['dating india', 'indian dating app', 'aadhaar verified dating', 'dating website india', 'meet indians'],
  metadataBase: new URL('https://dateinindia.com'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://dateinindia.com',
    siteName: 'DateInIndia',
    title: 'DateInIndia — Real People. Free Messaging. Government Verified.',
    description: "India's first government-verified dating website. Aadhaar-verified profiles, free messaging forever, zero fake profiles.",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'DateInIndia' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DateInIndia — Real People. Free Messaging. Government Verified.',
    description: "India's first government-verified dating website.",
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ClientShell>
            <NotificationBootstrap />
            {children}
          </ClientShell>
        </AuthProvider>
      </body>
    </html>
  );
}
