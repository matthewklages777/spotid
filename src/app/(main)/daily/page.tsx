"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HashtagInput } from "@/components/HashtagInput";
import Link from "next/link";

interface DailyProfile {
  id: string; date: string; note?: string; image?: string;
  hashtags: { hashtag: { id: string; name: string } }[];
}

interface HistoryEntry {
  id: string; date: string; note?: string; image?: string;
  hashtags: { hashtag: { id: string; name: string } }[];
}

const TAG_CATEGORIES = [
  {
    icon: "📍",
    label: "Where am I?",
    desc: "City, neighborhood, venue, address",
    examples: ["Plano", "Starbucks", "Gruene", "Downtown", "DFW"],
  },
  {
    icon: "👕",
    label: "What am I wearing?",
    desc: "Clothing, colors, brands, accessories",
    examples: ["bluejeans", "blackshirt", "Nikes", "redsunglasses", "whitedress"],
  },
  {
    icon: "🗓️",
    label: "What am I doing?",
    desc: "Plans, activities, events, schedule",
    examples: ["meeting", "lunch", "shopping", "workout", "conference"],
  },
  {
    icon: "🕙",
    label: "When?",
    desc: "Time of day, specific times",
    examples: ["10am", "morning", "afternoon", "tonight", "allday"],
  },
  {
    icon: "😊",
    label: "Mood / Vibe",
    desc: "How you're feeling, energy level",
    examples: ["happy", "focused", "relaxed", "networking", "celebrating"],
  },
  {
    icon: "🔖",
    label: "Anything else",
    desc: "Car, items with you, open to meeting",
    examples: ["available", "redtruck", "dogsitting", "opentowork"],
  },
];

