"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HashtagInput } from "@/components/HashtagInput";
import Link from "next/link";

interface WorkItem {
  id: string; title: string; description?: string; category?: string;
  contactInfo?: string; image?: string;
  hashtags: { hashtag: { id: string; name: string } }[];
}

const CATEGORIES = [
  "Consulting", "Design", "Development", "Marketing", "Photography",
  "Real Estate", "Finance", "Legal", "Health & Wellness", "Education",
  "Trades & Repair", "Events", "Food & Catering", "Beauty & Style", "Other",
];

export default function WorkPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "", contactInfo: "", image: "" });
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
    const res = await fetch("/api/work");
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

  function startEdit(item: WorkItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      category: item.category || "",
      contactInfo: item.contactInfo || "",
      image: item.image || "",
    });
    setTags(item.hashtags.map(({ hashtag }) => hashtag.name));
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", description: "", category: "", contactInfo: "", image: "" });
    setTags([]);
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true);
    if (editingId) {
      await fetch("/api/work", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form, hashtags: tags }),
      });
    } else {
      await fetch("/api/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hashtags: tags }),
      });
    }
    setSaving(false);
    cancelForm();
    load();
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this listing?")) return;
    await fetch(`/api/work?id=${id}`, { method: "DELETE" });
    load();
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center py-32 text-gray-400">Loading…</div>;
  }

  const grouped = CATEGORIES.reduce<Record<string, WorkItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {});
  const uncategorized = items.filter((i) => !i.category);
  if (uncategorized.length) grouped["Other"] = [...(grouped["Other"] || []), ...uncategorized];

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
          <h1 className="text-2xl font-bold text-white">My Work</h1>
          <p className="text-emerald-100 text-sm mt-0.5">
            Showcase your services — get discovered by anyone searching your hashtags
          </p>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-900">{items.length}</span> listing{items.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-full font-semibold hover:bg-indigo-700 transition"
          >
            + Add Service
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{editingId ? "Edit Service" : "New Service Listing"}</h2>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>

          <form onSubmit={addItem} className="p-6 space-y-4">
            {/* Photo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Photo</label>
              {form.image ? (
                <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-gray-200">
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm({ ...form, image: "" })}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    Remove
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition">
                  <span className="text-3xl mb-1">{uploading ? "⏳" : "🖼️"}</span>
                  <span className="text-xs">{uploading ? "Uploading…" : "Add Photo"}</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Service Title <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Freelance Graphic Designer, Home Repairs, Tax Consulting…"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select a category…</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">How to Reach You</label>
                <input
                  value={form.contactInfo}
                  onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                  placeholder="Email, phone, website, DM…"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what you offer, your experience, rates, availability — sell yourself…"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hashtags</label>
                <HashtagInput
                  value={tags}
                  onChange={setTags}
                  placeholder="#design #logo #Plano #Texas #freelance #affordable…"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Include your skill, location, industry, and anything a client might search to find you
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button type="submit" disabled={saving || !form.title}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 transition">
                {saving ? "Saving…" : editingId ? "Save Changes" : "Add Listing"}
              </button>
              <button type="button" onClick={cancelForm}
                className="text-sm text-gray-500 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listings */}
      {items.length > 0 && (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat}</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {catItems.map((item) => (
                  <div key={item.id} className="p-5">
                    <div className="flex gap-4">
                      {item.image ? (
                        <img src={item.image} alt={item.title}
                          className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-3xl flex-shrink-0">
                          💼
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900">{item.title}</h3>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => startEdit(item)}
                              className="text-xs text-indigo-500 hover:underline">
                              Edit
                            </button>
                            <button onClick={() => deleteItem(item.id)}
                              className="text-xs text-red-400 hover:text-red-600 hover:underline">
                              Delete
                            </button>
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.description}</p>
                        )}
                        {item.contactInfo && (
                          <p className="text-sm text-emerald-600 font-medium mt-2">📬 {item.contactInfo}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.hashtags.map(({ hashtag }) => (
                            <Link key={hashtag.id} href={`/tag/${hashtag.name}`}
                              className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition">
                              #{hashtag.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-4">💼</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No services listed yet</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">
            List your skills, services, or business. Tag it with relevant hashtags and clients searching for exactly what you offer will find you.
          </p>
          <button onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition">
            Add Your First Service
          </button>
        </div>
      )}
    </div>
  );
}
