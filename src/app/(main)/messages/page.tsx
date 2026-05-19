"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface MsgUser { id: string; name?: string; image?: string }
interface Message {
  id: string; subject?: string; body: string; read: boolean; createdAt: string;
  senderId: string; recipientId: string;
  sender?: MsgUser; recipient?: MsgUser;
}

interface Thread {
  otherId: string;
  otherUser?: MsgUser;
  messages: Message[];
  unread: number;
  lastAt: string;
}

function ComposeModal({ recipientId, recipientName, initialSubject, initialBody, onClose, onSent }: {
  recipientId: string; recipientName?: string;
  initialSubject?: string; initialBody?: string;
  onClose: () => void; onSent: () => void;
}) {
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [body, setBody] = useState(initialBody ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, subject, body }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to send"); setSending(false); return; }
    onSent();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Message {recipientName || "User"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={send} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            Messages are for legitimate inquiry only. Harassment or spam will result in a permanent ban.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject (optional)</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Re: your listing"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={5}
              placeholder="Write your message here…"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Cancel</button>
            <button type="submit" disabled={sending || !body.trim()}
              className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition">
              {sending ? "Sending…" : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ThreadView({ thread, myId, onSent, onBack }: {
  thread: Thread; myId: string;
  onSent: () => void;
  onBack: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages]);

  const other = thread.otherUser;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: other?.id, body: body.trim() }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed to send");
      setSending(false);
      return;
    }
    setBody("");
    if (textareaRef.current) textareaRef.current.style.height = "40px";
    setSending(false);
    onSent();
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <button onClick={onBack} className="text-indigo-600 hover:underline text-sm font-medium">
          ← Back
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 overflow-hidden flex-shrink-0">
          {other?.image
            ? <img src={other.image} alt={other.name} className="w-full h-full object-cover" />
            : (other?.name?.[0] ?? "?").toUpperCase()
          }
        </div>
        <Link href={`/profile/${other?.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 text-sm">
          {other?.name || "User"}
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {thread.messages.map((m) => {
          const isMe = m.senderId === myId;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMe ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-800"}`}>
                {m.subject && (
                  <p className={`text-xs font-semibold mb-1 ${isMe ? "text-indigo-200" : "text-gray-500"}`}>
                    Re: {m.subject}
                  </p>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>
                <p className={`text-xs mt-1 ${isMe ? "text-indigo-300" : "text-gray-400"}`}>
                  {new Date(m.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Inline reply */}
      <form onSubmit={send} className="px-4 py-3 border-t border-gray-100 bg-white">
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${other?.name || "…"}`}
            rows={1}
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none overflow-hidden"
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 transition text-sm flex-shrink-0"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">⌘↵ to send</p>
      </form>
    </div>
  );
}

function MessagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [compose, setCompose] = useState<{ id: string; name?: string; subject?: string; body?: string } | null>(null);

  const myId = (session?.user as { id?: string })?.id;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/signin"); return; }
    if (status !== "authenticated") return;

    const toId = params.get("to");
    const toName = params.get("name");
    const itemTitle = params.get("item");
    if (toId) setCompose({
      id: toId,
      name: toName || undefined,
      subject: itemTitle ? `Re: ${itemTitle}` : undefined,
      body: itemTitle ? `Hi, I'm interested in "${itemTitle}". Is it still available?\n\n` : undefined,
    });

    load();
    const interval = setInterval(() => load(true), 30_000);
    return () => clearInterval(interval);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(silent = false) {
    if (!silent) setLoading(true);
    const res = await fetch("/api/messages");
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();

    const allMessages: Message[] = [
      ...(data.received || []),
      ...(data.sent || []),
    ];

    // Group into threads by the other participant's ID
    const threadMap = new Map<string, Thread>();
    for (const m of allMessages) {
      const otherId = m.senderId === myId ? m.recipientId : m.senderId;
      const otherUser = m.senderId === myId ? m.recipient : m.sender;
      const existing = threadMap.get(otherId);
      if (!existing) {
        threadMap.set(otherId, {
          otherId,
          otherUser,
          messages: [m],
          unread: (!m.read && m.recipientId === myId) ? 1 : 0,
          lastAt: m.createdAt,
        });
      } else {
        existing.messages.push(m);
        if (!m.read && m.recipientId === myId) existing.unread++;
        if (m.createdAt > existing.lastAt) existing.lastAt = m.createdAt;
        if (otherUser && !existing.otherUser) existing.otherUser = otherUser;
      }
    }

    // Sort messages within each thread chronologically
    for (const thread of threadMap.values()) {
      thread.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    // Sort threads by most recent
    const sorted = [...threadMap.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    setThreads(sorted);

    // If we were viewing a thread, refresh it
    if (activeThread) {
      const refreshed = sorted.find((t) => t.otherId === activeThread.otherId);
      if (refreshed) setActiveThread(refreshed);
    }

    setLoading(false);
  }

  async function markThreadRead(thread: Thread) {
    const unreadIds = thread.messages
      .filter((m) => !m.read && m.recipientId === myId)
      .map((m) => m.id);
    await Promise.all(unreadIds.map((id) =>
      fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
    ));
    setThreads((prev) => prev.map((t) =>
      t.otherId === thread.otherId
        ? { ...t, unread: 0, messages: t.messages.map((m) => ({ ...m, read: true })) }
        : t
    ));
    if (activeThread?.otherId === thread.otherId) {
      setActiveThread((prev) => prev ? { ...prev, unread: 0, messages: prev.messages.map((m) => ({ ...m, read: true })) } : null);
    }
  }

  function openThread(thread: Thread) {
    setActiveThread(thread);
    if (thread.unread > 0) markThreadRead(thread);
  }

  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {compose && (
        <ComposeModal
          recipientId={compose.id}
          recipientName={compose.name}
          initialSubject={compose.subject}
          initialBody={compose.body}
          onClose={() => setCompose(null)}
          onSent={() => { load(); setCompose(null); }}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <h1 className="text-xl font-bold text-white">
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 bg-white/20 text-white text-sm px-2 py-0.5 rounded-full">{totalUnread} new</span>
            )}
          </h1>
          <Link
            href="/search"
            className="text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full font-semibold transition"
          >
            + New Message
          </Link>
        </div>

        {activeThread ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ThreadView
              thread={activeThread}
              myId={myId || ""}
              onSent={() => load(true)}
              onBack={() => setActiveThread(null)}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <p>Loading messages…</p>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p className="text-4xl mb-3">📬</p>
                <p className="font-medium">No messages yet.</p>
                <p className="text-sm mt-1">Visit someone&apos;s profile and tap <strong>Message</strong> to start a conversation.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {threads.map((thread) => {
                  const last = thread.messages[thread.messages.length - 1];
                  const other = thread.otherUser;
                  return (
                    <button
                      key={thread.otherId}
                      onClick={() => openThread(thread)}
                      className={`w-full text-left flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition ${thread.unread > 0 ? "bg-indigo-50/30" : ""}`}
                    >
                      <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-base font-bold text-indigo-600 flex-shrink-0 overflow-hidden">
                        {other?.image
                          ? <img src={other.image} alt={other.name} className="w-full h-full object-cover" />
                          : (other?.name?.[0] ?? "?").toUpperCase()
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`text-sm ${thread.unread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                            {other?.name || "Unknown user"}
                          </p>
                          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                            {new Date(thread.lastAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 truncate ${thread.unread > 0 ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                          {last?.senderId === myId ? "You: " : ""}{last?.body}
                        </p>
                      </div>
                      {thread.unread > 0 && (
                        <span className="w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          {thread.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32 text-gray-400">Loading…</div>}>
      <MessagesContent />
    </Suspense>
  );
}
