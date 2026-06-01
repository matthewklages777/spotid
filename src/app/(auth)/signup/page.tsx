"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/Brand";

function SignUpContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [tos, setTos] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);

  useEffect(() => {
    const ref = params.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
  }, [params]);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then((d) => {
      if (d.totalUsers != null) setSpotsLeft(Math.max(0, 500 - d.totalUsers));
    }).catch(() => {});
  }, []);

  // Calculate max date (must be 18+)
  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 18);
  const maxDobStr = maxDob.toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tos) {
      setError("You must accept the Terms of Service to continue.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, dob, referralCode: referralCode || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/onboarding");
  }

  const canSubmit = name && email && password.length >= 8 && dob && tos;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-7 text-center">
          <h1 className="text-3xl font-black text-white"><Brand /></h1>
          <p className="text-indigo-200 text-sm mt-1">
            {referralCode ? "You were invited! Create your free account" : "Create your free account"}
          </p>
          {spotsLeft !== null && spotsLeft > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full">
              🌟 {spotsLeft} Founding Member spot{spotsLeft !== 1 ? "s" : ""} left
            </div>
          )}
        </div>

        {referralCode && (
          <div className="bg-green-50 border-b border-green-100 px-8 py-3 flex items-center gap-2">
            <span className="text-green-600 text-lg">🎁</span>
            <p className="text-sm text-green-800 font-semibold">
              Referred by a friend — welcome to <Brand />!
            </p>
          </div>
        )}

        <div className="px-8 py-7 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Jane Smith" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={8}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="At least 8 characters" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date of Birth
                <span className="ml-2 text-xs font-normal text-gray-400">You must be 18 or older</span>
              </label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                required max={maxDobStr}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              <p className="text-xs text-gray-400 mt-1">
                Your date of birth is used solely to verify your age and is never shown publicly.
              </p>
            </div>

            <div className="pt-1 space-y-2">
              <p className="text-xs text-gray-500 px-1">
                Please read before agreeing:{" "}
                <Link href="/terms" target="_blank" className="text-indigo-600 font-semibold hover:underline">Terms of Service</Link>
                {" · "}
                <Link href="/privacy" target="_blank" className="text-indigo-600 font-semibold hover:underline">Privacy Policy</Link>
                {" · "}
                <Link href="/guidelines" target="_blank" className="text-indigo-600 font-semibold hover:underline">Community Guidelines</Link>
              </p>
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                tos ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
              }`}>
                <input type="checkbox" checked={tos} onChange={(e) => setTos(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 flex-shrink-0" />
                <span className="text-sm text-gray-700 font-medium">
                  I have read and agree to the Terms of Service, Privacy Policy, and Community Guidelines.
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !canSubmit}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition text-sm">
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { icon: "🔍", label: "Be searchable", desc: "Show up when people search your tags" },
              { icon: "🏷️", label: "Tag your day", desc: "Daily profile resets every 24 hrs" },
              { icon: "🛍️", label: "Sell & offer", desc: "List items and services for free" },
            ].map((b) => (
              <div key={b.label} className="text-center bg-gray-50 rounded-xl p-3">
                <p className="text-xl mb-1">{b.icon}</p>
                <p className="text-xs font-semibold text-gray-800">{b.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{b.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/signin" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpContent />
    </Suspense>
  );
}
