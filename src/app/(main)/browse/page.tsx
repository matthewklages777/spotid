"use client";
import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type BrowseType = "closet" | "work";

interface Hashtag { id: string; name: string }
interface UserSnippet { id: string; name?: string; image?: string; username?: string }

interface ClosetItem {
  id: string; title: string; description?: string; price?: number; image?: string; createdAt: string;
  hashtags: { hashtag: Hashtag }[];
  user: UserSnippet;
}

interface WorkItem {
  id: string; title: string; description?: string; category?: string; image?: string; createdAt: string;
  hashtags: { hashtag: Hashtag }[];
  user: UserSnippet;
}

type AnyItem = ClosetItem | WorkItem;

function isCloset(item: AnyItem): item is ClosetItem {
  return "price" in item;
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

function BrowseContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [type, setType] = useState<BrowseType>((params.get("type") as BrowseType) || "closet");
  const [q, setQ] = useState(params.get("q") || "");
  const [items, setItems] = useState<AnyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (t: BrowseType, query: string, newSkip: number, append: boolean) => {
    if (newSkip === 0) setLoading(true); else setLoadingMore(true);
    const qs = new URLSearchParams({ type: t, skip: String(newSkip) });
    if (query.trim()) qs.set("q", query.trim());
    const res = await fetch(`/api/browse?${qs}`);
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => append ? [...prev, ...data.items] : data.items);
      setHasMore(data.hasMore);
      setSkip(newSkip + data.items.length);
    }
    if (newSkip === 0) setLoading(false); else setLoadingMore(false);
  }, []);

  useEffect(() => {
    load(type, q, 0, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTypeChange(t: BrowseType) {
    setType(t);
    setSkip(0);
    router.replace(`/browse?type=${t}${q.trim() ? `&q=${encodeURIComponent(q)}` : ""}`, { scroll: false });
    load(t, q, 0, false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSkip(0);
    router.replace(`/browse?type=${type}${q.trim() ? `&q=${encodeURIComponent(q)}` : ""}`, { scroll: false });
    load(type, q, 0, false);
  }

  function loadMore() {
    load(type, q, skip, true);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
          <h1 className="text-2xl font-bold text-white">Browse SpotId</h1>
          <p className="text-indigo-200 text-sm mt-0.5">
            Explore items for sale and services from the SpotId community
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Type tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => handleTypeChange("closet")}
              className={`flex-1 text-sm font-semibold py-2 rounded-xl transition ${
                type === "closet"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              🏷️ Items For Sale
            </button>
            <button
              onClick={() => handleTypeChange("work")}
              className={`flex-1 text-sm font-semibold py-2 rounded-xl transition ${
                type === "work"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              💼 Services & Work
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={type === "closet" ? "Search by tag — vintage, antique, leather…" : "Search by tag — design, plumbing, consulting…"}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Search
            </button>
            {q && (
              <button
                type="button"
                onClick={() => { setQ(""); load(type, "", 0, false); router.replace(`/browse?type=${type}`, { scroll: false }); }}
                className="text-gray-400 hover:text-gray-600 px-3 transition"
              >
                ✕
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-5xl mb-4">{type === "closet" ? "🏷️" : "💼"}</p>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Nothing here yet</h2>
          <p className="text-gray-500 text-sm">
            {q
              ? `No ${type === "closet" ? "items" : "services"} match "${q}" — try different tags.`
              : `No ${type === "closet" ? "items for sale" : "service listings"} yet. Be the first!`}
          </p>
          <Link
            href={type === "closet" ? "/closet" : "/work"}
            className={`inline-block mt-5 text-sm px-5 py-2 rounded-full font-semibold transition text-white ${
              type === "closet" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            Add your {type === "closet" ? "listing" : "service"} →
          </Link>
        </div>
      ) : type === "closet" ? (
        /* ── Closet grid ── */
        <div className="space-y-4">
          <p className="text-sm text-gray-500 px-1">
            {q && <><span className="font-semibold text-gray-900">{items.length}{hasMore ? "+" : ""}</span> results for <span className="text-indigo-600">#{q.replace(/^#/, "")}</span></>}
            {!q && <><span className="font-semibold text-gray-900">{items.length}{hasMore ? "+" : ""}</span> items listed</>}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(items as ClosetItem[]).map((item) => (
              <Link key={item.id} href={`/closet/${item.id}`}>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-indigo-300 hover:shadow-md transition group">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-200" />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center text-4xl">
                      🏷️
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.title}</p>
                    {item.price != null ? (
                      <p className="text-indigo-600 font-bold text-sm mt-0.5">${item.price.toFixed(2)}</p>
                    ) : (
                      <p className="text-gray-400 text-xs mt-0.5">Price not listed</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                        {item.user.image
                          ? <img src={item.user.image} alt="" className="w-full h-full object-cover" />
                          : (item.user.name?.[0] ?? "?").toUpperCase()
                        }
                      </div>
                      <p className="text-xs text-gray-400 truncate">{item.user.name || "Anonymous"}</p>
                    </div>
                    {item.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.hashtags.slice(0, 2).map(({ hashtag }) => (
                          <span key={hashtag.id} className="text-xs text-gray-400">#{hashtag.name}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-300 mt-1">{timeAgo(item.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-white border border-gray-200 text-indigo-600 text-sm font-semibold px-8 py-2.5 rounded-full hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-40 transition"
              >
                {loadingMore ? "Loading…" : "Load more listings →"}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Work list ── */
        <div className="space-y-4">
          <p className="text-sm text-gray-500 px-1">
            {q && <><span className="font-semibold text-gray-900">{items.length}{hasMore ? "+" : ""}</span> services for <span className="text-emerald-600">#{q.replace(/^#/, "")}</span></>}
            {!q && <><span className="font-semibold text-gray-900">{items.length}{hasMore ? "+" : ""}</span> service listings</>}
          </p>
          <div className="space-y-3">
            {(items as WorkItem[]).map((item) => (
              <Link key={item.id} href={`/work/${item.id}`}>
                <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-emerald-300 hover:shadow-sm transition cursor-pointer flex gap-4">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center text-3xl flex-shrink-0">
                      💼
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                        {item.category && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs overflow-hidden">
                          {item.user.image
                            ? <img src={item.user.image} alt="" className="w-full h-full object-cover" />
                            : (item.user.name?.[0] ?? "?").toUpperCase()
                          }
                        </div>
                        <p className="text-xs text-gray-500">{item.user.name || "Anonymous"}</p>
                      </div>
                      {item.hashtags.slice(0, 3).map(({ hashtag }) => (
                        <span key={hashtag.id} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                          #{hashtag.name}
                        </span>
                      ))}
                      <span className="text-xs text-gray-300 ml-auto">{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-white border border-gray-200 text-emerald-600 text-sm font-semibold px-8 py-2.5 rounded-full hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-40 transition"
              >
                {loadingMore ? "Loading…" : "Load more services →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* CTA for non-listed users */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 text-center">
        <p className="font-bold text-gray-900 mb-1">
          {type === "closet" ? "Have something to sell?" : "Offer a service?"}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          {type === "closet"
            ? "List your items on SpotId and let buyers find you by hashtag."
            : "Create a service listing and let clients find you by what you do."}
        </p>
        <Link
          href={type === "closet" ? "/closet" : "/work"}
          className={`inline-block text-sm font-semibold px-6 py-2.5 rounded-full text-white transition ${
            type === "closet" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {type === "closet" ? "List an Item →" : "Add a Service →"}
        </Link>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto py-20 text-center text-gray-400">
        <p className="text-4xl mb-3 animate-pulse">🏪</p>
        <p>Loading marketplace…</p>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
