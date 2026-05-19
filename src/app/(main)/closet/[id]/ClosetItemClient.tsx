"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Hashtag { id: string; name: string }
interface Seller {
  id: string; name?: string; image?: string; username?: string;
  location?: string; openToContact: boolean;
}
interface ClosetItem {
  id: string; title: string; description?: string; price?: number;
  image?: string; sold: boolean; createdAt: string;
  hashtags: { hashtag: Hashtag; hashtagId: string }[];
  user: Seller;
}
interface RelatedItem {
  id: string; title: string; price?: number; image?: string;
  hashtags: { hashtag: Hashtag }[];
  user: { id: string; name?: string; image?: string };
}

export default function ClosetItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string })?.id;

  const [item, setItem] = useState<ClosetItem | null>(null);
  const [related, setRelated] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    fetch(`/api/closet/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setNotFound(true); setLoading(false); return; }
        setItem(d.item);
        setRelated(d.related ?? []);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  function startEdit() {
    if (!item) return;
    setEditTitle(item.title);
    setEditDescription(item.description ?? "");
    setEditPrice(item.price != null ? String(item.price) : "");
    setEditing(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setOwnerBusy(true);
    const res = await fetch("/api/closet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        price: editPrice ? parseFloat(editPrice) : null,
      }),
    });
    if (res.ok) {
      setItem((prev) => prev ? {
        ...prev,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        price: editPrice ? parseFloat(editPrice) : undefined,
      } : prev);
      setEditing(false);
    }
    setOwnerBusy(false);
  }

  async function toggleSold() {
    if (!item) return;
    setOwnerBusy(true);
    await fetch("/api/closet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, sold: !item.sold }),
    });
    setItem((prev) => prev ? { ...prev, sold: !prev.sold } : prev);
    setOwnerBusy(false);
  }

  async function deleteItem() {
    if (!item || !confirm("Delete this listing permanently? This cannot be undone.")) return;
    setOwnerBusy(true);
    await fetch(`/api/closet?id=${item.id}`, { method: "DELETE" });
    router.push("/closet");
  }

  async function share() {
    const url = window.location.href;
    const shareData = { title: item?.title ?? "Item for sale", text: `Check out this item on SpotId`, url };
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center text-gray-400">
        <p className="text-4xl mb-3 animate-pulse">🏷️</p>
        <p>Loading listing…</p>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Listing not found</h2>
        <p className="text-gray-500 mb-5">This item may have been removed.</p>
        <Link href="/discover" className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition">
          Browse Discover
        </Link>
      </div>
    );
  }

  const seller = item.user;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Image */}
        {item.image ? (
          <img src={item.image} alt={item.title} className="w-full max-h-96 object-cover" />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-orange-50 to-pink-100 flex items-center justify-center text-6xl">
            🏷️
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
              {item.sold && (
                <span className="mt-1 inline-block bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">
                  Sold
                </span>
              )}
            </div>
            {item.price != null && (
              <p className="text-3xl font-black text-indigo-600 flex-shrink-0">${item.price.toFixed(2)}</p>
            )}
          </div>

          {item.description && (
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{item.description}</p>
          )}

          {/* Tags */}
          {item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.hashtags.map(({ hashtag }) => (
                <Link
                  key={hashtag.id}
                  href={`/tag/${hashtag.name}`}
                  className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full hover:bg-indigo-100 transition"
                >
                  #{hashtag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            {myId && myId !== seller.id && seller.openToContact && !item.sold && (
              <Link
                href={`/messages?to=${seller.id}&name=${encodeURIComponent(seller.name || "")}&item=${encodeURIComponent(item.title)}`}
                className="bg-indigo-600 text-white text-sm px-5 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition"
              >
                Message Seller
              </Link>
            )}
            <button
              onClick={share}
              className="text-sm border border-gray-200 text-gray-600 px-4 py-2.5 rounded-full hover:bg-gray-50 transition"
            >
              {copied ? "✓ Copied!" : "Share ↗"}
            </button>
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-400 hover:text-gray-600 transition"
            >
              ← Back
            </button>
          </div>

          {/* Owner controls */}
          {myId === seller.id && (
            <div className="border-t border-gray-100 pt-4 mt-2">
              <p className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">Your listing</p>

              {editing ? (
                <form onSubmit={saveEdit} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Title</label>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      maxLength={200}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="Leave blank if not set"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={ownerBusy || !editTitle.trim()}
                      className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-full font-medium hover:bg-indigo-700 disabled:opacity-40 transition"
                    >
                      {ownerBusy ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={startEdit}
                    className="text-sm px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition font-medium"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={toggleSold}
                    disabled={ownerBusy}
                    className={`text-sm px-4 py-2 rounded-full font-medium transition disabled:opacity-40 ${
                      item.sold
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {ownerBusy ? "…" : item.sold ? "✓ Mark Available" : "Mark as Sold"}
                  </button>
                  <button
                    onClick={deleteItem}
                    disabled={ownerBusy}
                    className="text-sm px-4 py-2 rounded-full text-red-500 hover:bg-red-50 transition font-medium disabled:opacity-40"
                  >
                    Delete Listing
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Seller card */}
      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => router.push(`/profile/${seller.id}`)}
      >
        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600 flex-shrink-0 overflow-hidden">
          {seller.image
            ? <img src={seller.image} alt={seller.name} className="w-full h-full object-cover" />
            : (seller.name?.[0] ?? "?").toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">Sold by</p>
          <p className="font-bold text-gray-900">{seller.name || "Anonymous"}</p>
          {seller.username && <p className="text-xs text-gray-400">@{seller.username}</p>}
          {seller.location && <p className="text-xs text-gray-400">📍 {seller.location}</p>}
        </div>
        <span className="text-xs text-indigo-600 hover:underline font-medium flex-shrink-0">View Profile →</span>
      </div>

      {/* Related items */}
      {related.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Related Listings</h2>
            <p className="text-xs text-gray-400 mt-0.5">Similar tags</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-gray-50">
            {related.map((r) => (
              <Link key={r.id} href={`/closet/${r.id}`}>
                <div className="p-3 hover:bg-gray-50 transition">
                  {r.image ? (
                    <img src={r.image} alt={r.title} className="w-full aspect-square object-cover rounded-xl mb-2" />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl flex items-center justify-center text-3xl mb-2">
                      🏷️
                    </div>
                  )}
                  <p className="font-semibold text-gray-900 text-xs truncate">{r.title}</p>
                  {r.price != null && (
                    <p className="text-indigo-600 font-bold text-sm">${r.price.toFixed(2)}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">by {r.user.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
