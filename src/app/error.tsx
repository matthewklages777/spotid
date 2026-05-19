"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
      <div className="text-center space-y-5 max-w-md">
        <p className="text-7xl">⚠️</p>
        <h1 className="text-2xl font-black text-gray-900">Something went wrong</h1>
        <p className="text-gray-500">An unexpected error occurred. We&apos;ve logged it automatically.</p>
        <div className="flex gap-3 justify-center pt-2">
          <button onClick={reset}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition">
            Try again
          </button>
          <Link href="/"
            className="bg-white text-gray-700 border border-gray-200 px-6 py-2.5 rounded-xl font-semibold hover:border-indigo-400 transition">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
