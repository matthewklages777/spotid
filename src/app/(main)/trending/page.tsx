"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";

interface TagCount { name: string; count: number }

interface TrendingData {
  today: TagCount[];
  closet: TagCount[];
  work: TagCount[];
}

function TagCloud({ tags, color }: { tags: TagCount[]; color: string }) {
  if (tags.length === 0) {
    return <p className="text-sm text-gray-400 italic">No data yet — check back as more people join.</p>;
  }
  const max = tags[0]?.count || 1;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => {
        const weight = t.count / max;
        const size = weight > 0.7 ? "text-lg" : weight > 0.4 ? "text-base" : "text-sm";
        const opacity = weight > 0.5 ? "opacity-100" : weight > 0.25 ? "opacity-75" : "opacity-50";
        return (
          <Link
            key={t.name}
            href={`/tag/${t.name}`}
            className={`${size} ${opacity} ${color} px-3 py-1 rounded-full font-semibold hover:opacity-100 transition`}
            title={`${t.count} use${t.count !== 1 ? "s" : ""}`}
          >
            #{t.name}
            <span className="ml-1 text-xs font-normal opacity-70">{t.count}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function TrendingPage() {
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 px-8 py-7">
          <h1 className="text-2xl font-bold text-white">Trending on <Brand /></h1>
          <p className="text-pink-200 text-sm mt-1">What people are tagging right now</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3 animate-pulse">📈</p>
          <p>Loading trends…</p>
        </div>
      ) : (
        <>
          {/* Active today */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <div>
                <h2 className="font-bold text-gray-900">Active Right Now</h2>
                <p className="text-xs text-gray-500">{todayDisplay} · Tags in today&apos;s daily profiles</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <TagCloud tags={data?.today || []} color="bg-green-100 text-green-800 hover:bg-green-200" />
            </div>
          </div>

          {/* Closet / marketplace */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">🏷️ Marketplace Tags</h2>
              <p className="text-xs text-gray-500">Most-tagged items currently for sale</p>
            </div>
            <div className="px-6 py-5">
              <TagCloud tags={data?.closet || []} color="bg-orange-100 text-orange-800 hover:bg-orange-200" />
            </div>
          </div>

          {/* Work / services */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">💼 Services Tags</h2>
              <p className="text-xs text-gray-500">Most-tagged skills and services</p>
            </div>
            <div className="px-6 py-5">
              <TagCloud tags={data?.work || []} color="bg-emerald-100 text-emerald-800 hover:bg-emerald-200" />
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 pt-2">
            Click any tag to search it · Trends update in real time
          </div>
        </>
      )}
    </div>
  );
}
