import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Get Discovered as a Freelancer by Hashtag — SpotId",
  description:
    "List your skills and services on SpotId. Clients search by hashtag and find you directly — no algorithm, no bidding, no monthly fees. Be available when people are searching right now.",
  keywords: ["freelancer directory", "find freelancers by skill", "hashtag freelance", "freelance marketplace", "get found as freelancer", "list services free"],
  openGraph: {
    title: "Get Discovered as a Freelancer by Hashtag — SpotId",
    description: "Clients search hashtags and find you. No algorithms. No bidding. No monthly fees.",
    type: "website",
    siteName: "SpotId",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Discovered as a Freelancer by Hashtag — SpotId",
    description: "List your skills on SpotId. Clients find you by hashtag — no bidding, no fees.",
  },
  alternates: { canonical: "https://www.spotidapp.com/freelancers" },
};

const PROFESSIONS = [
  { icon: "🎨", name: "Designer", tags: ["graphicDesign", "logoDesign", "branding", "Figma", "illustrator"] },
  { icon: "💻", name: "Developer", tags: ["webDev", "React", "NextJS", "mobile", "fullStack"] },
  { icon: "📷", name: "Photographer", tags: ["photography", "portraits", "events", "commercial", "Dallas"] },
  { icon: "✍️", name: "Writer", tags: ["copywriting", "contentWriter", "SEO", "ghostwriting", "technical"] },
  { icon: "🎬", name: "Video Editor", tags: ["videoEditing", "motionGraphics", "YouTube", "reels", "premiere"] },
  { icon: "🔨", name: "Contractor", tags: ["plumber", "electrician", "Austin", "licenced", "available"] },
];

export default function FreelancersPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-14">

      {/* Hero */}
      <div className="text-center space-y-5">
        <div className="inline-block bg-emerald-100 text-emerald-800 text-sm font-semibold px-4 py-1.5 rounded-full">
          For Freelancers & Service Providers
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
          Clients are searching<br />
          <span className="text-emerald-600">for your exact skills.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          SpotId is a hashtag-powered directory for professionals. List your services once,
          tag what you do, and let clients who are searching right now find you directly.
          No algorithm. No bidding. No monthly fee.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/signup"
            className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold text-base hover:bg-emerald-700 transition shadow-sm"
          >
            List My Services Free →
          </Link>
          <Link
            href="/browse?type=work"
            className="bg-white text-gray-700 border-2 border-gray-200 px-8 py-3 rounded-full font-bold text-base hover:border-emerald-400 transition"
          >
            See Who&apos;s Listed
          </Link>
        </div>
      </div>

      {/* The problem it solves */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 space-y-3">
          <p className="text-xl font-bold text-red-700">The old way</p>
          <ul className="space-y-2">
            {[
              "Pay to be seen on Upwork or Fiverr",
              "Bid against 50 other freelancers",
              "Algorithm decides who gets shown",
              "Platform takes 20% of every job",
              "Monthly subscription just to apply",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-red-700">
                <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-3">
          <p className="text-xl font-bold text-emerald-700">The SpotId way</p>
          <ul className="space-y-2">
            {[
              "List your services for free — forever",
              "Clients search your exact skills by hashtag",
              "No bidding — they come to you directly",
              "No platform fees on transactions",
              "Tag your daily availability to stay active",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-emerald-700">
                <span className="text-emerald-600 mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Professions showcase */}
      <div className="space-y-5">
        <h2 className="text-2xl font-bold text-gray-900">Every skill is searchable</h2>
        <p className="text-gray-500 text-sm">Clients search by skill, location, stack, or specialty. Here&apos;s how different professions tag themselves.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {PROFESSIONS.map((p) => (
            <Link
              key={p.name}
              href={`/search?q=${p.tags.map((t) => `%23${t}`).join("+")}`}
              className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-emerald-300 hover:shadow-md transition group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{p.icon}</span>
                <p className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition">{p.name}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((tag) => (
                  <span key={tag} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium group-hover:bg-emerald-100 transition">
                    #{tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Daily availability */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-8 space-y-5">
        <div className="flex items-start gap-4">
          <span className="text-4xl flex-shrink-0">📅</span>
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Tag your availability daily</h2>
            <p className="text-gray-600 leading-relaxed">
              SpotId&apos;s Daily Profile lets you signal your current availability in real time. A client searching
              for a plumber in Austin today sees people who tagged <span className="font-semibold text-indigo-600">#plumber #Austin #available</span> today —
              not people who listed availability six months ago.
            </p>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Example daily tag</p>
              <div className="flex flex-wrap gap-1.5">
                {["available", "Austin", "plumber", "sameDay", "licenced", "residential"].map((t) => (
                  <span key={t} className="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-full font-medium">#{t}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Anyone searching any of these tags today finds your profile instantly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How to get started */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Get started in 5 minutes</h2>
        <div className="space-y-4">
          {[
            { step: "1", title: "Create your free account", desc: "Name, email, password. No credit card. Takes 60 seconds." },
            { step: "2", title: "Set up your Work listing", desc: "Describe your service in detail and add every hashtag a client might search: skills, location, tools, specialty." },
            { step: "3", title: "Complete your profile", desc: "Add a photo, bio, occupation, and location so clients know who they're contacting." },
            { step: "4", title: "Tag your availability daily", desc: "Each morning, add a Daily Profile with your availability tags. Clients searching today see you today." },
          ].map((s) => (
            <div key={s.step} className="flex gap-4">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-700 font-bold text-sm rounded-full flex items-center justify-center flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{s.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/signup"
          className="inline-block bg-emerald-600 text-white font-bold px-8 py-3 rounded-full hover:bg-emerald-700 transition text-sm"
        >
          Create My Free Listing →
        </Link>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-8 text-white text-center space-y-5">
        <h2 className="text-2xl font-black">Clients are searching right now.</h2>
        <p className="text-emerald-200 max-w-lg mx-auto text-sm leading-relaxed">
          List your services on SpotId for free. Be the first in your area and specialty —
          early members get significantly more visibility as the platform grows.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/signup"
            className="bg-white text-emerald-700 font-bold px-8 py-3 rounded-full hover:bg-emerald-50 transition text-sm shadow-sm"
          >
            List My Services Free →
          </Link>
          <Link
            href="/search?q=%23freelance"
            className="bg-emerald-500 text-white font-semibold px-8 py-3 rounded-full hover:bg-emerald-400 transition text-sm"
          >
            Browse Freelancers
          </Link>
        </div>
      </div>

    </div>
  );
}
