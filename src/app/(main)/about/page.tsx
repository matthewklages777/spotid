import Link from "next/link";
import type { Metadata } from "next";
import { Brand } from "@/components/Brand";

export const metadata: Metadata = {
  title: "About SpotId",
  description: "SpotId is a voluntary hashtag-based discovery platform for people, antiques, collectibles, and services.",
  openGraph: {
    title: "About SpotId",
    description: "Tag yourself. Get spotted.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-12">

      {/* Hero */}
      <div className="text-center space-y-4">
        <p className="text-5xl">🏷️</p>
        <h1 className="text-4xl font-black text-gray-900">About <Brand /></h1>
        <p className="text-xl text-gray-500 leading-relaxed max-w-xl mx-auto">
          Tag yourself with hashtags and let the world find you — people, antiques, collectibles, and services, all searchable in real time.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-8 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
        <p className="text-gray-700 leading-relaxed">
          The internet is full of platforms that track you, sell your data, and show you what their algorithms
          decide you should see. SpotId takes a different approach: <strong>you decide what the world sees,
          and searching is direct, not filtered through a recommendation engine.</strong>
        </p>
        <p className="text-gray-700 leading-relaxed">
          Every hashtag on SpotId was put there intentionally, by the person it belongs to. There are no
          scraped profiles, no third-party data brokers, no ad targeting. Just people saying
          &ldquo;I&apos;m here, I&apos;m doing this, find me if you want.&rdquo;
        </p>
      </div>

      {/* How it works */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            {
              emoji: "📅",
              title: "Daily Profile",
              desc: "Each day, you tag yourself. What are you into today? Where are you? What are you looking for? Post your hashtags and be discoverable — just for today.",
            },
            {
              emoji: "🔍",
              title: "Real-Time Search",
              desc: "Search any hashtag to see who tagged it today. #vintage, #dallas, #plumber, #INFP — find people and items by what they actually are, not what an algorithm thinks they are.",
            },
            {
              emoji: "🛍️",
              title: "Closet & Work",
              desc: "List items for sale or services you offer — all tagged and searchable. Buyers find you by hashtag, not by scrolling through a feed.",
            },
            {
              emoji: "🔒",
              title: "You're in Control",
              desc: "Don't feel like being found today? Simply don't post a daily profile. Your information goes only as far as you put it, and you can delete everything instantly.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-2">
              <p className="text-3xl">{item.emoji}</p>
              <h3 className="font-bold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Our Values</h2>
        <div className="space-y-3">
          {[
            { icon: "🤝", label: "Voluntary Only", text: "Every piece of information on SpotId was put there by the person it belongs to. We don't scrape, infer, or aggregate from outside sources." },
            { icon: "🔒", label: "Privacy First", text: "Your email, phone, and password are never visible to other users. Location and contact info are yours to share — or not." },
            { icon: "🚫", label: "Safety Enforced", text: "Finding someone on SpotId doesn't grant any right to contact or approach them. Harassment gets you permanently banned and reported to law enforcement." },
            { icon: "📋", label: "Legal Compliance", text: "We operate under Section 230, maintain a DMCA agent, and cooperate fully with law enforcement. Our legal pages are written in plain English." },
            { icon: "💾", label: "Your Data is Yours", text: "Download a full copy of everything we hold about you at any time. Delete your account in seconds and it's gone — permanently." },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="font-semibold text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Built for */}
      <div className="bg-gray-900 rounded-2xl p-8 text-white space-y-4">
        <h2 className="text-2xl font-bold">Who Is <Brand /> Built For?</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { emoji: "🎨", label: "Individuals", desc: "People who want to be found by what they're doing today — events, hobbies, moods, interests." },
            { emoji: "🛍️", label: "Sellers & Collectors", desc: "Antique dealers, resellers, and collectors who want buyers to find items by hashtag, not algorithm." },
            { emoji: "💼", label: "Service Providers", desc: "Freelancers, tradespeople, and professionals who want to be found by what they do — not where they pay to advertise." },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 rounded-xl p-4 space-y-2">
              <p className="text-2xl">{item.emoji}</p>
              <p className="font-semibold">{item.label}</p>
              <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Premium */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white text-center space-y-4">
        <p className="text-4xl">✨</p>
        <h2 className="text-2xl font-bold">Go Further with <Brand /> Premium</h2>
        <p className="text-indigo-200 max-w-lg mx-auto text-sm leading-relaxed">
          For $4.99/month, unlock viewer identity (see exactly who visited your profile),
          90-day analytics, priority placement in search and discover, a verified ✅ badge,
          anonymous browsing, and unlimited photo uploads.
        </p>
        <Link
          href="/upgrade"
          className="inline-block bg-white text-indigo-700 font-bold px-8 py-3 rounded-full hover:bg-indigo-50 transition text-sm"
        >
          See Premium Features →
        </Link>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4 py-4">
        <h2 className="text-2xl font-bold text-gray-900">Ready to be found?</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Create your free account and post your first daily profile. It takes less than two minutes.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/signup"
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-sm"
          >
            Join <Brand /> — Free
          </Link>
          <Link
            href="/search"
            className="bg-white text-gray-700 border border-gray-200 px-8 py-3 rounded-xl font-bold hover:border-indigo-400 transition text-sm"
          >
            Browse the Directory
          </Link>
        </div>
        <div className="flex gap-4 justify-center text-sm text-gray-500 pt-2 flex-wrap">
          <Link href="/help" className="hover:text-indigo-600 transition">Help &amp; FAQ</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-indigo-600 transition">Terms of Service</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-indigo-600 transition">Privacy Policy</Link>
          <span>·</span>
          <Link href="/guidelines" className="hover:text-indigo-600 transition">Community Guidelines</Link>
        </div>
      </div>

    </div>
  );
}
