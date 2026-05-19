"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const email = params.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setStatus("success");
          setTimeout(() => router.push("/daily"), 3000);
        } else {
          setStatus("error");
          setMessage(d.error || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <p className="text-5xl mb-4 animate-pulse">📧</p>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying your email…</h1>
            <p className="text-gray-500 text-sm">Just a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <p className="text-5xl mb-4">✅</p>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-500 text-sm mb-5">
              Your email address has been confirmed. Welcome to SpotId!
            </p>
            <p className="text-xs text-gray-400">Redirecting to your daily profile…</p>
            <Link
              href="/daily"
              className="mt-4 inline-block bg-indigo-600 text-white text-sm px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition"
            >
              Tag Today →
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-5xl mb-4">❌</p>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/signin"
                className="block bg-indigo-600 text-white text-sm px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition"
              >
                Sign In
              </Link>
              <Link href="/" className="block text-sm text-gray-400 hover:text-gray-600 transition">
                Back to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading…</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
