"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/Brand";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ ok?: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token || !email) {
    return (
      <div className="text-center space-y-3 py-4">
        <p className="text-4xl">⚠️</p>
        <p className="text-gray-700 font-semibold">Invalid reset link</p>
        <p className="text-sm text-gray-500">This link may have expired or is malformed.</p>
        <Link href="/forgot-password" className="text-indigo-600 text-sm font-semibold hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (password !== confirm) {
      setStatus({ ok: false, msg: "Passwords do not match." });
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setStatus({ ok: true, msg: "Password reset! Redirecting to sign in…" });
      setTimeout(() => router.push("/signin"), 2000);
    } else {
      setStatus({ ok: false, msg: data.error || "Something went wrong." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Resetting password for <strong>{email}</strong>.
      </p>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoFocus
          placeholder="At least 8 characters"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          placeholder="Repeat password"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>
      {status && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${status.ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {status.msg}
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !password || !confirm}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition text-sm"
      >
        {loading ? "Resetting…" : "Set New Password"}
      </button>
      <p className="text-center text-sm text-gray-500">
        <Link href="/signin" className="text-indigo-600 font-semibold hover:underline">Back to sign in</Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-7 text-center">
          <h1 className="text-3xl font-black text-white"><Brand /></h1>
          <p className="text-indigo-200 text-sm mt-1">Choose a new password</p>
        </div>
        <div className="px-8 py-7">
          <Suspense fallback={<p className="text-sm text-gray-400 text-center">Loading…</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
