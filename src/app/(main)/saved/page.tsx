"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SavedUser {
  id: string; name?: string; image?: string; bio?: string;
  location?: string; occupation?: string; username?: string;
  isPremium?: boolean;
  dailyProfiles: { id: string }[];
}

interface Saved {
  id: string; savedUserId: string; note?: string; createdAt: string;
  savedUser: SavedUser | null;
}

function SavedItem({ item, onUnsave }: {
  item: Saved;
  onUnsave: (id: string) => void;
}) {
  const u = item.savedUser;
  const activeToday = (u?.dailyProfiles?.length ?? 0) > 0;
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(item.note || "");
  const [saving, setSaving] = useState(false);

  if (!u) return null;

  async function saveNote() {
    setSaving(true);
    await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedUserId: u!.id, note }),
    });
    setSaving(false);
    setEditingNote(false);
  }

  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <Link href={`/profile/${u.id}`} className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-base font-bold text-indigo-600 overflow-hidden">
          {u.image
            ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
            : (u.name?.[0] ?? "?").toUpperCase()
          }
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/profile/${u.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 text-sm">
              {u.name || "Unknown"}{u.isPremium && <span className="ml-1 text-xs">✅</span>}
            </Link>
            {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
            {u.occupation && <p className="text-xs text-indigo-600">{u.occupation}</p>}
            {u.location && <p className="text-xs text-gray-500">📍 {u.location}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {activeToday && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Active Today
              </span>
            )}
            <Link
              href={`/messages?to=${u.id}&name=${encodeURIComponent(u.name || "")}`}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Message →
            </Link>
            <button
              onClick={() => onUnsave(u.id)}
              className="text-xs text-gray-400 hover:text-red-500 transition"
              title="Remove from saved"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Note */}
        {editingNote ? (
          <div className="mt-2 flex gap-2 items-start">
            <input
              autoFocus
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              onKeyDown={(e) => { if (e.key === "Enter") saveNote(); if (e.key === "Escape") setEditingNote(false); }}
              placeholder="Add a private note…"
              className="flex-1 text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={saveNote} disabled={saving}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-40">
              {saving ? "…" : "Save"}
            </button>
            <button onClick={() => { setNote(item.note || ""); setEditingNote(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">
              ✕
            </button>
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-1.5">
            {note ? (
              <p
                onClick={() => setEditingNote(true)}
                className="text-xs text-gray-400 italic cursor-pointer hover:text-gray-600 transition"
                title="Click to edit note"
              >
                📝 {note}
              </p>
            ) : (
              <button
                onClick={() => setEditingNote(true)}
                className="text-xs text-gray-300 hover:text-gray-500 transition"
              >
                + add note
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-gray-300 mt-1">
          Saved {new Date(item.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export default function SavedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Saved[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/signin"); return; }
    if (status !== "authenticated") return;
    fetch("/api/saved").then((r) => r.json()).then((d) => {
      setItems(d);
      setLoading(false);
    });
  }, [status, router]);

  async function unsave(savedUserId: string) {
    await fetch(`/api/saved?savedUserId=${savedUserId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((s) => s.savedUserId !== savedUserId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <p>Loading saved profiles…</p>
      </div>
    );
  }

  const activeItems = items.filter((i) => (i.savedUser?.dailyProfiles?.length ?? 0) > 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-16">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">★ Saved Profiles</h1>
            <p className="text-yellow-100 text-sm mt-0.5">
              {items.length} saved · {activeItems.length} active today
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">☆</p>
            <p className="font-medium">No saved profiles yet.</p>
            <p className="text-sm mt-1">
              Tap the <strong>☆ Save</strong> button on any profile to bookmark it here.
            </p>
            <Link href="/search" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
              Go to Search →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <SavedItem key={item.id} item={item} onUnsave={unsave} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
