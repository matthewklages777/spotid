"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl?: string;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function typeIcon(type: string) {
  if (type === "message") return "✉️";
  if (type === "report_filed") return "🚩";
  if (type === "save") return "★";
  if (type === "tag_follow") return "#️⃣";
  if (type === "follow") return "👤";
  if (type === "user_tagged") return "📅";
  if (type === "reaction") return "❤️";
  if (type === "streak_reminder") return "🔥";
  if (type === "streak_milestone") return "🔥";
  if (type === "profile_view") return "👁️";
  if (type === "milestone") return "🎉";
  return "🔔";
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) setNotifs(await res.json());
    setLoading(false);
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function clearRead() {
    await fetch("/api/notifications", { method: "DELETE" });
    setNotifs((prev) => prev.filter((n) => !n.read));
  }

  useEffect(() => { load(); }, []);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const readCount = notifs.filter((n) => n.read).length;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-indigo-600 hover:underline font-medium">
              Mark all read
            </button>
          )}
          {readCount > 0 && (
            <button onClick={clearRead} className="text-sm text-gray-400 hover:text-red-500 hover:underline transition">
              Clear read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🔔</p>
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-400">You&apos;ll see messages and activity here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const inner = (
              <div
                className={`flex gap-4 p-4 rounded-2xl border transition ${
                  n.read ? "bg-white border-gray-100" : "bg-indigo-50 border-indigo-100"
                }`}
                onClick={() => !n.read && markRead(n.id)}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.read ? "text-gray-700" : "text-gray-900"}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                )}
              </div>
            );

            return n.linkUrl ? (
              <Link key={n.id} href={n.linkUrl} className="block hover:opacity-90 transition cursor-pointer">
                {inner}
              </Link>
            ) : (
              <div key={n.id} className="cursor-default">
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
