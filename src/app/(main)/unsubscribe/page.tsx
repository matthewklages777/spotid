"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function UnsubscribeContent() {
  const params = useSearchParams();
  const done = params.get("done") === "1";
  const type = params.get("type") || "digest";

  const labels: Record<string, string> = {
    digest: "weekly digest emails",
    messages: "message notification emails",
    followers: "new follower emails",
    all: "all SpotId emails",
  };

  const label = labels[type] || "those emails";

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md text-center space-y-4">
          <p className="text-5xl">✅</p>
          <h1 className="text-2xl font-black text-gray-900">Unsubscribed</h1>
          <p className="text-gray-500">
            You&apos;ve been unsubscribed from <strong>{label}</strong>. It may take a few minutes to take effect.
          </p>
          <p className="text-sm text-gray-400">
            You can re-enable any email type in{" "}
            <Link href="/settings" className="text-indigo-600 hover:underline">Settings → Notifications</Link>.
          </p>
          <Link
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition text-sm"
          >
            Back to SpotId
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md text-center space-y-4">
        <p className="text-5xl">📧</p>
        <h1 className="text-2xl font-black text-gray-900">Email Preferences</h1>
        <p className="text-gray-500">
          Manage your email settings in your account settings, or use the unsubscribe link in any SpotId email.
        </p>
        <Link
          href="/settings"
          className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition text-sm"
        >
          Go to Settings
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}
