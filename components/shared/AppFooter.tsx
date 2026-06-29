import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function AppFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
            <Heart className="w-3 h-3 text-white fill-white" />
          </div>
          <span className="font-semibold text-gray-500">DateInIndia</span>
          <span className="hidden sm:inline">— Real people. Free messaging. Government verified.</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="hover:text-gray-600 transition-colors">About Us</Link>
          <Link href="/safety" className="hover:text-gray-600 transition-colors">Safety</Link>
          <Link href="/trust" className="hover:text-gray-600 transition-colors">Trust &amp; Transparency</Link>
          <Link href="/premium" className="hover:text-gray-600 transition-colors">Pricing</Link>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
          <a href="mailto:support@dateinindia.com" className="hover:text-gray-600 transition-colors">Support</a>
        </nav>
      </div>
    </footer>
  );
}
