"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface Person {
  id: string; name?: string; image?: string; bio?: string;
  occupation?: string; username?: string;
  activeToday: boolean; since: string;
}

function Avatar({ p }: { p: Person }) {
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 flex-shrink-0 overflow-hidden">
      {p.image
        ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
        : (p.name?.[0] ?? "?").toUpperCase()
      }
    </div>
  );
}

function PersonRow({ p }: { p: Person }) {
  return (
    <Link href={`/profile/${p.id}`}>
      <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition">
        <Avatar p={p} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{p.name || "Anonymous"}</p>
            {p.activeToday && (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                Active today
              </span>
            )}
          </div>
          {p.username && <p className="text-xs text-gray-400">@{p.username}</p>}
          {p.occupation && <p className="text-xs text-indigo-600">{p.occupation}</p>}
          {p.bio && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.bio}</p>}
        </div>
        <span className="text-indigo-400 text-sm flex-shrink-0">→</span>
      </div>
    </Link>
  );
}

function FollowersContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab") || "followers";
  const [tab, setTab] = useState<"followers" | "following">(tabParam === "following" ? "following" : "followers");
  const [list, setList] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/followers?type=${tab}`)
      .then((r) => r.json())
      .then((d) => { setList(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab]);

  function switchTab(t: "followers" | "following") {
    setTab(t);
    router.replace(`/followers?tab=${t}`, { scroll: false });
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Connections</h1>
        <Link href="/discover" className="text-sm text-indigo-600 hover:underline">
          Discover people →
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => switchTab("followers")}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${
            tab === "followers" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Followers
        </button>
        <button
          onClick={() => switchTab("following")}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${
            tab === "following" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Following
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center py-10 text-gray-400">Loading…</p>
        ) : list.length === 0 ? (
          <div className="py-12 text-center px-6">
            <p className="text-3xl mb-3">{tab === "followers" ? "👤" : "🔍"}</p>
            <p className="text-gray-500 font-medium text-sm">
              {tab === "followers"
                ? "No followers yet — share your profile to get started"
                : "You're not following anyone yet"
              }
            </p>
            {tab === "following" && (
              <Link href="/discover" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
                Discover people to follow →
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {list.map((p) => (
              <PersonRow key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {list.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-4">
          {list.length} {tab === "followers" ? "follower" : "following"}{list.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export default function FollowersPage() {
  return (
    <Suspense fallback={null}>
      <FollowersContent />
    </Suspense>
  );
}
