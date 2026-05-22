"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Hashtag { id: string; name: string }
interface UserSnippet { id: string; name?: string; image?: string; username?: string; occupation?: string }

interface DailyEntry {
  id: string;
  date: string;
  note?: string;
  image?: string;
  updatedAt: string;
  user: UserSnippet;
  hashtags: { hashtag: Hashtag }[];
}

interface ClosetEntry {
  id: string;
  title: string;
  description?: string;
  price?: number;
  image?: string;
  createdAt: string;
  user: UserSnippet;
  hashtags: { hashtag: Hashtag }[];
}

interface WorkEntry {
  id: string;
  title: string;
  description?: string;
  category?: string;
  image?: string;
  createdAt: string;
  user: UserSnippet;
  hashtags: { hashtag: Hashtag }[];
}

interface FeedData {
  dailyFromFollowed: DailyEntry[];
  dailyFromTags: DailyEntry[];
  closetItems: ClosetEntry[];
  workItems: WorkEntry[];
  isEmpty: boolean;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Avatar({ u, size = "md" }: { u: UserSnippet; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${cls} rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 flex-shrink-0 overflow-hidden`}>
      {u.image
        ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
        : (u.name?.[0] ?? "?").toUpperCase()
      }
    </div>
  );
}

function DailyCard({ entry, isTagFeed, myId }: { entry: DailyEntry; isTagFeed?: boolean; myId?: string }) {
  const isToday = entry.date === new Date().toISOString().split("T")[0];
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (myId && isToday) {
      fetch(`/api/reactions?dailyProfileId=${entry.id}`).then((r) => r.json()).then((d) => {
        setLiked(d.liked ?? false); setLikeCount(d.count ?? 0);
      }).catch(() => {});
    }
  }, [entry.id, myId, isToday]);

  async function toggleLike() {
    if (!myId) return;
    setLiked((p) => !p);
    setLikeCount((p) => liked ? p - 1 : p + 1);
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyProfileId: entry.id }),
      });
      if (res.ok) { const d = await res.json(); setLiked(d.liked); setLikeCount(d.count); }
    } catch { setLiked((p) => !p); setLikeCount((p) => liked ? p + 1 : p - 1); }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <Link href={`/profile/${entry.user.id}`}>
          <Avatar u={entry.user} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/profile/${entry.user.id}`} className="font-semibold text-gray-900 text-sm hover:text-indigo-600 transition">
                {entry.user.name || "Anonymous"}
              </Link>
              {entry.user.username && (
                <span className="text-xs text-gray-400 ml-1.5">@{entry.user.username}</span>
              )}
              {entry.user.occupation && (
                <p className="text-xs text-indigo-600 mt-0.5">{entry.user.occupation}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs text-gray-400">{timeAgo(entry.updatedAt)}</span>
              {isToday && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Today</span>}
              {isTagFeed && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">#tag match</span>}
            </div>
          </div>
        </div>
      </div>
      {entry.note && (
        <p className="px-4 pb-2 text-sm text-gray-600 leading-relaxed">{entry.note}</p>
      )}
      {entry.image && (
        <div className="px-4 pb-3">
          <img src={entry.image} alt="Today's photo" className="w-full rounded-xl object-cover max-h-72" />
        </div>
      )}
      {entry.hashtags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {entry.hashtags.map(({ hashtag }) => (
            <Link
              key={hashtag.id}
              href={`/tag/${hashtag.name}`}
              className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full hover:bg-indigo-100 transition font-medium"
            >
              #{hashtag.name}
            </Link>
          ))}
        </div>
      )}
      {myId && isToday && (
        <div className="px-4 pb-3 flex items-center gap-2 border-t border-gray-50 pt-2.5">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full transition ${
              liked ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500"
            }`}
          >
            <span>{liked ? "❤️" : "🤍"}</span>
            <span className="text-xs font-medium">{liked ? "Liked" : "Like"}{likeCount > 0 ? ` · ${likeCount}` : ""}</span>
          </button>
          <Link
            href={`/messages?to=${entry.user.id}&name=${encodeURIComponent(entry.user.name || "")}`}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            Message →
          </Link>
        </div>
      )}
    </div>
  );
}

function ClosetCard({ item }: { item: ClosetEntry }) {
  return (
    <Link href={`/closet/${item.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
        {item.image && (
          <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
        )}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-2">
            <Avatar u={item.user} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">{item.user.name} listed</p>
              <p className="font-semibold text-gray-900 text-sm truncate">{item.title}</p>
            </div>
            {item.price != null && (
              <span className="text-indigo-600 font-bold text-sm flex-shrink-0">${item.price.toFixed(2)}</span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {item.hashtags.slice(0, 3).map(({ hashtag }) => (
              <span key={hashtag.id} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                #{hashtag.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">{timeAgo(item.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
}

function WorkCard({ item }: { item: WorkEntry }) {
  return (
    <Link href={`/work/${item.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
        {item.image && (
          <img src={item.image} alt={item.title} className="w-full h-32 object-cover" />
        )}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-2">
            <Avatar u={item.user} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">{item.user.name} offers</p>
              <p className="font-semibold text-gray-900 text-sm truncate">{item.title}</p>
            </div>
            {item.category && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">{item.category}</span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {item.hashtags.slice(0, 3).map(({ hashtag }) => (
              <span key={hashtag.id} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                #{hashtag.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">{timeAgo(item.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const myId = (session?.user as { id?: string })?.id;
  const router = useRouter();
  const [feed, setFeed] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"all" | "people" | "closet" | "work">("all");
  const [newCount, setNewCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const load = useCallback(async () => {
    const lastVisit = typeof window !== "undefined"
      ? localStorage.getItem("spotid_feed_last_visit") : null;
    const res = await fetch("/api/feed");
    if (res.ok) {
      const data: FeedData = await res.json();
      setFeed(data);
      // Track cursor as the oldest updatedAt from followed-user daily entries
      const followed = data.dailyFromFollowed ?? [];
      if (followed.length >= 10) {
        setCursor(followed[followed.length - 1].updatedAt);
        setHasMore(true);
      } else {
        setCursor(null);
        setHasMore(false);
      }
      if (lastVisit) {
        const since = new Date(lastVisit).getTime();
        const allEntries = [
          ...(data.dailyFromFollowed ?? []).map((e) => e.updatedAt),
          ...(data.dailyFromTags ?? []).map((e) => e.updatedAt),
          ...(data.closetItems ?? []).map((e) => e.createdAt),
          ...(data.workItems ?? []).map((e) => e.createdAt),
        ];
        setNewCount(allEntries.filter((t) => new Date(t).getTime() > since).length);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("spotid_feed_last_visit", new Date().toISOString());
      }
    }
    setLoading(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}`);
    if (res.ok) {
      const data: FeedData = await res.json();
      const followed = data.dailyFromFollowed ?? [];
      setFeed((prev) => prev ? {
        ...prev,
        dailyFromFollowed: [...prev.dailyFromFollowed, ...followed],
      } : prev);
      if (followed.length >= 10) {
        setCursor(followed[followed.length - 1].updatedAt);
        setHasMore(true);
      } else {
        setCursor(null);
        setHasMore(false);
      }
    }
    setLoadingMore(false);
  }, [cursor, loadingMore]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/signin"); return; }
    if (status === "authenticated") load();
  }, [status, load, router]);

  if (loading || status === "loading") {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-gray-400">
        <p className="text-4xl animate-pulse mb-3">📰</p>
        <p>Loading your feed…</p>
      </div>
    );
  }

  if (feed?.isEmpty) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-5xl mb-4">📭</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your feed is empty</h2>
          <p className="text-gray-500 text-sm mb-6">
            Follow people and hashtags to see their activity here.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/discover" className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-full hover:bg-indigo-700 transition font-medium">
              Discover People
            </Link>
            <Link href="/trending" className="bg-gray-100 text-gray-700 text-sm px-5 py-2 rounded-full hover:bg-gray-200 transition font-medium">
              Browse Trending Tags
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allDailyEntries = [
    ...(feed?.dailyFromFollowed || []).map((e) => ({ ...e, _source: "followed" as const })),
    ...(feed?.dailyFromTags || []).map((e) => ({ ...e, _source: "tag" as const })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const hasCloset = (feed?.closetItems.length ?? 0) > 0;
  const hasWork = (feed?.workItems.length ?? 0) > 0;
  const hasDailyFromTags = (feed?.dailyFromTags.length ?? 0) > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-16 px-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Your Feed</h1>
          <p className="text-sm text-gray-500 mt-0.5">Activity from people and tags you follow</p>
        </div>
        <button
          onClick={load}
          className="text-xs text-indigo-600 hover:underline font-medium"
        >
          ↻ Refresh
        </button>
      </div>

      {/* New-since-last-visit banner */}
      {newCount > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <p className="text-sm text-indigo-700 font-medium">
            ✨ {newCount} new update{newCount !== 1 ? "s" : ""} since your last visit
          </p>
          <button onClick={() => setNewCount(0)} className="text-xs text-indigo-400 hover:text-indigo-600">
            Dismiss
          </button>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          { id: "all", label: "All" },
          { id: "people", label: "People" },
          ...(hasCloset ? [{ id: "closet", label: "For Sale" }] : []),
          ...(hasWork ? [{ id: "work", label: "Services" }] : []),
        ] as { id: typeof activeSection; label: string }[]).map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition ${
              activeSection === s.id
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* People section */}
      {(activeSection === "all" || activeSection === "people") && (
        <>
          {allDailyEntries.length > 0 ? (
            <>
              {hasDailyFromTags && activeSection === "all" && (feed?.dailyFromFollowed.length ?? 0) > 0 && (
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1">
                  People you follow
                </p>
              )}
              {(feed?.dailyFromFollowed || []).map((entry) => (
                <DailyCard key={entry.id} entry={entry} myId={myId} />
              ))}
              {hasDailyFromTags && (
                <>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1">
                    From your followed tags (today)
                  </p>
                  {feed!.dailyFromTags.map((entry) => (
                    <DailyCard key={entry.id} entry={entry} isTagFeed myId={myId} />
                  ))}
                </>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">😴</p>
              <p className="text-sm">No one you follow has tagged recently.</p>
              <Link href="/discover" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">
                Discover more people →
              </Link>
            </div>
          )}
        </>
      )}

      {/* For Sale section */}
      {(activeSection === "all" || activeSection === "closet") && hasCloset && (
        <>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1 mt-2">
            New listings from people you follow
          </p>
          <div className="grid grid-cols-2 gap-3">
            {feed!.closetItems.map((item) => (
              <ClosetCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      {/* Services section */}
      {(activeSection === "all" || activeSection === "work") && hasWork && (
        <>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1 mt-2">
            New services from people you follow
          </p>
          <div className="grid grid-cols-1 gap-3">
            {feed!.workItems.map((item) => (
              <WorkCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      {/* Load More for followed-user daily entries */}
      {(activeSection === "all" || activeSection === "people") && hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full text-sm text-indigo-600 font-medium hover:underline disabled:opacity-40 py-2"
        >
          {loadingMore ? "Loading…" : "Load older activity →"}
        </button>
      )}

      <p className="text-center text-xs text-gray-400 pt-4">
        Showing activity from the last 7 days ·{" "}
        <Link href="/discover" className="text-indigo-500 hover:underline">Discover more people</Link>
      </p>
    </div>
  );
}
