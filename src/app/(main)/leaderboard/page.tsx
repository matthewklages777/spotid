"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface LeaderUser {
  id: string; name?: string; image?: string; occupation?: string; username?: string;
  followerCount?: number;
  streak?: number;
  totalDays?: number;
  dailyProfiles?: { hashtags: { hashtag: { id: string; name: string } }[] }[];
}

interface LeaderboardData {
  topByFollowers: LeaderUser[];
  topByStreak: LeaderUser[];
  activeToday: LeaderUser[];
}

const MEDALS = ["🥇", "🥈", "🥉"];

function Avatar({ u }: { u: LeaderUser }) {
  return (
    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm flex-shrink-0 overflow-hidden">
      {u.image
        ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
        : (u.name?.[0] ?? "?").toUpperCase()
      }
    </div>
  );
}

function LeaderRow({ u, rank, badge }: { u: LeaderUser; rank: number; badge: React.ReactNode }) {
  return (
    <Link href={`/profile/${u.id}`}>
      <div className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition ${rank <= 3 ? "bg-gradient-to-r from-yellow-50/40 to-transparent" : ""}`}>
        <span className="w-6 text-center text-sm font-bold text-gray-400 flex-shrink-0">
          {rank <= 3 ? MEDALS[rank - 1] : rank}
        </span>
        <Avatar u={u} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{u.name || "Anonymous"}</p>
          {u.occupation && <p className="text-xs text-indigo-600 truncate">{u.occupation}</p>}
          {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
        </div>
        <div className="flex-shrink-0">{badge}</div>
      </div>
    </Link>
  );
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"streak" | "followers" | "today">("streak");

  useEffect(() => {
    fetch("/api/leaderboard").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, []);

  return (
    <div className="max-w-2xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 px-8 py-7">
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-yellow-100 text-sm mt-1">Top SpotId members by activity, streak, and influence</p>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {([
            { id: "streak", label: "🔥 Streaks" },
            { id: "followers", label: "👤 Followers" },
            { id: "today", label: "⚡ Active Today" },
          ] as { id: typeof tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 text-sm font-semibold py-3 transition border-b-2 ${
                tab === t.id ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400">Loading…</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {tab === "streak" && (
              (data?.topByStreak.length ?? 0) > 0
                ? data!.topByStreak.map((u, i) => (
                    <LeaderRow key={u.id} u={u} rank={i + 1} badge={
                      <div className="text-right">
                        <p className="text-sm font-black text-orange-500">🔥 {u.streak}</p>
                        <p className="text-xs text-gray-400">{u.totalDays} total days</p>
                      </div>
                    } />
                  ))
                : <p className="text-center py-10 text-gray-400 text-sm">No streak data yet</p>
            )}

            {tab === "followers" && (
              (data?.topByFollowers.length ?? 0) > 0
                ? data!.topByFollowers.map((u, i) => (
                    <LeaderRow key={u.id} u={u} rank={i + 1} badge={
                      <div className="text-right">
                        <p className="text-sm font-black text-indigo-600">{u.followerCount?.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">followers</p>
                      </div>
                    } />
                  ))
                : <p className="text-center py-10 text-gray-400 text-sm">No followers yet</p>
            )}

            {tab === "today" && (
              (data?.activeToday.length ?? 0) > 0
                ? data!.activeToday.map((u, i) => (
                    <LeaderRow key={u.id} u={u} rank={i + 1} badge={
                      <div className="flex flex-wrap gap-1 max-w-32 justify-end">
                        {u.dailyProfiles?.[0]?.hashtags.slice(0, 3).map(({ hashtag }) => (
                          <span key={hashtag.id} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                            #{hashtag.name}
                          </span>
                        ))}
                      </div>
                    } />
                  ))
                : <p className="text-center py-10 text-gray-400 text-sm">No one has tagged yet today</p>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400">
        Leaderboard updates in real time ·{" "}
        <Link href="/daily" className="text-indigo-500 hover:underline">Tag today to appear</Link>
      </p>
    </div>
  );
}
