import Link from "next/link";
import { Brand } from "@/components/Brand";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-bold text-indigo-600"><Brand /></p>
            <p className="text-xs text-gray-400 mt-0.5">
              Tag yourself. Get spotted.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-gray-400">
            <Link href="/terms" className="hover:text-indigo-600 transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-indigo-600 transition">Privacy Policy</Link>
            <Link href="/guidelines" className="hover:text-indigo-600 transition">Community Guidelines</Link>
            <Link href="/dmca" className="hover:text-indigo-600 transition">DMCA</Link>
            <Link href="/search" className="hover:text-indigo-600 transition">Search</Link>
            <Link href="/discover" className="hover:text-indigo-600 transition">Discover</Link>
            <Link href="/browse" className="hover:text-indigo-600 transition">Browse</Link>
            <Link href="/trending" className="hover:text-indigo-600 transition">Trending</Link>
            <Link href="/leaderboard" className="hover:text-indigo-600 transition">Leaderboard</Link>
            <Link href="/antiques" className="hover:text-indigo-600 transition">Antiques &amp; Vintage</Link>
            <Link href="/freelancers" className="hover:text-indigo-600 transition">For Freelancers</Link>
            <Link href="/events" className="hover:text-indigo-600 transition">Events &amp; Networking</Link>
            <Link href="/help" className="hover:text-indigo-600 transition">Help &amp; FAQ</Link>
            <Link href="/about" className="hover:text-indigo-600 transition">About</Link>
          </div>
        </div>

        {/* Safety disclaimer */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          <p className="text-xs text-gray-400 leading-relaxed text-center max-w-3xl mx-auto">
            <strong className="text-gray-500">Safety Notice:</strong> All information on SpotId is
            voluntarily published by users. SpotId does not track locations or collect data you have
            not chosen to share. Discovering someone on SpotId does not grant any right to contact
            or approach them. SpotId is not responsible for in-person interactions between users.
            If you feel unsafe, use the block and report tools on any profile, or contact law enforcement.
            SpotId is for users 18 and older only.
          </p>
        </div>

        <p className="text-center text-xs text-gray-300 mt-4">
          © {new Date().getFullYear()} <Brand />. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
