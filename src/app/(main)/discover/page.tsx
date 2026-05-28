"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Hashtag { id: string; name: string }
interface DailyProfile { image?: string; hashtags: { hashtag: Hashtag }[] }
interface ActiveUser {
  id: string; name?: string; image?: string;
  location?: string; occupation?: string; username?: string;
  isPremium?: boolean;
  dailyProfiles: DailyProfile[];
}
interface ClosetItem {
  id: string; title: string; description?: string; price?: number; image?: string; createdAt: string;
  hashtags: { hashtag: Hashtag }[];
  user: { id: string; name?: string; image?: string };
}
interface WorkItem {
  id: string; title: string; description?: string; category?: string; image?: string; createdAt: string;
  hashtags: { hashtag: Hashtag }[];
  user: { id: string; name?: string; image?: string };
}
interface DiscoverData {
  activeUsers: ActiveUser[];
  recentCloset: ClosetItem[];
  recentWork: WorkItem[];
}
interface SuggestedPerson {
  id: string; name?: string; image?: string; occupation?: string; location?: string;
  username?: string; openToContact: boolean; overlapCount: number; overlapTags: string[];
  isPremium?: boolean;
}

type Tab = "everyone" | "following" | "foryou" | "nearby";

function Avatar({ image, name, size = "md" }: { image?: string; name?: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${cls} rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 flex-shrink-0 overflow-hidden`}>
      {image
        ? <img src={image} alt={name} className="w-full h-full object-cover" />
        : (name?.[0] ?? "?").toUpperCase()
      }
    </div>
  );
}

function UserRow({ u, myId }: { u: ActiveUser; myId?: string }) {
  const router = useRouter();
  const todayDaily = u.dailyProfiles[0];
  return (
    <div
      className="hover:bg-gray-50 transition cursor-pointer overflow-hidden"
      onClick={() => router.push(`/profile/${u.id}`)}
    >
      {todayDaily?.image && (
        <div className="w-full h-32 overflow-hidden">
          <img src={todayDaily.image} alt="Today's photo" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-start gap-4 px-5 py-3.5">
        <Avatar image={u.image} name={u.name} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">
            {u.name || "Anonymous"}{u.isPremium && <span className="ml-1 text-xs">✅</span>}
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
                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition"
              >
                #{hashtag.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
          {myId && myId !== u.id && (
            <Link
              href={`/messages?to=${u.id}&name=${encodeURIComponent(u.name || "")}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Message →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string })?.id;
  const [tab, setTab] = useState<Tab>("everyone");
  const [data, setData] = useState<DiscoverData | null>(null);
  const [followingData, setFollowingData] = useState<ActiveUser[]>([]);
  const [suggested, setSuggested] = useState<SuggestedPerson[]>([]);
  const [nearbyData, setNearbyData] = useState<{ location: string | null; users: ActiveUser[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingHasMore, setFollowingHasMore] = useState(false);
  const [followingLoadingMore, setFollowingLoadingMore] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const load = useCallback(async (isRefresh = false, loc?: string) => {
    if (isRefresh) setRefreshing(true);
    const locParam = loc !== undefined ? loc : locationFilter;
    const discoverUrl = locParam ? `/api/discover?location=${encodeURIComponent(locParam)}` : "/api/discover";
    const [d, s] = await Promise.all([
      fetch(discoverUrl).then((r) => r.json()),
      fetch("/api/suggest-people").then((r) => r.json()).catch(() => []),
    ]);
    setData(d);
    setHasMore(d.hasMore ?? false);
    setSuggested(Array.isArray(s) ? s : []);
    setLoading(false);
    setRefreshing(false);
    setLastUpdated(new Date());
  }, [locationFilter]);

  const loadMore = useCallback(async () => {
    if (!data || loadingMore) return;
    setLoadingMore(true);
    const locParam = locationFilter;
    const skip = data.activeUsers.length;
    const url = `/api/discover?skip=${skip}${locParam ? `&location=${encodeURIComponent(locParam)}` : ""}`;
    const d = await fetch(url).then((r) => r.json()).catch(() => null);
    if (d) {
      setData((prev) => prev ? { ...prev, activeUsers: [...prev.activeUsers, ...d.activeUsers] } : d);
      setHasMore(d.hasMore ?? false);
    }
    setLoadingMore(false);
  }, [data, loadingMore, locationFilter]);

  const loadFollowing = useCallback(async () => {
    if (!myId) return;
    setFollowingLoading(true);
    const res = await fetch("/api/discover?following=1").then((r) => r.json()).catch(() => ({ activeUsers: [] }));
    setFollowingData(res.activeUsers || []);
    setFollowingHasMore(res.hasMore ?? false);
    setFollowingLoading(false);
  }, [myId]);

  const loadMoreFollowing = useCallback(async () => {
    if (followingLoadingMore) return;
    setFollowingLoadingMore(true);
    const skip = followingData.length;
    const d = await fetch(`/api/discover?following=1&skip=${skip}`).then((r) => r.json()).catch(() => null);
    if (d) {
      setFollowingData((prev) => [...prev, ...(d.activeUsers || [])]);
      setFollowingHasMore(d.hasMore ?? false);
    }
    setFollowingLoadingMore(false);
  }, [followingData.length, followingLoadingMore]);

  const loadNearby = useCallback(async () => {
    if (!myId) return;
    setNearbyLoading(true);
    const res = await fetch("/api/discover/nearby").then((r) => r.json()).catch(() => ({ location: null, users: [] }));
    setNearbyData(res);
    setNearbyLoading(false);
  }, [myId]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (tab === "following" && myId) loadFollowing();
    if (tab === "nearby" && myId) loadNearby();
  }, [tab, myId, loadFollowing, loadNearby]);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "everyone", label: "Everyone", show: true },
    { id: "following", label: "Following", show: !!myId },
    { id: "nearby", label: "📍 Nearby", show: !!myId },
    { id: "foryou", label: "For You", show: !!myId && suggested.length > 0 },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-8 py-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Discover</h1>
              <p className="text-indigo-200 text-sm mt-1">{today} · Who&apos;s tagged, what&apos;s for sale, who&apos;s available</p>
            </div>
            <button
              onClick={() => { load(true); if (tab === "following") loadFollowing(); }}
              disabled={refreshing}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-full transition mt-1 flex-shrink-0"
            >
              <span className={refreshing ? "animate-spin inline-block" : ""}>↻</span>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          {lastUpdated && (
            <p className="text-indigo-300 text-xs mt-2">
              Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.filter((t) => t.show).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 text-sm font-medium py-3 transition border-b-2 ${
                tab === t.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Location filter */}
        <div className="px-6 py-3 flex items-center gap-2">
          <span className="text-gray-400 text-sm">📍</span>
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const loc = locationInput.trim();
              setLocationFilter(loc);
              load(true, loc);
            }}
          >
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Filter by city or location…"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {locationInput && (
              <button type="submit" className="text-xs text-indigo-600 hover:underline font-medium whitespace-nowrap">
                Apply
              </button>
            )}
            {locationFilter && (
              <button
                type="button"
                onClick={() => { setLocationInput(""); setLocationFilter(""); load(true, ""); }}
                className="text-xs text-gray-400 hover:text-red-500 transition"
              >
                ✕ Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3 animate-pulse">🌐</p>
          <p>Loading…</p>
        </div>
      ) : (
        <>
          {/* ── Following tab ── */}
          {tab === "following" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
                <div>
                  <h2 className="font-bold text-gray-900">People You Follow</h2>
                  <p className="text-xs text-gray-500">
                    {followingLoading ? "Loading…" : `${followingData.length} tagged today`}
                  </p>
                </div>
              </div>
              {followingLoading ? (
                <p className="text-center py-10 text-gray-400 text-sm">Loading…</p>
              ) : followingData.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-3xl mb-3">👤</p>
                  <p className="text-gray-500 font-medium text-sm">No one you follow has tagged today</p>
                  <p className="text-xs text-gray-400 mt-1">Follow more people from the Everyone tab or their profiles</p>
                  <button
                    onClick={() => setTab("everyone")}
                    className="mt-4 text-sm text-indigo-600 hover:underline"
                  >
                    Browse Everyone →
                  </button>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-50">
                    {followingData.map((u) => (
                      <UserRow key={u.id} u={u} myId={myId} />
                    ))}
                  </div>
                  {followingHasMore && (
                    <div className="px-6 py-4 border-t border-gray-50">
                      <button
                        onClick={loadMoreFollowing}
                        disabled={followingLoadingMore}
                        className="w-full text-sm text-indigo-600 font-medium hover:underline disabled:opacity-40 py-1"
                      >
                        {followingLoadingMore ? "Loading…" : "Load more →"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Nearby tab ── */}
          {tab === "nearby" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <span className="text-lg">📍</span>
                <div>
                  <h2 className="font-bold text-gray-900">People Nearby</h2>
                  <p className="text-xs text-gray-500">
                    {nearbyLoading
                      ? "Detecting location…"
                      : nearbyData?.location
                        ? `Near ${nearbyData.location} · ${nearbyData.users.length} tagged today`
                        : "Add your location to find nearby people"}
                  </p>
                </div>
              </div>

              {nearbyLoading ? (
                <p className="text-center py-10 text-gray-400 text-sm animate-pulse">Finding people near you…</p>
              ) : !nearbyData?.location ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-4xl mb-3">🗺️</p>
                  <p className="text-gray-700 font-semibold text-sm">No location set</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    Add a city to your profile to discover people tagging nearby.
                  </p>
                  <Link
                    href={myId ? `/profile/${myId}` : "/settings"}
                    className="mt-4 inline-block text-sm bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700 transition"
                  >
                    Edit Profile →
                  </Link>
                </div>
              ) : nearbyData.users.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-4xl mb-3">🏙️</p>
                  <p className="text-gray-700 font-semibold text-sm">No one nearby tagged today</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Near <span className="font-medium">{nearbyData.location}</span> · Check back later or invite local friends.
                  </p>
                  <Link
                    href="/invite"
                    className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
                  >
                    Invite friends →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {nearbyData.users.map((u) => (
                    <UserRow key={u.id} u={u} myId={myId} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── For You tab ── */}
          {tab === "foryou" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <span className="text-lg">✨</span>
                <div>
                  <h2 className="font-bold text-gray-900">People Like You</h2>
                  <p className="text-xs text-gray-500">Tagged similar things today</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {suggested.map((u) => (
                  <Link key={u.id} href={`/profile/${u.id}`}>
                    <div className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-50 transition">
                      <Avatar image={u.image} name={u.name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                          {u.name || "Anonymous"}{u.isPremium && <span className="text-blue-500 text-xs">✅</span>}
                        </p>
                        {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
                        {u.occupation && <p className="text-xs text-indigo-600">{u.occupation}</p>}
                        {u.location && <p className="text-xs text-gray-400">📍 {u.location}</p>}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {u.overlapTags.slice(0, 5).map((tag) => (
                            <span key={tag} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          {u.overlapCount} in common
                        </span>
                        {myId && u.openToContact && (
                          <Link
                            href={`/messages?to=${u.id}&name=${encodeURIComponent(u.name || "")}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-indigo-600 hover:underline font-medium"
                          >
                            Message →
                          </Link>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Everyone tab ── */}
          {tab === "everyone" && (
            <>
              {/* People Like You (inline, not full tab) */}
              {suggested.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <span className="text-lg">✨</span>
                    <div>
                      <h2 className="font-bold text-gray-900">People Like You</h2>
                      <p className="text-xs text-gray-500">Tagged similar things today</p>
                    </div>
                    {myId && (
                      <button onClick={() => setTab("foryou")} className="ml-auto text-xs text-indigo-600 hover:underline">
                        See all →
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {suggested.slice(0, 3).map((u) => (
                      <Link key={u.id} href={`/profile/${u.id}`}>
                        <div className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-50 transition">
                          <Avatar image={u.image} name={u.name} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                              {u.name || "Anonymous"}{u.isPremium && <span className="text-blue-500 text-xs">✅</span>}
                            </p>
                            {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {u.overlapTags.slice(0, 4).map((tag) => (
                                <span key={tag} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            {u.overlapCount} in common
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Active today */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  <div>
                    <h2 className="font-bold text-gray-900">People Active Today</h2>
                    <p className="text-xs text-gray-500">{data?.activeUsers.length ?? 0} tagged so far today</p>
                  </div>
                  <Link href="/search?type=people" className="ml-auto text-xs text-indigo-600 hover:underline">
                    Search people →
                  </Link>
                </div>

                {!data?.activeUsers.length ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-2xl mb-2">📅</p>
                    <p className="text-sm font-semibold text-gray-700 mb-1">No one has tagged yet today</p>
                    <p className="text-xs text-gray-400 mb-3">Be the first — tag your location, look, or plans and show up here.</p>
                    <Link href="/daily" className="text-xs bg-indigo-600 text-white font-bold px-4 py-2 rounded-full hover:bg-indigo-700 transition">
                      Tag Today →
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-50">
                      {data.activeUsers.map((u) => (
                        <UserRow key={u.id} u={u} myId={myId} />
                      ))}
                    </div>
                    {hasMore && (
                      <div className="px-6 py-4 border-t border-gray-50">
                        <button
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="w-full text-sm text-indigo-600 font-medium hover:underline disabled:opacity-40 py-1"
                        >
                          {loadingMore ? "Loading…" : "Load more people →"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* New listings */}
              {(data?.recentCloset.length ?? 0) > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-gray-900">🏷️ New For Sale</h2>
                      <p className="text-xs text-gray-500">Listed in the last 48 hours</p>
                    </div>
                    <Link href="/search?type=closet" className="text-xs text-indigo-600 hover:underline">
                      Browse all →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-x divide-y divide-gray-50">
                    {data!.recentCloset.map((item) => (
                      <Link key={item.id} href={`/closet/${item.id}`}>
                        <div className="hover:bg-gray-50 transition p-3">
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
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.hashtags.slice(0, 2).map(({ hashtag }) => (
                              <span key={hashtag.id} className="text-xs text-gray-400">#{hashtag.name}</span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* New services */}
              {(data?.recentWork.length ?? 0) > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-gray-900">💼 New Services</h2>
                      <p className="text-xs text-gray-500">Listed in the last 7 days</p>
                    </div>
                    <Link href="/search?type=work" className="text-xs text-indigo-600 hover:underline">
                      Browse all →
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {data!.recentWork.map((item) => (
                      <Link key={item.id} href={`/work/${item.id}`}>
                        <div className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-50 transition">
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
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.hashtags.slice(0, 3).map(({ hashtag }) => (
                                <span key={hashtag.id} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
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

              {/* Empty state — shown when platform has no content yet */}
              {!data?.activeUsers.length && !data?.recentCloset.length && !data?.recentWork.length && !suggested.length && (
                <div className="space-y-4">
                  {/* Founding Member call-to-action */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-8 text-center">
                    <p className="text-4xl mb-3">🌟</p>
                    <h2 className="text-xl font-black text-gray-900 mb-2">Be a Founding Member</h2>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto mb-4">
                      SpotId is brand new. The first 500 people to join earn a permanent
                      Founding Member badge — visible on their profile forever.
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                      <Link href="/daily" className="bg-indigo-600 text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-indigo-700 transition">
                        Tag Today →
                      </Link>
                      <Link href="/invite" className="bg-amber-500 text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-amber-600 transition">
                        Invite Friends
                      </Link>
                    </div>
                  </div>

                  {/* What this page will look like */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">This page will show…</p>
                    <div className="grid sm:grid-cols-3 gap-4 text-center">
                      {[
                        { emoji: "👥", title: "People Active Today", desc: "Everyone who tagged their location, look, or plans today — searchable and discoverable." },
                        { emoji: "🏪", title: "Recent Listings", desc: "Items people just listed in their Closet — vintage, antiques, everyday items for sale." },
                        { emoji: "💼", title: "Services Available", desc: "Professionals and freelancers who tagged their skills and availability today." },
                      ].map((c) => (
                        <div key={c.title} className="space-y-2">
                          <span className="text-3xl">{c.emoji}</span>
                          <p className="font-bold text-sm text-gray-900">{c.title}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="text-center text-xs text-gray-400 pt-2">
            Discover updates every 3 minutes · Search any tag to go deeper
          </div>
        </>
      )}
    </div>
  );
}
