"use client";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

const FEATURES = [
  {
    icon: "👁️",
    title: "See Who Viewed Your Profile",
    desc: "Know exactly who looked at your profile in the last 30 days — names, photos, and when they visited.",
    free: "View count only",
    premium: "Full viewer list",
  },
  {
    icon: "📊",
    title: "Advanced Analytics",
    desc: "Track your profile views day by day over 90 days, see which hashtags bring the most traffic, and watch your growth.",
    free: "14-day view history",
    premium: "90-day history + tag breakdown",
  },
  {
    icon: "⭐",
    title: "Priority in Search & Discover",
    desc: "Your profile floats to the top of search results and the Discover feed when you're active today.",
    free: "Standard placement",
    premium: "Priority placement",
  },
  {
    icon: "✅",
    title: "Verified Badge",
    desc: "A blue checkmark on your profile signals you're a real, committed SpotId member.",
    free: "No badge",
    premium: "Verified ✅",
  },
  {
    icon: "🕶️",
    title: "Browse Anonymously",
    desc: "View other profiles without appearing in their viewer list. Toggle it on or off any time.",
    free: "Always visible to others",
    premium: "Stealth mode available",
  },
  {
    icon: "📸",
    title: "Unlimited Photo Album",
    desc: "Upload as many photos as you want to your permanent profile gallery.",
    free: "Up to 10 photos",
    premium: "Unlimited photos",
  },
];

function UpgradeContent() {
  const { data: session } = useSession();
  const params = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const userId = (session?.user as { id?: string })?.id;

  const success = params.get("success") === "1";
  const cancelled = params.get("cancelled") === "1";

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/profile?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => { if (d.isPremium) setIsPremium(true); })
      .catch(() => {});
  }, [userId]);

  async function handleUpgrade() {
    if (!session) { router.push("/signin?next=/upgrade"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/premium/subscribe", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Unable to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isPremium) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <p className="text-6xl">✅</p>
        <h1 className="text-3xl font-black text-gray-900">You&apos;re SpotId Premium</h1>
        <p className="text-gray-500">All premium features are active on your account.</p>
        <Link href={`/profile/${userId}`}
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition">
          Go to My Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-10">

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-green-800">Welcome to SpotId Premium!</p>
          <p className="text-sm text-green-700 mt-1">Your account is now upgraded. All premium features are live.</p>
        </div>
      )}
      {cancelled && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-center text-gray-500 text-sm">
          No worries — you weren&apos;t charged. You can upgrade any time.
        </div>
      )}

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-1.5 rounded-full">
          <span>✨</span> SpotId Premium
        </div>
        <h1 className="text-4xl font-black text-gray-900 leading-tight">
          Know who&apos;s looking.<br />Be impossible to miss.
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Premium unlocks the full power of SpotId — real-time viewer identity, verified status,
          priority search placement, and more.
        </p>
      </div>

      {/* Pricing card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white text-center shadow-xl">
        <p className="text-indigo-200 text-sm font-semibold uppercase tracking-wider mb-2">Premium Plan</p>
        <div className="flex items-end justify-center gap-1 mb-1">
          <span className="text-6xl font-black">$4</span>
          <span className="text-2xl font-semibold text-indigo-200 mb-3">.99</span>
        </div>
        <p className="text-indigo-200 mb-6">per month · cancel any time</p>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-white text-indigo-700 font-black text-lg py-4 rounded-2xl hover:bg-indigo-50 transition disabled:opacity-60 shadow-lg"
        >
          {loading ? "Opening checkout…" : session ? "Upgrade Now →" : "Sign in to Upgrade →"}
        </button>
        <p className="text-indigo-300 text-xs mt-3">Secure checkout via Stripe · No hidden fees</p>
      </div>

      {/* Feature grid */}
      <div>
        <h2 className="text-xl font-black text-gray-900 mb-5 text-center">Everything you get</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="font-bold text-gray-900">{f.title}</p>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
                  <div className="flex gap-3 mt-3 text-xs">
                    <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Free: {f.free}</span>
                    <span className="bg-indigo-100 text-indigo-700 font-semibold px-2 py-1 rounded-full">Premium: {f.premium}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-black text-gray-900 text-lg">Common questions</h2>
        {[
          {
            q: "Can I cancel any time?",
            a: "Yes. Cancel from Settings → Subscription any time. You keep premium access until the end of the billing period.",
          },
          {
            q: "Is my payment information secure?",
            a: "Payments are handled entirely by Stripe — SpotId never sees or stores your card details.",
          },
          {
            q: "Will people know I'm premium?",
            a: "You'll display a verified ✅ badge, which signals you're a real committed member. Your payment details are private.",
          },
          {
            q: "What happens to my viewer data if I downgrade?",
            a: "Your viewer history is retained for 30 days. If you re-upgrade, it comes back.",
          },
        ].map((item) => (
          <div key={item.q} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
            <p className="font-semibold text-gray-900 text-sm">{item.q}</p>
            <p className="text-sm text-gray-500 mt-1">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="text-center pb-4">
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="bg-indigo-600 text-white font-black text-lg px-10 py-4 rounded-full hover:bg-indigo-700 transition disabled:opacity-60 shadow-lg"
        >
          {loading ? "Opening checkout…" : "Get SpotId Premium →"}
        </button>
        <p className="text-xs text-gray-400 mt-3">$4.99/month · Stripe secure checkout · Cancel any time</p>
      </div>

    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradeContent />
    </Suspense>
  );
}
