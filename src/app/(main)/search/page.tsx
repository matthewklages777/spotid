"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface User {
  id: string; name?: string; image?: string; bio?: string; location?: string; occupation?: string; username?: string;
  dailyProfiles: { hashtags: { hashtag: { id: string; name: string } }[] }[];
}
type Profile = Omit<User, "dailyProfiles"> & {
  dailyProfiles: { hashtags: { hashtag: { id: string; name: string } }[] }[];
};
interface ClosetItem {
  id: string; title: string; description?: string; price?: number; image?: string;
  hashtags: { hashtag: { id: string; name: string } }[];
  user: { id: string; name?: string; image?: string };
}
interface WorkItem {
  id: string; title: string; description?: string; category?: string; contactInfo?: string; image?: string;
  hashtags: { hashtag: { id: string; name: string } }[];
  user: { id: string; name?: string; image?: string };
}

type FilterType = "all" | "people" | "closet" | "work";

const FILTER_OPTIONS: { key: FilterType; label: string; icon: string; desc: string }[] = [
  { key: "all",     label: "Everything",  icon: "🔍", desc: "People, items & services" },
  { key: "people",  label: "People",      icon: "👤", desc: "Active today at that tag" },
  { key: "closet",  label: "Items",       icon: "🏷️", desc: "For sale right now" },
  { key: "work",    label: "Services",    icon: "💼", desc: "Work & professionals" },
];

const EXAMPLE_SEARCHES = [
  "#Plano #Starbucks",
  "#vintage #greenlampe #antique",
  "#bluejeans #blackshirt",
  "#Gruene #Texas #antiques",
  "#freelance #designer #Dallas",
  "#available #realestate",
];

