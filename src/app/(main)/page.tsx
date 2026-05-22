"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FeedPreviewEntry {
  id: string; date: string; updatedAt: string;
  user: { id: string; name?: string; image?: string };
  hashtags: { hashtag: { id: string; name: string } }[];
}

function HomeContent() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;
  const router = useRouter();
  const params = useSearchParams();
  const [searchQ, setSearchQ] = useState("");
  const [taggedToday, setTaggedToday] = useState<boolean | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [feedPreview, setFeedPreview] = useState<FeedPreviewEntry[]>([]);
  const [suggestions, setSuggestions] = useState<{ name: string; count: number }[]>([]);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [platformStats, setPlatformStats] = useState<{ totalUsers: number; activeToday: number; totalItems: number; totalTags: number } | null>(null);
  const [recentListings, setRecentListings] = useState<{ id: string; title: string; price?: number; image?: string; user: { name?: string } }[]>([]);

  const wasDeleted = params.get("deleted") === "1";

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then((d) => {
      if (d.totalUsers != null) setPlatformStats(d);
    }).catch(() => {});
    // Load recent listings for logged-out social proof section
    fetch("/api/browse?type=closet").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.items) setRecentListings(d.items.slice(0, 6));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!session || !userId) return;
    fetch("/api/daily").then((r) => r.json()).then((d) => {
      setTaggedToday(!!(d?.hashtags?.length));
    }).catch(() => setTaggedToday(true));
    fetch(`/api/profile?userId=${userId}`).then((r) => r.json()).then((p) => {
      const isEmpty = !p.bio && !p.image && !p.occupation && !p.username;
      setProfileIncomplete(isEmpty);
      setStreak(p.streak ?? 0);
      setIsPremium(!!p.isPremium);
    }).catch(() => {});
    fetch("/api/feed").then((r) => r.json()).then((d) => {
      const entries = [...(d.dailyFromFollowed || []), ...(d.dailyFromTags || [])]
        .sort((a: FeedPreviewEntry, b: FeedPreviewEntry) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4);
      setFeedPreview(entries);
    }).catch(() => {});
  }, [session, userId]);

  function handleSearchQueryChange(val: string) {
    setSearchQ(val);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    const token = val.split(/[\s,]+/).pop()?.replace(/^#/, "") || "";
    if (token.length < 2) { setSuggestions([]); return; }
    suggestTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/suggest?q=${encodeURIComponent(token)}`);
      if (res.ok) setSuggestions(await res.json());
    }, 200);
  }

  function applySuggestion(tagName: string) {
    const parts = searchQ.split(/[\s,]+/);
    parts[parts.length - 1] = `#${tagName}`;
    setSearchQ(parts.join(" ") + " ");
    setSuggestions([]);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSuggestions([]);
    if (searchQ.trim()) router.push(`/search?q=${encodeURIComponent(searchQ)}`);
  }

  return (
    <div className="space-y-10">
      {wasDeleted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 text-center text-green-800 text-sm font-medium">
          ✓ Your account has been permanently deleted. We&apos;re sorry to see you go.
        </div>
      )}

      {/* Email verification banner */}
      {session && (session.user as { emailVerified?: boolean })?.emailVerified === false && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📧</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Verify your email address</p>
              <p className="text-xs text-gray-500 mt-0.5">Check your inbox for a verification link. It helps keep your account secure.</p>
            </div>
          </div>
          <button
            onClick={async () => {
              const email = session.user?.email;
              if (!email) return;
              await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
              alert("Verification email sent! Check your inbox.");
            }}
            className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-blue-700 transition whitespace-nowrap"
          >
            Resend Email
          </button>
        </div>
      )}

      {/* Profile completion nudge */}
      {session && userId && profileIncomplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Your profile is empty</p>
              <p className="text-xs text-gray-500 mt-0.5">Add a photo, bio, and occupation so people know who you are when they find you.</p>
            </div>
          </div>
          <Link
            href={`/profile/${userId}`}
            className="bg-amber-500 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-amber-600 transition whitespace-nowrap"
          >
            Complete Profile →
          </Link>
        </div>
      )}

      {/* Daily nudge for logged-in users who haven't tagged today */}
      {session && taggedToday === false && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">You haven&apos;t tagged today yet</p>
              <p className="text-xs text-gray-500 mt-0.5">People searching right now can&apos;t find you. Tag your day and be discoverable.</p>
            </div>
          </div>
          <Link
            href="/daily"
            className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-indigo-700 transition whitespace-nowrap"
          >
            Tag Today →
          </Link>
        </div>
      )}

      {/* Hero */}
      <div className="text-center py-12 px-4">
        <div className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
          Tag yourself. Get spotted.
        </div>
        <h1 className="text-5xl sm:text-6xl font-black text-gray-900 mb-4 leading-tight">
          The world is looking.<br />
          <span className="text-indigo-600">Get spotted.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          SpotId turns everyday hashtags into a living, searchable map of people, places, and things.
          Tag your day. List your items. Offer your services. Then let the world find you.
        </p>

        {/* Homepage search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto mb-6">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">#</span>
            <input
              type="text"
              value={searchQ}
              onChange={(e) => handleSearchQueryChange(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestions([]), 200)}
              placeholder="Search anything — Plano, vintage lamp, designer…"
              className="w-full pl-9 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm shadow-sm"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden text-left">
                {suggestions.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onMouseDown={() => applySuggestion(s.name)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition flex items-center justify-between gap-2"
                  >
                    <span>#{s.name}</span>
                    {s.count > 0 && <span className="text-xs text-gray-400">{s.count}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="submit"
            className="bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm">
            Search
          </button>
        </form>

        <div className="flex gap-3 justify-center flex-wrap">
          {!session ? (
            <>
              <Link href="/signup"
                className="bg-indigo-600 text-white px-7 py-3 rounded-full font-semibold text-lg hover:bg-indigo-700 transition shadow-sm">
                Join SpotId Free
              </Link>
              <Link href="/signin"
                className="bg-white text-gray-700 border-2 border-gray-200 px-7 py-3 rounded-full font-semibold text-lg hover:border-indigo-400 transition">
                Sign In
              </Link>
            </>
          ) : (
            <>
              <Link href="/daily"
                className="bg-indigo-600 text-white px-7 py-3 rounded-full font-semibold text-lg hover:bg-indigo-700 transition">
                Tag Today
              </Link>
              <Link href={`/profile/${userId}`}
                className="bg-white text-indigo-600 border-2 border-indigo-200 px-7 py-3 rounded-full font-semibold text-lg hover:border-indigo-400 transition">
                My Profile
              </Link>
            </>
          )}
        </div>

        {/* Platform stats */}
        {platformStats && (platformStats.totalUsers > 0 || platformStats.activeToday > 0) && (
          <div className="flex gap-6 justify-center flex-wrap mt-8 text-center">
            {platformStats.activeToday > 0 && (
              <div>
                <p className="text-2xl font-black text-indigo-600">{platformStats.activeToday.toLocaleString()}</p>
                <p className="text-xs text-gray-400 font-medium">active today</p>
              </div>
            )}
            {platformStats.totalUsers > 0 && (
              <div>
                <p className="text-2xl font-black text-gray-800">{platformStats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-gray-400 font-medium">members</p>
              </div>
            )}
            {platformStats.totalItems > 0 && (
              <div>
                <p className="text-2xl font-black text-orange-500">{platformStats.totalItems.toLocaleString()}</p>
                <p className="text-xs text-gray-400 font-medium">items for sale</p>
              </div>
            )}
            {platformStats.totalTags > 0 && (
              <div>
                <p className="text-2xl font-black text-purple-600">{platformStats.totalTags.toLocaleString()}</p>
                <p className="text-xs text-gray-400 font-medium">unique tags</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Use cases */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          {
            icon: "👤",
            color: "from-indigo-500 to-purple-600",
            title: "Find People",
            scenarios: [
              "Saw someone at a coffee shop and wish you'd said hello",
              "Want to know who's at a venue before you go",
              "Looking to connect with people at a specific event",
            ],
          },
          {
            icon: "🏺",
            color: "from-pink-500 to-orange-400",
            title: "Find Anything",
            scenarios: [
              "Hunting a rare antique you saw 30 years ago in Gruene, TX",
              "Looking for a specific vintage item, color, or era",
              "Searching for a collectible you can't find anywhere else",
            ],
          },
          {
            icon: "💼",
            color: "from-emerald-500 to-teal-600",
            title: "Find Services",
            scenarios: [
              "Need a designer, plumber, or caterer in your area",
              "Looking for professionals with a specific specialty",
              "Want to hire someone available right now",
            ],
          },
        ].map((card) => (
          <div key={card.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`bg-gradient-to-r ${card.color} px-5 py-4 flex items-center gap-3`}>
              <span className="text-3xl">{card.icon}</span>
              <h3 className="font-bold text-white text-lg">{card.title}</h3>
            </div>
            <div className="p-5">
              <ul className="space-y-2">
                {card.scenarios.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How SpotId Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[
            { step: "1", icon: "✍️", title: "Tag Your Day", desc: "Every day, tag where you are, what you're wearing, what you have, what you offer." },
            { step: "2", icon: "🏷️", title: "List Items & Services", desc: "Add items to your Closet and services to your Work with descriptive hashtags." },
            { step: "3", icon: "🌐", title: "Everything's Searchable", desc: "Every tag you use becomes searchable. Anyone looking for that tag finds you." },
            { step: "4", icon: "🤝", title: "Connect & Transact", desc: "People find you by search. You connect, meet, sell, or hire — all in the real world." },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
                {s.icon}
              </div>
              <p className="font-bold text-gray-900 mb-1">{s.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The antique lamp example */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-8">
        <h2 className="font-bold text-xl text-gray-900 mb-2">The Power of a Hashtag</h2>
        <p className="text-gray-600 mb-4 leading-relaxed">
          In 1994, you saw a beautiful 19th century blue lamp with a white shade while sightseeing
          in Gruene, Texas. You didn&apos;t buy it. Now&apos;s the time to find it. Today, you search SpotId:
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {["antique", "bluelamp", "whitelampshade", "Gruene", "TX", "19thCentury", "vintage"].map((tag) => (
            <Link key={tag} href={`/search?q=%23${tag}`}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-700 transition">
              #{tag}
            </Link>
          ))}
        </div>
        <p className="text-gray-600 leading-relaxed mb-4">
          Somewhere out there, someone happens to have that exact lamp — or one just like it — and
          they listed it on SpotId with those same tags. You weren&apos;t looking for <em>their</em>{" "}lamp.
          They weren&apos;t looking for <em>you</em>. But the hashtags brought you together at exactly the right moment.
        </p>
        <p className="text-gray-600 leading-relaxed">
          It may not be the same lamp. But it might be close enough — or even better.
          That&apos;s what SpotId does: it connects people who didn&apos;t know they needed each other,
          through the simple act of describing what they have.{" "}
          <strong className="text-gray-900">Tag what you have. Find what you need.</strong>
        </p>
      </div>

      {/* Recent listings preview (social proof for all visitors) */}
      {recentListings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">🏪 Recent Listings</h2>
              <p className="text-xs text-gray-400 mt-0.5">Items from SpotId members, available right now</p>
            </div>
            <Link href="/browse" className="text-xs text-indigo-600 hover:underline font-medium">
              Browse all →
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-y divide-gray-50">
            {recentListings.map((item) => (
              <Link key={item.id} href={`/closet/${item.id}`}>
                <div className="group hover:bg-gray-50 transition p-2">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full aspect-square object-cover rounded-lg mb-1.5 group-hover:opacity-90 transition" />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-pink-50 to-orange-50 rounded-lg flex items-center justify-center text-2xl mb-1.5">
                      🏷️
                    </div>
                  )}
                  <p className="text-xs font-semibold text-gray-900 truncate">{item.title}</p>
                  {item.price != null ? (
                    <p className="text-xs text-indigo-600 font-bold">${item.price.toFixed(2)}</p>
                  ) : (
                    <p className="text-xs text-gray-400">—</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Logged-in dashboard */}
      {session && userId && (
        <div className="space-y-5">
          {/* Status bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className={`text-xl font-black ${taggedToday ? "text-green-600" : "text-gray-300"}`}>
                    {taggedToday ? "●" : "○"}
                  </p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
                {streak > 1 && (
                  <div className="text-center">
                    <p className="text-xl font-black text-orange-500">🔥 {streak}</p>
                    <p className="text-xs text-gray-500">Streak</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link href="/daily"
                  className={`text-sm font-semibold px-4 py-2 rounded-full transition ${
                    taggedToday
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}>
                  {taggedToday ? "✓ Tagged Today" : "Tag Today →"}
                </Link>
                <Link href="/discover"
                  className="text-sm font-semibold bg-white border-2 border-gray-200 text-gray-700 px-4 py-2 rounded-full hover:border-indigo-400 transition">
                  Discover
                </Link>
              </div>
            </div>
          </div>

          {/* Premium upsell — only show for non-premium users who have been around (streak > 0) */}
          {!isPremium && streak >= 1 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="text-3xl flex-shrink-0">✨</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">See who&apos;s viewing your profile</p>
                <p className="text-xs text-gray-500 mt-0.5">Upgrade to Premium for viewer identity, 90-day analytics, and priority search placement.</p>
              </div>
              <Link href="/upgrade"
                className="flex-shrink-0 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-indigo-700 transition">
                $4.99/mo →
              </Link>
            </div>
          )}

          {/* Feed preview */}
          {feedPreview.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">📰 Feed</h2>
                <Link href="/feed" className="text-xs text-indigo-600 hover:underline font-medium">
                  See all →
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {feedPreview.map((entry) => (
                  <Link key={entry.id} href={`/profile/${entry.user.id}`}>
                    <div className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs flex-shrink-0 overflow-hidden">
                        {entry.user.image
                          ? <img src={entry.user.image} alt={entry.user.name} className="w-full h-full object-cover" />
                          : (entry.user.name?.[0] ?? "?").toUpperCase()
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{entry.user.name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {entry.hashtags.slice(0, 5).map(({ hashtag }) => (
                            <span key={hashtag.id} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                              #{hashtag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick nav */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { href: `/profile/${userId}`, icon: "👤", label: "My Profile", desc: "Your permanent page" },
              { href: "/daily", icon: "📅", label: "Daily Profile", desc: "Tag today" },
              { href: "/closet", icon: "👗", label: "Closet", desc: "Items for sale" },
              { href: "/work", icon: "💼", label: "Work", desc: "Your services" },
            ].map((link) => (
              <Link key={link.href} href={link.href}
                className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:border-indigo-300 hover:shadow-md transition">
                <div className="text-3xl mb-2">{link.icon}</div>
                <p className="font-bold text-gray-900 text-sm">{link.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