export default function DailyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const todayDisplay = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const [existing, setExisting] = useState<DailyProfile | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [dailyImage, setDailyImage] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/daily").then((r) => r.json()).then((data) => {
      if (data) {
        setExisting(data);
        setHashtags(data.hashtags.map((h: { hashtag: { name: string } }) => h.hashtag.name));
        setNote(data.note || "");
        setDailyImage(data.image || null);
      }
    });
    fetch("/api/daily?history=1").then((r) => r.json()).then((data: HistoryEntry[]) => {
      setHistory(data || []);
    }).catch(() => {});
    fetch("/api/trending").then((r) => r.json()).then((d) => {
      const tags: string[] = (d.today ?? []).slice(0, 16).map((t: { name: string }) => t.name);
      setTrendingTags(tags);
    }).catch(() => {});
    const uid = (session?.user as { id?: string })?.id;
    if (uid) {
      fetch(`/api/profile?userId=${uid}`).then((r) => r.json()).then((p) => {
        if (typeof p.streak === "number") setStreak(p.streak);
        if (typeof p.isPremium === "boolean") setIsPremium(p.isPremium);
      }).catch(() => {});
    }
  }, [status]);

  function addExample(tag: string) {
    const clean = tag.toLowerCase().replace(/\s+/g, "");
    if (!hashtags.includes(clean)) setHashtags([...hashtags, clean]);
  }

  async function handlePhotoSelect(file: File) {
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setDailyImage(url);
      }
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hashtags, note, image: dailyImage }),
    });
    if (res.ok) {
      const data = await res.json();
      setExisting(data);
      setSaved(true);
    }
    setSaving(false);
  }

  async function clearProfile() {
    if (!existing) return;
    if (!confirm("Remove your daily profile? You'll no longer appear in searches today.")) return;
    await fetch("/api/daily", { method: "DELETE" });
    setExisting(null);
    setHashtags([]);
    setNote("");
    setDailyImage(null);
    setSaved(false);
  }

  const userId = (session?.user as { id?: string })?.id;

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Daily Profile</h1>
              <p className="text-indigo-200 text-sm mt-0.5">{todayDisplay}</p>
            </div>
            {streak > 1 && (
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-black text-white">🔥 {streak}</p>
                <p className="text-indigo-200 text-xs">day streak</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4">
          {existing && hashtags.length > 0 ? (
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">
                You&apos;re active and discoverable today with {hashtags.length} tag{hashtags.length !== 1 ? "s" : ""}
              </p>
              <button onClick={clearProfile} className="ml-auto text-xs text-red-400 hover:text-red-600 hover:underline whitespace-nowrap">
                Go Private
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-gray-300 rounded-full flex-shrink-0" />
              <p className="text-sm text-gray-500">You&apos;re not visible in search today yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Tag builder */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <h2 className="font-bold text-gray-900 mb-1">Tag Your Day</h2>
          <p className="text-sm text-gray-500">
            Add hashtags that describe where you are, what you look like, what you&apos;re doing — anything someone might search to find you or something you have.
          </p>
        </div>

        {/* Main input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Your Tags</label>
          <HashtagInput
            value={hashtags}
            onChange={setHashtags}
            placeholder="Type a tag and press Enter — e.g. Plano, Starbucks, bluejeans…"
          />
          <p className="text-xs text-gray-400 mt-1">Press Enter, comma, or space after each tag</p>
        </div>

        {/* Category helpers */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tag by Category</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TAG_CATEGORIES.map((cat, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === i ? null : i)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition ${
                    activeCategory === i
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <span className="mr-1.5">{cat.icon}</span>
                  <span className="font-medium">{cat.label}</span>
                </button>
                {activeCategory === i && (
                  <div className="mt-1 p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-xs text-indigo-500 mb-1.5">{cat.desc}</p>
                    <div className="flex flex-wrap gap-1">
                      {cat.examples.map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          onClick={() => addExample(ex)}
                          disabled={hashtags.includes(ex.toLowerCase())}
                          className={`text-xs px-2 py-0.5 rounded-full transition ${
                            hashtags.includes(ex.toLowerCase())
                              ? "bg-indigo-200 text-indigo-400 cursor-default"
                              : "bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200"
                          }`}
                        >
                          #{ex}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Trending today */}
        {trendingTags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🔥 Trending Today</p>
            <div className="flex flex-wrap gap-1.5">
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addExample(tag)}
                  disabled={hashtags.includes(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full transition ${
                    hashtags.includes(tag)
                      ? "bg-green-100 text-green-600 cursor-default"
                      : "bg-gray-100 text-gray-600 hover:bg-indigo-600 hover:text-white"
                  }`}
                >
                  {hashtags.includes(tag) ? "✓ " : ""}#{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <span className={`text-xs ${note.length > 450 ? "text-orange-500" : "text-gray-400"}`}>
              {note.length}/500
            </span>
          </div>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            placeholder="Add context — where you'll be, what you're looking for, how to reach you…"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
          />
        </div>

        {/* Daily photo */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Today&apos;s Photo <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {dailyImage && (
              <button
                type="button"
                onClick={() => { setDailyImage(null); if (photoInputRef.current) photoInputRef.current.value = ""; }}
                className="text-xs text-red-400 hover:text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>

          {dailyImage ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <img src={dailyImage} alt="Today's photo" className="w-full max-h-72 object-cover" />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/80 transition"
              >
                Change photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50 transition group"
            >
              {uploadingPhoto ? (
                <p className="text-sm text-gray-400">Uploading…</p>
              ) : (
                <>
                  <p className="text-3xl mb-2 group-hover:scale-110 transition-transform">📷</p>
                  <p className="text-sm font-semibold text-gray-600">Add a photo to your day</p>
                  <p className="text-xs text-gray-400 mt-1">Haircut, outfit, where you are — anything real-time</p>
                </>
              )}
            </button>
          )}

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }}
          />
        </div>

        {/* Public visibility reminder */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">⚠️ Your Daily Profile is publicly visible</p>
          <p>
            Anyone on SpotId can search your hashtags and find your profile today. Only tag
            information you&apos;re genuinely comfortable sharing publicly. You can remove your
            Daily Profile at any time using the &quot;Go Private&quot; button above.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={save}
            disabled={saving || hashtags.length === 0}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 transition"
          >
            {saving ? "Saving…" : existing ? "Update Profile" : "Go Live Today"}
          </button>
          {saved && (
            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
              ✓ Saved — you&apos;re live!
            </span>
          )}
        </div>

        {/* Premium upsell — shown after saving for non-premium users */}
        {saved && !isPremium && (
          <Link href="/upgrade"
            className="flex items-center gap-3 mt-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl px-4 py-3 hover:border-indigo-300 transition group"
          >
            <span className="text-xl flex-shrink-0">👁️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-indigo-900">See who finds you today</p>
              <p className="text-xs text-gray-500">Upgrade to Premium to see exactly who views your profile</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 group-hover:underline whitespace-nowrap">$4.99/mo →</span>
          </Link>
        )}
      </div>

      {/* Live preview */}
      {hashtags.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Preview</h2>
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200">
              How you appear in search
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">
                {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{session?.user?.name ?? "You"}</p>
                {note && <p className="text-sm text-gray-500 mt-0.5">{note}</p>}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {hashtags.map((tag) => (
                    <span key={tag} className="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Anyone searching any of these tags today will find your profile
          </p>
        </div>
      )}

      {/* Daily history */}
      {history.filter((h) => h.date !== today).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📆</span> Your Tag History
            <span className="text-sm font-normal text-gray-400">({history.filter((h) => h.date !== today).length} previous days)</span>
          </h2>
          <div className="space-y-3">
            {history.filter((h) => h.date !== today).map((entry) => {
              const dateLabel = new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric",
              });
              const entryTags = entry.hashtags.map((h) => h.hashtag.name);
              return (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition group">
                  <div className="flex-shrink-0 text-right min-w-[4rem]">
                    <p className="text-xs font-semibold text-gray-500">{dateLabel}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1">
                      {entryTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => { if (!hashtags.includes(tag)) setHashtags([...hashtags, tag]); }}
                          disabled={hashtags.includes(tag)}
                          title={hashtags.includes(tag) ? "Already added" : `Add #${tag} to today`}
                          className={`text-xs px-2 py-0.5 rounded-full transition ${
                            hashtags.includes(tag)
                              ? "bg-indigo-100 text-indigo-400 cursor-default"
                              : "bg-gray-100 text-gray-600 hover:bg-indigo-600 hover:text-white"
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                    {entry.note && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{entry.note}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newTags = entryTags.filter((t) => !hashtags.includes(t));
                      if (newTags.length > 0) setHashtags([...hashtags, ...newTags]);
                    }}
                    className="text-xs text-indigo-500 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition whitespace-nowrap flex-shrink-0"
                  >
                    + All
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Click any tag to add it to today · Click + All to reuse an entire day
          </p>
        </div>
      )}

      {userId && (
        <div className="text-center pb-2">
          <Link href={`/profile/${userId}`} className="text-sm text-indigo-600 hover:underline">
            ← Back to your full profile
          </Link>
        </div>
      )}
    </div>
  );
}
