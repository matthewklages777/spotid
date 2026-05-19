"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function InvitePage() {
  const { data: session } = useSession();
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  useEffect(() => {
    const uid = (session?.user as { id?: string })?.id;
    if (!uid) return;
    setUserId(uid);
    fetch(`/api/profile?userId=${uid}`).then((r) => r.json()).then((p) => {
      setUsername(p.username || null);
    }).catch(() => {});
  }, [session]);

  if (!session) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <p className="text-4xl">🔗</p>
        <h1 className="text-2xl font-black text-gray-900">Invite Friends</h1>
        <p className="text-gray-500">Sign in to get your personal invite link.</p>
        <Link href="/signin" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const base = typeof window !== "undefined" ? window.location.origin : "https://spotid.app";
  const profileUrl = username ? `${base}/u/${username}` : userId ? `${base}/profile/${userId}` : base;
  const inviteUrl = `${base}/signup`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(profileUrl)}`;

  const messages = [
    `Find me on SpotId — a place where you tag what you're into and people find you. ${profileUrl}`,
    `I'm on SpotId! It's like a living, searchable version of yourself. Come join me: ${inviteUrl}`,
    `Check out my SpotId profile: ${profileUrl}`,
  ];

  function copyLink(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Invite Friends</h1>
        <p className="text-sm text-gray-500 mt-1">Share your profile or invite link — help people find you on SpotId.</p>
      </div>

      {/* Your profile link */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Your Profile Link</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-mono truncate">
            {profileUrl}
          </div>
          <button
            onClick={() => copyLink(profileUrl)}
            className="text-sm bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition font-semibold whitespace-nowrap"
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>

        {/* QR Code toggle */}
        <button
          onClick={() => setQrVisible(!qrVisible)}
          className="text-sm text-indigo-600 hover:underline"
        >
          {qrVisible ? "Hide QR code" : "Show QR code for in-person sharing →"}
        </button>
        {qrVisible && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <img src={qrUrl} alt="QR code for your profile" className="rounded-xl w-[200px] h-[200px]" />
            <p className="text-xs text-gray-400">Someone can scan this to open your profile instantly</p>
          </div>
        )}
      </div>

      {/* Ready-made messages */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Ready-Made Messages</h2>
        <p className="text-sm text-gray-500">Tap any to copy, then paste into a text or DM.</p>
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
              <p className="flex-1 text-sm text-gray-700 leading-relaxed">{msg}</p>
              <button
                onClick={() => copyLink(msg)}
                className="text-xs text-indigo-600 hover:underline font-semibold whitespace-nowrap flex-shrink-0 mt-0.5"
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invite new users */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="font-bold text-gray-900">Invite New Users</h2>
        <p className="text-sm text-gray-500">
          SpotId is free to join. Share the signup link to grow your community.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-mono truncate">
            {inviteUrl}
          </div>
          <button
            onClick={() => copyLink(inviteUrl)}
            className="text-sm bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition font-semibold whitespace-nowrap"
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        SpotId grows through word of mouth — thank you for sharing.
      </p>
    </div>
  );
}
