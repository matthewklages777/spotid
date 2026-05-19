"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HashtagInput } from "@/components/HashtagInput";
import Link from "next/link";

interface ClosetItem {
  id: string; title: string; description?: string; price?: number;
  image?: string; sold: boolean;
  hashtags: { hashtag: { id: string; name: string } }[];
}

type View = "active" | "sold";

export default function ClosetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<View>("active");
  const [form, setForm] = useState({ title: "", description: "", price: "", image: "" });
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status]);

  async function load() {
    const res = await fetch("/api/closet");
    if (res.ok) setItems(await res.json());
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const { url } = await res.json();
    setForm((f) => ({ ...f, image: url }));
    setUploading(false);
  }

  function startEdit(item: ClosetItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      price: item.price != null ? String(item.price) : "",
      image: item.image || "",
    });
    setTags(item.hashtags.map(({ hashtag }) => hashtag.name));
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", description: "", price: "", image: "" });
    setTags([]);
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true);
    if (editingId) {
      await fetch("/api/closet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form, price: form.price || null, hashtags: tags }),
      });
    } else {
      await fetch("/api/closet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: form.price || null, hashtags: tags }),
      });
    }
    setSaving(false);
    cancelForm();
    load();
  }

  async function toggleSold(item: ClosetItem) {
    await fetch("/api/closet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, sold: !item.sold }),
    });
    load();
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this listing permanently?")) return;
    await fetch(`/api/closet?id=${id}`, { method: "DELETE" });
    load();
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center py-32 text-gray-400">Loading…</div>;
  }

  const active = items.filter((i) => !i.sold);
  const sold = items.filter((i) => i.sold);
  const displayed = view === "active" ? active : sold;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-5">
          <h1 className="text-2xl font-bold text-white">My Closet</h1>
          <p className="text-pink-100 text-sm mt-0.5">
            List anything — clothes, antiques, electronics, collectibles — and tag it so buyers find it
          </p>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <span className="font-bold text-gray-900">{active.length}</span>
            <span className="text-gray-500">for sale</span>
            <span className="text-gray-200">·</span>
            <span className="font-bold text-gray-400">{sold.length}</span>
            <span className="text-gray-400">sold</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-full font-semibold hover:bg-indigo-700 transition"
          >
            + List Item
          </button>
        </div>
      </div>

      {/* Add item form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{editingId ? "Edit Listing" : "New Listing"}</h2>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
          <form onSubmit={addItem} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Image upload first */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Photo</label>
                {form.image ? (
                  <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-gray-200">
                    <img src={form.image} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition"
                  >
                    <span className="text-3xl mb-1">{uploading ? "⏳" : "📷"}</span>
                    <span className="text-xs">{uploading ? "Uploading…" : "Add Photo"}</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Item Title <span className="text-red-400">*</span></label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Vintage Green Antique Lamp"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the item — condition, size, history, where it came from…"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">Leave blank if price is negotiable</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hashtags</label>
                <HashtagInput
                  value={tags}
                  onChange={setTags}
                  placeholder="#vintage #lamp #green #antique #Gruene #Texas…"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Tag the item&apos;s type, color, brand, era, location — anything a buyer might search for
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving || !form.title}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 transition"
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "List Item"}
              </button>
              <button type="button" onClick={cancelForm}
                className="text-sm text-gray-500 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View toggle & items */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(["active", "sold"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 py-3 text-sm font-semibold transition relative ${
                  view === v ? "text-indigo-600 bg-indigo-50" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {v === "active" ? `For Sale (${active.length})` : `Sold (${sold.length})`}
                {view === v && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
              </button>
            ))}
          </div>

          <div className="p-6">
            {displayed.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">{view === "active" ? "🏷️" : "✅"}</p>
                <p className="text-sm">{view === "active" ? "Nothing for sale yet" : "Nothing sold yet"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {displayed.map((item) => (
                  <div key={item.id}
                    className={`border rounded-xl overflow-hidden transition hover:shadow-md ${item.sold ? "border-gray-100 opacity-70" : "border-gray-100"}`}>
                    {item.image ? (
                      <div className="relative">
                        <img src={item.image} alt={item.title} className={`w-full aspect-square object-cover ${item.sold ? "grayscale" : ""}`} />
                        {item.sold && (
                          <span className="absolute top-2 left-2 bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                            SOLD
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className={`w-full aspect-square flex items-center justify-center text-4xl ${item.sold ? "bg-gray-100" : "bg-gradient-to-br from-pink-50 to-orange-50"}`}>
                        🏷️
                      </div>
                    )}
                    <div className="p-3">
                      <p className={`font-semibold text-sm truncate ${item.sold ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        {item.title}
                      </p>
                      {item.price != null && !item.sold && (
                        <p className="text-indigo-600 font-bold mt-0.5">${item.price.toFixed(2)}</p>
                      )}
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.hashtags.slice(0, 3).map(({ hashtag }) => (
                          <Link key={hashtag.id} href={`/tag/${hashtag.name}`}
                            className="text-xs text-gray-400 hover:text-indigo-500">
                            #{hashtag.name}
                          </Link>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3 pt-2 border-t border-gray-50 flex-wrap">
                        <button
                          onClick={() => toggleSold(item)}
                          className={`text-xs font-medium hover:underline ${item.sold ? "text-blue-500" : "text-green-600"}`}
                        >
                          {item.sold ? "Relist" : "Mark Sold"}
                        </button>
                        <span className="text-gray-200">·</span>
                        <button onClick={() => startEdit(item)} className="text-xs text-indigo-500 hover:underline">
                          Edit
                        </button>
                        <span className="text-gray-200">·</span>
                        <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400 hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-4">👗</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your closet is empty</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">
            List anything you want to sell — clothes, antiques, furniture, collectibles, electronics. Tag it well and the right buyer will find it.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition"
          >
            List Your First Item
          </button>
        </div>
      )}
    </div>
  );
}
