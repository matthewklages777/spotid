"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface ReferralData {
  code: string;
  url: string;
  count: number;
  isPremium: boolean;
}

export default function InvitePage() {
  const { data: session } = useSession();
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [loadingReferral, setLoadingReferral] = useState(false);

  useEffect(() => {
    const uid = (session?.user as { id?: string })?.id;
    if (!uid) return;
    setUserId(uid);
    fetch(`/api/profile?userId=${uid}`)
      .then((r) => r.json())
      .then((p) => { setUsername(p.username || null); })
      .catch(() => {});

    setLoadingReferral(true);
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => { if (d.code) setReferral(d); })
      .catch(() => {})
      .finally(() => setLoadingReferral(false));
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

  const base = typeof window !== "undefined" ? window.location.origin : "https://spotidapp.com";
  const profileUrl = username ? `${base}/u/${username}` : userId ? `${base}/profile/${userId}` : base;
  const referralUrl = referral?.url || `${base}/signup`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(profileUrl)}`;

  const messages = [
    `Find me on SpotId — a place where you tag what you're into and people find you. Join here: ${referralUrl}`,
    `I'm on SpotId! It's like a living, searchable version of yourself. Come join me: ${referralUrl}`,
    `Check out my SpotId profile: ${profileUrl}`,
  ];

  function copyLink(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const referralCount = referral?.count ?? 0;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Invite Friends</h1>
        <p className="text-sm text-gray-500 mt-1">Share your profile or personal invite link.</p>
      </div>

      {/* Referral stats card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-200 text-sm font-semibold uppercase tracking-wider">Your Referral Code</p>
            {loadingReferral ? (
              <p className="text-3xl font-black mt-1 animate-pulse opacity-50">••••••</p>
            ) : (
              <p className="text-4xl font-black mt-1 tracking-widest">{referral?.code ?? "—"}</p>
            )}
            <p className="text-indigo-300 text-sm mt-1">
              {referralCount === 0
                ? "No one has signed up with your link yet."
                : referralCount === 1
                ? "1 person signed up through your link!"
                : `${referralCount} people signed up through your link!`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-black">{referralCount}</p>
            <p className="text-indigo-300 text-xs mt-1">referred</p>
          </div>
        </div>

        {/* Copy referral URL */}
        {referral && (
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 bg-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono truncate">
              {referralUrl}
            </div>
            <button
              onClick={() => copyLink(referralUrl, "ref")}
              className="text-sm bg-white text-indigo-700 font-black px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition whitespace-nowrap"
            >
              {copied === "ref" ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {/* How referrals work */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h3 className="font-bold text-amber-900 mb-2">🎁 How It Works</h3>
        <ul className="text-sm text-amber-800 space-y-1.5 list-none">
          <li>✦ Share your personal link with friends</li>
          <li>✦ When they sign up, they're credited to you</li>
          <li>✦ Watch your referral count grow on this page</li>
          <li>✦ Every referral builds your SpotId reputation</li>
        </ul>
      </div>

      {/* Your profile link */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Your Profile Link</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-mono truncate">
            {profileUrl}
          </div>
          <button
            onClick={() => copyLink(profileUrl, "profile")}
            className="text-sm bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition font-semibold whitespace-nowrap"
          >
            {copied === "profile" ? "✓ Copied!" : "Copy"}
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
        <p className="text-sm text-gray-500">Tap any to copy, then paste into a text, DM, or social post.</p>
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
              <p className="flex-1 text-sm text-gray-700 leading-relaxed">{msg}</p>
              <button
                onClick={() => copyLink(msg, `msg-${i}`)}
                className="text-xs text-indigo-600 hover:underline font-semibold whitespace-nowrap flex-shrink-0 mt-0.5"
              >
                {copied === `msg-${i}` ? "✓" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Share via native share API */}
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button
          onClick={() => {
            navigator.share({
              title: "Join me on SpotId",
              text: `I'm on SpotId — tag yourself and get discovered. Join here:`,
              url: referralUrl,
            }).catch(() => {});
          }}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition"
        >
          Share Invite Link →
        </button>
      )}

      <p className="text-center text-xs text-gray-400">
        SpotId grows through word of mouth — thank you for sharing.
      </p>
    </div>
  );
}
