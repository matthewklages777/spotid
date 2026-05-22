"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Hashtag { id: string; name: string }
interface ActiveUser {
  id: string; name?: string; image?: string; location?: string;
  occupation?: string; username?: string; isPremium?: boolean;
  dailyProfiles: { image?: string; hashtags: { hashtag: Hashtag }[] }[];
}
interface ClosetItem {
  id: string; title: string; price?: number; image?: string;
  hashtags: { hashtag: Hashtag }[];
  user: { id: string; name?: string; image?: string };
}
interface WorkItem {
  id: string; title: string; description?: string; category?: string; image?: string;
  hashtags: { hashtag: Hashtag }[];
  user: { id: string; name?: string; image?: string };
}
interface TagData {
  users: ActiveUser[];
  profiles: ActiveUser[];
  closet: ClosetItem[];
  work: WorkItem[];
}
interface TagStats {
  totalUses: number;
  followerCount: number;
  dailyActivity: { date: string; count: number }[];
  relatedTags: { name: string; count: number }[];
}

export default function TagClient() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string })?.id;

  const [data, setData] = useState<TagData | null>(null);
  const [stats, setStats] = useState<TagStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function shareTag() {
    const url = `${window.location.origin}/tag/${encodeURIComponent(tag)}`;
    const shareData = { title: `#${tag} on SpotId`, text: `Check out #${tag} on SpotId`, url };
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const tag = decodeURIComponent(name).toLowerCase().replace(/^#/, "");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/search?q=%23${encodeURIComponent(tag)}&type=all`).then((r) => r.json()),
      fetch(`/api/tag/${encodeURIComponent(tag)}`).then((r) => r.json()).catch(() => null),
    ]).then(([d, s]) => {
      setData(d);
      if (s && !s.error) setStats(s);
      setLoading(false);
    });
  }, [tag]);

  useEffect(() => {
    if (!myId) return;
    fetch(`/api/follow-hashtag?name=${encodeURIComponent(tag)}`)
      .then((r) => r.json())
      .then((d) => setFollowing(d.following ?? false))
      .catch(() => {});
  }, [tag, myId]);

  async function toggleFollow() {
    if (!myId || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch("/api/follow-hashtag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tag }),
      });
      if (res.ok) {
        const d = await res.json();
        setFollowing(d.following);
      }
    } finally {
      setFollowLoading(false);
    }
  }

  const total = (data?.users.length ?? 0) + (data?.profiles.length ?? 0) +
    (data?.closet.length ?? 0) + (data?.work.length ?? 0);

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-7">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-white/30">#</span>
            <h1 className="text-3xl font-black text-white">{tag}</h1>
          </div>
          {!loading && (
            <div className="mt-2 space-y-1">
              <p className="text-indigo-200 text-sm">
                {total} result{total !== 1 ? "s" : ""} — people, items & services tagged #{tag}
              </p>
              {stats && (
                <div className="flex items-center gap-4 flex-wrap">
                  {stats.totalUses > 0 && (
                    <span className="text-indigo-300 text-xs">{stats.totalUses.toLocaleString()} total uses</span>
                  )}
                  {stats.followerCount > 0 && (
                    <span className="text-indigo-300 text-xs">{stats.followerCount} following this tag</span>
                  )}
                  {stats.dailyActivity.length > 0 && (() => {
                    const recent = stats.dailyActivity.slice(-7);
                    const max = Math.max(...recent.map((d) => d.count), 1);
                    return (
                      <div className="flex items-end gap-0.5 h-5" title="Activity last 7 days">
                        {recent.map((d) => (
                          <div
                            key={d.date}
                            style={{ height: `${Math.max((d.count / max) * 100, 8)}%` }}
                            className="w-1.5 bg-white/40 rounded-full"
                            title={`${d.date}: ${d.count}`}
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-8 py-3 flex items-center gap-4 flex-wrap">
          <Link href={`/search?q=%23${encodeURIComponent(tag)}`}
            className="text-sm text-indigo-600 hover:underline font-medium">
            Open in Search →
          </Link>
          <Link href="/trending" className="text-sm text-gray-400 hover:text-gray-600">
            Trending Tags
          </Link>
          <button
            onClick={shareTag}
            className="text-sm text-gray-500 hover:text-indigo-600 transition"
            title="Share this tag"
          >
            {copied ? "✓ Copied!" : "Share ↗"}
          </button>
          {myId && (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={`ml-auto text-sm font-semibold px-4 py-1.5 rounded-full transition ${
                following
                  ? "bg-indigo-100 text-indigo-700 hover:bg-red-50 hover:text-red-600"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {followLoading ? "…" : following ? "✓ Following" : "+ Follow"}
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3 animate-pulse">#</p>
          <p>Loading #{tag}…</p>
        </div>
      )}

      {!loading && total === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No results for #{tag}</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            No one has tagged <span className="font-semibold text-indigo-600">#{tag}</span> yet.
            Tag your day and be the first!
          </p>
          <Link href="/daily"
            className="mt-5 inline-block bg-indigo-600 text-white text-sm px-6 py-2.5 rounded-full hover:bg-indigo-700 transition font-semibold">
            Tag Today
          </Link>
        </div>
      )}

      {/* Active today */}
      {!loading && (data?.users.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <h2 className="font-bold text-gray-900">People Active Today</h2>
            <span className="text-sm text-gray-400">({data!.users.length})</span>
          </div>
          <div className="divide-y divide-gray-50">
            {data!.users.map((u) => {
              const todayDaily = u.dailyProfiles[0];
              return (
                <div key={u.id}
                  onClick={() => router.push(`/profile/${u.id}`)}
                  className="hover:bg-gray-50 transition cursor-pointer overflow-hidden"
                >
                  {todayDaily?.image && (
                    <div className="w-full h-28 overflow-hidden">
                      <img src={todayDaily.image} alt="Today" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-start gap-4 px-5 py-3.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0 overflow-hidden">
                      {u.image
                        ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                        : (u.name?.[0] ?? "?").toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                        {u.name || "Anonymous"}{u.isPremium && <span className="text-blue-500 text-xs">✅</span>}
                      </p>
                      {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
                      {u.occupation && <p className="text-xs text-indigo-600">{u.occupation}</p>}
                      {u.location && <p className="text-xs text-gray-400">📍 {u.location}</p>}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {todayDaily?.hashtags.slice(0, 6).map(({ hashtag }) => (
                          <Link
                            key={hashtag.id}
                            href={`/tag/${hashtag.name}`}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              hashtag.name === tag
                                ? "bg-indigo-600 text-white"
                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            }`}
                          >
                            #{hashtag.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      Active
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profiles */}
      {!loading && (data?.profiles.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <span className="text-gray-400">🪪</span>
            <h2 className="font-bold text-gray-900">Profiles</h2>
            <span className="text-sm text-gray-400">({data!.profiles.length})</span>
          </div>
          <div className="divide-y divide-gray-50">
            {data!.profiles.map((u) => (
              <div key={u.id}
                onClick={() => router.push(`/profile/${u.id}`)}
                className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0 overflow-hidden">
                  {u.image
                    ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                    : (u.name?.[0] ?? "?").toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                    {u.name || "Anonymous"}{u.isPremium && <span className="text-blue-500 text-xs">✅</span>}
                  </p>
                  {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
                  {u.occupation && <p className="text-xs text-indigo-600">{u.occupation}</p>}
                  {u.location && <p className="text-xs text-gray-400">📍 {u.location}</p>}
                </div>
                {myId && myId !== u.id && (
                  <Link
                    href={`/messages?to=${u.id}&name=${encodeURIComponent(u.name || "")}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-indigo-600 hover:underline font-medium flex-shrink-0"
                  >
                    Message →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closet */}
      {!loading && (data?.closet.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <span className="text-gray-400">🏷️</span>
            <h2 className="font-bold text-gray-900">For Sale</h2>
            <span className="text-sm text-gray-400">({data!.closet.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-gray-50">
            {data!.closet.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/closet/${item.id}`)}
                className="p-3 hover:bg-gray-50 transition cursor-pointer"
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full aspect-square object-cover rounded-xl mb-2" />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl flex items-center justify-center text-3xl mb-2">
                    🏷️
                  </div>
                )}
                <p className="font-semibold text-gray-900 text-xs truncate">{item.title}</p>
                {item.price != null && (
                  <p className="text-indigo-600 font-bold text-sm">${item.price.toFixed(2)}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">by {item.user.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Tags */}
      {!loading && stats && (stats.relatedTags?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <span className="text-gray-400">🔗</span>
            <h2 className="font-bold text-gray-900">Related Tags</h2>
            <span className="text-xs text-gray-400">Often tagged together with #{tag}</span>
          </div>
          <div className="px-6 py-4 flex flex-wrap gap-2">
            {stats.relatedTags.map(({ name: rName, count }) => (
              <Link
                key={rName}
                href={`/tag/${encodeURIComponent(rName)}`}
                className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm px-3 py-1.5 rounded-full transition font-medium"
              >
                <span>#{rName}</span>
                <span className="text-xs text-indigo-400">{count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Work */}
      {!loading && (data?.work.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <span className="text-gray-400">💼</span>
            <h2 className="font-bold text-gray-900">Services</h2>
            <span className="text-sm text-gray-400">({data!.work.length})</span>
          </div>
          <div className="divide-y divide-gray-50">
            {data!.work.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/work/${item.id}`)}
                className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-50 transition cursor-pointer"
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl flex-shrink-0">
                    💼
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    {item.category && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {item.category}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">by {item.user.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