const RECENT_KEY = "spotid_recent_searches";
const MAX_RECENT = 8;

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function saveRecent(q: string) {
  try {
    const list = [q, ...getRecent().filter((r) => r !== q)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {}
}
function clearRecent() {
  try { localStorage.removeItem(RECENT_KEY); } catch {}
}

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string })?.id;
  const [q, setQ] = useState(params.get("q") || "");
  const [type, setType] = useState<FilterType>((params.get("type") as FilterType) || "all");
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [closet, setCloset] = useState<ClosetItem[]>([]);
  const [work, setWork] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string; count: number }[]>([]);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecentSearches(getRecent());
    const qParam = params.get("q");
    if (qParam) { setQ(qParam); runSearch(qParam, type); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleQueryChange(val: string) {
    setQ(val);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    const token = val.split(/[\s,]+/).pop()?.replace(/^#/, "") || "";
    if (token.length < 2) { setSuggestions([]); return; }
    suggestTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/suggest?q=${encodeURIComponent(token)}`);
      if (res.ok) setSuggestions(await res.json());
    }, 200);
  }

  function applySuggestion(tagName: string) {
    const parts = q.split(/[\s,]+/);
    parts[parts.length - 1] = `#${tagName}`;
    const next = parts.join(" ") + " ";
    setQ(next);
    setSuggestions([]);
  }

  async function runSearch(query: string, t: FilterType) {
    if (!query.trim()) return;

    // Direct @username lookup — navigate to that profile if found
    const usernameMatch = query.trim().match(/^@([a-z0-9_]+)$/i);
    if (usernameMatch) {
      const username = usernameMatch[1].toLowerCase();
      router.push(`/u/${username}`);
      return;
    }

    setLoading(true);
    setSearched(true);
    setShowRecent(false);
    saveRecent(query.trim());
    setRecentSearches(getRecent());
    router.replace(`/search?q=${encodeURIComponent(query)}&type=${t}`, { scroll: false });
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${t}`);
    const data = await res.json();
    setUsers(data.users || []);
    setProfiles(data.profiles || []);
    setCloset(data.closet || []);
    setWork(data.work || []);
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(q, type);
  }

  function switchType(t: FilterType) {
    setType(t);
    if (searched) runSearch(q, t);
  }

  const total = users.length + profiles.length + closet.length + work.length;
  const parsedTags = q.split(/[\s,]+/).map((t) => t.toLowerCase().replace(/^#/, "")).filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Search header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <h1 className="text-2xl font-bold text-white">Find Anything</h1>
          <p className="text-indigo-200 text-sm mt-0.5">
            Search by hashtag — find people, items, antiques, services, places, anything that&apos;s been tagged
          </p>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">#</span>
              <input
                type="text"
                value={q}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => setShowRecent(true)}
                onBlur={() => setTimeout(() => { setShowRecent(false); setSuggestions([]); }, 200)}
                placeholder="Plano   Starbucks   vintage   greenLamp   Gruene…"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              {/* Hashtag suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
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
              {/* Recent searches (shown when no suggestions) */}
              {showRecent && suggestions.length === 0 && recentSearches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500">Recent searches</p>
                    <button
                      type="button"
                      onClick={() => { clearRecent(); setRecentSearches([]); setShowRecent(false); }}
                      className="text-xs text-gray-400 hover:text-red-500 transition"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onMouseDown={() => { setQ(r); runSearch(r, type); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition flex items-center gap-2"
                    >
                      <span className="text-gray-400 text-xs">🕐</span> {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !q.trim()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 transition whitespace-nowrap"
            >
              {loading ? "…" : "Search"}
            </button>
          </form>

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => switchType(f.key)}
                className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full border transition ${
                  type === f.key
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600"
                }`}
              >
                <span>{f.icon}</span>
                <span className="font-medium">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Example searches (only before first search) */}
      {!searched && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Try a search</h2>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_SEARCHES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setQ(ex); runSearch(ex, type); }}
                className="text-sm bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-600 px-3 py-1.5 rounded-full transition"
              >
                {ex}
              </button>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "👤", title: "Find people today", desc: "Search a location or place name to see who tagged themselves there right now." },
              { icon: "🏺", title: "Find rare items", desc: "Search an antique, vintage piece, or collectible and find sellers who tagged it." },
              { icon: "💼", title: "Find services", desc: "Search a skill, trade, or industry to discover professionals in your area." },
            ].map((c) => (
              <div key={c.title} className="bg-gray-50 rounded-xl p-4">
                <p className="text-2xl mb-2">{c.icon}</p>
                <p className="font-semibold text-gray-900 text-sm">{c.title}</p>
                <p className="text-xs text-gray-500 mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3 animate-pulse">🔍</p>
          <p className="font-medium">Searching…</p>
        </div>
      )}

      {/* Results summary */}
      {searched && !loading && (
        <div className="flex items-center gap-3 px-1">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{total}</span> result{total !== 1 ? "s" : ""} for{" "}
          </p>
          <div className="flex gap-1 flex-wrap">
            {parsedTags.map((tag) => (
              <span key={tag} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* People results */}
      {!loading && users.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span>👤</span> People Active Today
            <span className="text-sm font-normal text-gray-400">({users.length})</span>
          </h2>
          {users.map((u) => (
            <div key={u.id} onClick={() => router.push(`/profile/${u.id}`)}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-300 hover:shadow-sm transition flex items-start gap-4 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600 flex-shrink-0 overflow-hidden">
                {u.image
                  ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                  : (u.name?.[0] ?? "?").toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{u.name || "Anonymous"}</p>
                    {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
                    {u.occupation && <p className="text-sm text-indigo-600">{u.occupation}</p>}
                    {u.location && <p className="text-xs text-gray-500 mt-0.5">📍 {u.location}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                      Active Today
                    </span>
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
                <div className="flex flex-wrap gap-1 mt-2">
                  {u.dailyProfiles[0]?.hashtags.map(({ hashtag }) => (
                    <span key={hashtag.id}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        parsedTags.includes(hashtag.name)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                      #{hashtag.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Permanent profile results */}
      {!loading && profiles.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span>🪪</span> Profiles
            <span className="text-sm font-normal text-gray-400">({profiles.length})</span>
          </h2>
          {profiles.map((u) => (
            <div key={u.id} onClick={() => router.push(`/profile/${u.id}`)}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-300 hover:shadow-sm transition flex items-start gap-4 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600 flex-shrink-0 overflow-hidden">
                {u.image
                  ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                  : (u.name?.[0] ?? "?").toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{u.name || "Anonymous"}</p>
                    {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
                    {u.occupation && <p className="text-sm text-indigo-600">{u.occupation}</p>}
                    {u.location && <p className="text-xs text-gray-500 mt-0.5">📍 {u.location}</p>}
                    {u.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{u.bio}</p>}
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
                {u.dailyProfiles[0]?.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {u.dailyProfiles[0].hashtags.map(({ hashtag }) => (
                      <span key={hashtag.id} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        #{hashtag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Items / Closet results */}
      {!loading && closet.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span>🏷️</span> Items For Sale
            <span className="text-sm font-normal text-gray-400">({closet.length})</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {closet.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/closet/${item.id}`)}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-indigo-300 hover:shadow-sm transition cursor-pointer"
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center text-4xl">
                    🏷️
                  </div>
                )}
                <div className="p-3">
                  <p className="font-semibold text-gray-900 text-sm truncate">{item.title}</p>
                  {item.price != null && (
                    <p className="text-indigo-600 font-bold text-sm">${item.price.toFixed(2)}</p>
                  )}
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-gray-400">
                      by <span className="font-medium">{item.user.name}</span>
                    </p>
                    {myId && myId !== item.user.id && (
                      <Link
                        href={`/messages?to=${item.user.id}&name=${encodeURIComponent(item.user.name || "")}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        Message →
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.hashtags.slice(0, 3).map(({ hashtag }) => (
                      <span key={hashtag.id}
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          parsedTags.includes(hashtag.name)
                            ? "bg-indigo-100 text-indigo-600"
                            : "text-gray-400"
                        }`}>
                        #{hashtag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work / Services results */}
      {!loading && work.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span>💼</span> Services & Work
            <span className="text-sm font-normal text-gray-400">({work.length})</span>
          </h2>
          {work.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/work/${item.id}`)}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-300 hover:shadow-sm transition cursor-pointer"
            >
              <div className="flex gap-3">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl flex-shrink-0">
                    💼
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    {item.category && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {item.category}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">
                      by <span className="font-medium">{item.user.name}</span>
                    </p>
                    {myId && myId !== item.user.id && (
                      <Link
                        href={`/messages?to=${item.user.id}&name=${encodeURIComponent(item.user.name || "")}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        Message →
                      </Link>
                    )}
                  </div>
                  {item.contactInfo && (
                    <p className="text-sm text-emerald-600 font-medium mt-1">{item.contactInfo}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.hashtags.slice(0, 4).map(({ hashtag }) => (
                      <span key={hashtag.id}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          parsedTags.includes(hashtag.name)
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                        #{hashtag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {searched && !loading && total === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nothing found yet</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            No one has tagged{" "}
            {parsedTags.map((t, i) => (
              <span key={t}>
                <span className="font-semibold text-indigo-600">#{t}</span>
                {i < parsedTags.length - 1 ? " or " : ""}
              </span>
            ))}{" "}
            yet — but they might tomorrow. SpotId grows as more people join.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32 text-gray-400">Loading…</div>}>
      <SearchContent />
    </Suspense>
  );
}
