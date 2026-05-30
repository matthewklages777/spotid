"use client";
import { useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-7 text-center">
          <h1 className="text-3xl font-black text-white"><Brand /></h1>
          <p className="text-indigo-200 text-sm mt-1">Reset your password</p>
        </div>

        <div className="px-8 py-7">
          {submitted ? (
            <div className="text-center space-y-4">
              <p className="text-5xl">📬</p>
              <h2 className="text-lg font-bold text-gray-900">Check your email</h2>
              <p className="text-sm text-gray-600">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent.
                The link expires in 1 hour.
              </p>
              <p className="text-xs text-gray-400">
                Don&apos;t see it? Check your spam folder.
              </p>
              <Link href="/signin" className="block mt-4 text-sm text-indigo-600 font-semibold hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the email address for your account and we&apos;ll send you a password reset link.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition text-sm"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
              <p className="text-center text-sm text-gray-500">
                <Link href="/signin" className="text-indigo-600 font-semibold hover:underline">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
