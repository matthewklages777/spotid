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
  const [polling, setPolling] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const userId = (session?.user as { id?: string })?.id;

  const success = params.get("success") === "1";
  const cancelled = params.get("cancelled") === "1";

  useEffect(() => {
    if (!userId) return;

    async function checkPremium(): Promise<boolean> {
      const res = await fetch(`/api/profile?userId=${userId}`).catch(() => null);
      if (!res?.ok) return false;
      const d = await res.json().catch(() => ({}));
      return !!d.isPremium;
    }

    if (success) {
      // Poll up to 8 times (every 1.5s = 12s total) waiting for webhook to fire
      setPolling(true);
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const premium = await checkPremium();
        if (premium) { setIsPremium(true); setPolling(false); clearInterval(interval); return; }
        if (attempts >= 8) { setPolling(false); clearInterval(interval); }
      }, 1500);
      return () => clearInterval(interval);
    } else {
      checkPremium().then((p) => { if (p) setIsPremium(true); });
    }
  }, [userId, success]);

  async function handleUpgrade(selectedPlan?: "monthly" | "annual") {
    if (!session) { router.push("/signin?next=/upgrade"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/premium/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan ?? plan }),
      });
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
          {polling ? (
            <p className="text-sm text-green-600 mt-1 animate-pulse">Activating your account…</p>
          ) : (
            <p className="text-sm text-green-700 mt-1">Your account is now upgraded. All premium features are live.</p>
          )}
        </div>
      )}
      {cancelled && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-center text-gray-500 text-sm">
          No worries — you weren&apos;t charged. You can upgrade any time.
        </div>
      )}

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm font-bold px-4 py-1.5 rounded-full">
          <span>🎁</span> 7 days free — then $4.99/month
        </div>
        <h1 className="text-4xl font-black text-gray-900 leading-tight">
          Know who&apos;s looking.<br />Be impossible to miss.
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Try SpotId Premium free for 7 days. Unlock real-time viewer identity, verified status,
          hashtag analytics, priority search placement, and more.
        </p>
      </div>

      {/* Plan toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setPlan("monthly")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition ${
              plan === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPlan("annual")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              plan === "annual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Annual
            <span className="bg-green-500 text-white text-xs font-black px-2 py-0.5 rounded-full">Save 33%</span>
          </button>
        </div>
      </div>

      {/* Pricing card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white text-center shadow-xl relative overflow-hidden">
        {/* Free trial ribbon */}
        <div className="absolute top-4 right-4 bg-green-400 text-green-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">
          7-Day Free Trial
        </div>
        <p className="text-indigo-200 text-sm font-semibold uppercase tracking-wider mb-2">Premium Plan</p>

        {plan === "monthly" ? (
          <>
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-6xl font-black">$4</span>
              <span className="text-2xl font-semibold text-indigo-200 mb-3">.99</span>
            </div>
            <p className="text-indigo-200 mb-1">per month after free trial · cancel any time</p>
          </>
        ) : (
          <>
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-6xl font-black">$39</span>
              <span className="text-2xl font-semibold text-indigo-200 mb-3">.99</span>
            </div>
            <p className="text-indigo-200 mb-1">per year after free trial · just $3.33/month</p>
            <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 mb-1">
              <span className="text-xs line-through text-indigo-300">$59.88/yr</span>
              <span className="text-xs font-bold text-green-300">Save $19.89</span>
            </div>
          </>
        )}

        <p className="text-green-300 text-sm font-semibold mb-6">✓ Try free for 7 days — no charge until day 8</p>
        <button
          onClick={() => handleUpgrade()}
          disabled={loading}
          className="w-full bg-white text-indigo-700 font-black text-lg py-4 rounded-2xl hover:bg-indigo-50 transition disabled:opacity-60 shadow-lg"
        >
          {loading ? "Opening checkout…" : session
            ? plan === "annual" ? "Start Free Trial — Best Value →" : "Start Free Trial →"
            : "Sign in to Start Trial →"}
        </button>
        <p className="text-indigo-300 text-xs mt-3">Secure checkout via Stripe · Card required · Cancel before day 8 to avoid charge</p>
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
            q: "How does the free trial work?",
            a: "You get 7 days of full premium access at no charge. Your card is required to start, but won't be billed until day 8. Cancel any time before day 8 and you owe nothing.",
          },
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

      <div className="text-center pb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => handleUpgrade("monthly")}
            disabled={loading}
            className="bg-indigo-600 text-white font-bold text-base px-8 py-3 rounded-full hover:bg-indigo-700 transition disabled:opacity-60 shadow"
          >
            {loading ? "Opening checkout…" : "Monthly — $4.99/mo →"}
          </button>
          <button
            onClick={() => handleUpgrade("annual")}
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-base px-8 py-3 rounded-full hover:opacity-90 transition disabled:opacity-60 shadow"
          >
            {loading ? "Opening checkout…" : "Annual — $39.99/yr · Best Value 🏆"}
          </button>
        </div>
        <p className="text-xs text-gray-400">No charge for 7 days · Stripe secure · Cancel any time</p>
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
