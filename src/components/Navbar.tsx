"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface Notification {
  id: string; type: string; title: string; body: string; read: boolean;
  linkUrl?: string; createdAt: string;
}

function NotificationBell() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchNotifs() {
    const res = await fetch("/api/notifications");
    if (res.ok) setNotifs(await res.json());
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-gray-500 hover:text-indigo-600 transition p-1"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 bg-white rounded-2xl shadow-xl border border-gray-100 w-80 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No notifications yet.</p>
            ) : (
              notifs.map((n) => (
                <a
                  key={n.id}
                  href={n.linkUrl || "/messages"}
                  onClick={() => {
                    setOpen(false);
                    if (!n.read) {
                      fetch("/api/notifications", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: n.id }),
                      });
                      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
                    }
                  }}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition ${!n.read ? "bg-indigo-50/40" : ""}`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {n.type === "message" ? "✉️" : n.type === "save" ? "★" : n.type === "report_filed" ? "🚩" : n.type === "tag_follow" ? "#️⃣" : n.type === "follow" ? "👤" : n.type === "user_tagged" ? "📅" : n.type === "reaction" ? "❤️" : n.type === "streak_reminder" ? "🔥" : "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />}
                </a>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
            <Link href="/notifications" onClick={() => setOpen(false)}
              className="text-xs text-indigo-600 hover:underline font-medium">
              View all →
            </Link>
            <Link href="/messages" onClick={() => setOpen(false)}
              className="text-xs text-gray-500 hover:underline">
              Messages
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function useUnreadMessages(enabled: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const fetch_ = () =>
      fetch("/api/messages").then((r) => r.json()).then((d) => {
        const n = (d.received || []).filter((m: { read: boolean }) => !m.read).length;
        setCount(n);
      }).catch(() => {});
    fetch_();
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, [enabled]);
  return count;
}

function UserMenu({ session, userId, isAdmin }: {
  session: { user?: { name?: string | null; image?: string | null } };
  userId: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const image = session.user?.image;
  const name = session.user?.name;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 overflow-hidden hover:ring-2 hover:ring-indigo-400 transition"
        title="Account menu"
      >
        {image
          ? <img src={image} alt={name || ""} className="w-full h-full object-cover" />
          : (name?.[0] ?? "?").toUpperCase()
        }
      </button>

      {open && (
        <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-xl border border-gray-100 w-52 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm truncate">{name || "Account"}</p>
          </div>
          {[
            { href: `/profile/${userId}`, icon: "👤", label: "My Profile" },
            { href: "/feed", icon: "📰", label: "My Feed" },
            { href: "/followers", icon: "🤝", label: "Followers" },
            { href: "/saved", icon: "★", label: "Saved Profiles" },
            { href: "/following-tags", icon: "#️⃣", label: "Followed Tags" },
            { href: "/invite", icon: "🔗", label: "Invite Friends" },
            { href: "/upgrade", icon: "✨", label: "Go Premium" },
            { href: "/settings", icon: "⚙️", label: "Settings" },
            { href: "/help", icon: "❓", label: "Help & FAQ" },
            ...(isAdmin ? [{ href: "/admin", icon: "🛡️", label: "Admin Panel" }] : []),
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <div className="border-t border-gray-100">
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
            >
              <span>🚪</span> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const userId = (session?.user as { id?: string })?.id;
  const unreadMessages = useUnreadMessages(!!session);

  const adminEmail = process.env["NEXT_PUBLIC_ADMIN_EMAIL"];
  const isAdmin = !!adminEmail && session?.user?.email === adminEmail;

  // Primary nav links — keep this short
  const mainLinks = [
    { href: "/", label: "Home" },
    { href: "/search", label: "Search" },
    { href: "/discover", label: "Discover" },
    { href: "/browse", label: "Browse" },
    { href: "/trending", label: "Trending" },
    { href: "/leaderboard", label: "Leaderboard" },
    ...(session
      ? [
          { href: "/feed", label: "Feed" },
          { href: "/daily", label: "Daily" },
          { href: "/closet", label: "Closet" },
          { href: "/work", label: "Work" },
          { href: "/messages", label: "Messages" },
        ]
      : []),
  ];

  // Mobile also gets the user-menu items inline
  const mobileExtra = session ? [
    { href: "/browse", label: "Browse Marketplace" },
    { href: `/profile/${userId}`, label: "Profile" },
    { href: "/followers", label: "Followers" },
    { href: "/saved", label: "Saved" },
    { href: "/notifications", label: "Notifications" },
    { href: "/settings", label: "Settings" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ] : [];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal.svg" alt="SpotId" height={48} style={{ height: 48, width: "auto" }} />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-5">
          {mainLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative text-sm font-medium transition ${
                pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href))
                  ? "text-indigo-600"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
            >
              {l.label}
              {l.label === "Messages" && unreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-3 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {session && userId ? (
            <>
              <NotificationBell />
              <UserMenu
                session={session}
                userId={userId}
                isAdmin={isAdmin}
              />
            </>
          ) : (
            <>
              <Link href="/signin" className="text-sm text-gray-600 hover:text-indigo-600">Sign in</Link>
              <Link
                href="/signup"
                className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-full hover:bg-indigo-700 transition"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          {[...mainLinks, ...mobileExtra].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center justify-between text-sm font-medium py-2 px-2 rounded-lg ${
                pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href))
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              {l.label}
              {l.label === "Messages" && unreadMessages > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unreadMessages}
                </span>
              )}
            </Link>
          ))}
          {session ? (
            <button
              onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/signin" }); }}
              className="w-full text-left text-sm text-red-500 py-2 px-2"
            >
              Sign out
            </button>
          ) : (
            <div className="flex gap-3 pt-1">
              <Link href="/signin" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-1">Sign in</Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)} className="text-sm text-indigo-600 font-semibold py-1">Sign up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
