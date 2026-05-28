"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Hashtag { id: string; name: string }
interface Provider {
  id: string; name?: string; image?: string; username?: string;
  location?: string; openToContact: boolean; isPremium?: boolean;
}
interface WorkItem {
  id: string; title: string; description?: string; category?: string;
  contactInfo?: string; image?: string; createdAt: string;
  hashtags: { hashtag: Hashtag; hashtagId: string }[];
  user: Provider;
}
interface RelatedItem {
  id: string; title: string; category?: string; image?: string;
  hashtags: { hashtag: Hashtag }[];
  user: { id: string; name?: string; image?: string };
}

export default function WorkItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string })?.id;

  const [item, setItem] = useState<WorkItem | null>(null);
  const [related, setRelated] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editContactInfo, setEditContactInfo] = useState("");

  useEffect(() => {
    fetch(`/api/work/${id}`)
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
    setEditCategory(item.category ?? "");
    setEditContactInfo(item.contactInfo ?? "");
    setEditing(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setOwnerBusy(true);
    const res = await fetch("/api/work", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        category: editCategory.trim() || null,
        contactInfo: editContactInfo.trim() || null,
      }),
    });
    if (res.ok) {
      setItem((prev) => prev ? {
        ...prev,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        category: editCategory.trim() || undefined,
        contactInfo: editContactInfo.trim() || undefined,
      } : prev);
      setEditing(false);
    }
    setOwnerBusy(false);
  }

  async function deleteItem() {
    if (!item || !confirm("Delete this service listing permanently? This cannot be undone.")) return;
    setOwnerBusy(true);
    await fetch(`/api/work?id=${item.id}`, { method: "DELETE" });
    router.push("/work");
  }

  async function share() {
    const url = window.location.href;
    const shareData = { title: item?.title ?? "Service listing", text: `Check out this service on SpotId`, url };
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
        <p className="text-4xl mb-3 animate-pulse">💼</p>
        <p>Loading service…</p>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Listing not found</h2>
        <p className="text-gray-500 mb-5">This service may have been removed.</p>
        <Link href="/discover" className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition">
          Browse Discover
        </Link>
      </div>
    );
  }

  const provider = item.user;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.title} className="w-full max-h-80 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center text-5xl">
            💼
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
              {item.category && (
                <span className="mt-1 inline-block bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full font-medium">
                  {item.category}
                </span>
              )}
            </div>
          </div>

          {item.description && (
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{item.description}</p>
          )}

          {item.contactInfo && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-800">
              <p className="font-semibold mb-1">Contact / Booking</p>
              <p className="whitespace-pre-line">{item.contactInfo}</p>
            </div>
          )}

          {item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.hashtags.map(({ hashtag }) => (
                <Link
                  key={hashtag.id}
                  href={`/tag/${hashtag.name}`}
                  className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition"
                >
                  #{hashtag.name}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 flex-wrap">
            {myId && myId !== provider.id && provider.openToContact && (
              <Link
                href={`/messages?to=${provider.id}&name=${encodeURIComponent(provider.name || "")}&item=${encodeURIComponent(item.title)}`}
                className="bg-emerald-600 text-white text-sm px-5 py-2.5 rounded-full font-semibold hover:bg-emerald-700 transition"
              >
                Contact Provider
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
          {myId === provider.id && (
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
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
                    <input
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      maxLength={50}
                      placeholder="e.g. Design, Photography, Consulting"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Contact / Booking Info</label>
                    <textarea
                      value={editContactInfo}
                      onChange={(e) => setEditContactInfo(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Phone, email, booking link…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={ownerBusy || !editTitle.trim()}
                      className="bg-emerald-600 text-white text-sm px-5 py-2 rounded-full font-medium hover:bg-emerald-700 disabled:opacity-40 transition"
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
                    className="text-sm px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition font-medium"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={deleteItem}
                    disabled={ownerBusy}
                    className="text-sm px-4 py-2 rounded-full text-red-500 hover:bg-red-50 transition font-medium disabled:opacity-40"
                  >
                    {ownerBusy ? "…" : "Delete Listing"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Provider card */}
      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => router.push(`/profile/${provider.id}`)}
      >
        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600 flex-shrink-0 overflow-hidden">
          {provider.image
            ? <img src={provider.image} alt={provider.name} className="w-full h-full object-cover" />
            : (provider.name?.[0] ?? "?").toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">Offered by</p>
          <p className="font-bold text-gray-900">{provider.name || "Anonymous"}{provider.isPremium && <span className="ml-1 text-xs">✅</span>}</p>
          {provider.username && <p className="text-xs text-gray-400">@{provider.username}</p>}
          {provider.location && <p className="text-xs text-gray-400">📍 {provider.location}</p>}
        </div>
        <span className="text-xs text-indigo-600 hover:underline font-medium flex-shrink-0">View Profile →</span>
      </div>

      {/* Logged-out visitor CTA */}
      {!myId && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900">Offer your own services on SpotId?</p>
            <p className="text-sm text-gray-500 mt-0.5">Create a free profile and list what you do. Clients find you by hashtag — no monthly fee required.</p>
          </div>
          <Link
            href="/signup"
            className="flex-shrink-0 bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-emerald-700 transition text-sm whitespace-nowrap"
          >
            Join Free →
          </Link>
        </div>
      )}

      {/* Related services */}
      {related.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Similar Services</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tagged with similar hashtags</p>
          </div>
          <div className="divide-y divide-gray-50">
            {related.map((r) => (
              <Link key={r.id} href={`/work/${r.id}`}>
                <div className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-50 transition">
                  {r.image ? (
                    <img src={r.image} alt={r.title} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl flex-shrink-0">
                      💼
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
                      {r.category && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {r.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">by {r.user.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {r.hashtags.slice(0, 3).map(({ hashtag }) => (
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
    </div>
  );
}
