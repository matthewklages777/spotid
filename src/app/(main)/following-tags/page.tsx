"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface FollowedTag {
  id: string;
  name: string;
  totalUses: number;
  activeToday: number;
}

export default function FollowingTagsPage() {
  const [tags, setTags] = useState<FollowedTag[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/follow-hashtag?list=1");
    if (res.ok) setTags(await res.json());
    setLoading(false);
  }

  async function unfollow(name: string) {
    await fetch("/api/follow-hashtag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setTags((prev) => prev.filter((t) => t.name !== name));
  }

  useEffect(() => { load(); }, []);

  const activeNow = tags.filter((t) => t.activeToday > 0);
  const quiet = tags.filter((t) => t.activeToday === 0);

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <h1 className="text-xl font-bold text-white">Followed Hashtags</h1>
          <p className="text-indigo-200 text-sm mt-0.5">
            {loading ? "Loading…" : `${tags.length} followed · ${activeNow.length} active today`}
          </p>
        </div>
        <div className="px-6 py-3 text-xs text-gray-500 border-b border-gray-100">
          You&apos;ll get notified once per person per tag per day when someone new tags with these hashtags.
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3 animate-pulse">#</p>
          <p>Loading your tags…</p>
        </div>
      ) : tags.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">#</p>
          <p className="text-gray-700 font-semibold text-sm">No followed tags yet</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Browse{" "}
            <Link href="/trending" className="text-indigo-600 hover:underline">trending tags</Link>
            {" "}or visit any tag page and click &quot;+ Follow&quot;.
          </p>
        </div>
      ) : (
        <>
          {/* Active today */}
          {activeNow.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <h2 className="font-bold text-gray-900">Active Today</h2>
                <span className="text-xs text-gray-400">({activeNow.length})</span>
              </div>
              <div className="divide-y divide-gray-50">
                {activeNow.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-3 px-5 py-3.5">
                    <Link
                      href={`/tag/${tag.name}`}
                      className="flex-1 font-semibold text-indigo-600 hover:underline"
                    >
                      #{tag.name}
                    </Link>
                    <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                      {tag.activeToday} tagged today
                    </span>
                    {tag.totalUses > 0 && (
                      <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">
                        {tag.totalUses} total
                      </span>
                    )}
                    <button
                      onClick={() => unfollow(tag.name)}
                      className="text-xs text-gray-300 hover:text-red-400 transition ml-1"
                      title="Unfollow"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiet tags */}
          {quiet.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <span className="text-gray-300">○</span>
                <h2 className="font-bold text-gray-900">No Activity Today</h2>
                <span className="text-xs text-gray-400">({quiet.length})</span>
              </div>
              <div className="divide-y divide-gray-50">
                {quiet.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-3 px-5 py-3 opacity-60">
                    <Link
                      href={`/tag/${tag.name}`}
                      className="flex-1 text-gray-600 hover:text-indigo-600 transition"
                    >
                      #{tag.name}
                    </Link>
                    {tag.totalUses > 0 && (
                      <span className="text-xs text-gray-400">{tag.totalUses} all-time</span>
                    )}
                    <button
                      onClick={() => unfollow(tag.name)}
                      className="text-xs text-gray-300 hover:text-red-400 transition ml-1"
                      title="Unfollow"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <Link href="/trending" className="text-sm text-indigo-600 hover:underline font-medium">
              Browse Trending →
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/feed" className="text-sm text-gray-500 hover:text-gray-700">
              View Your Feed
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
