"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BlockedUser { id: string; name?: string; username?: string; image?: string }

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<{ ok?: boolean; msg?: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const [emailMessages, setEmailMessages] = useState(true);
  const [emailTagFollows, setEmailTagFollows] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [emailFollowers, setEmailFollowers] = useState(true);
  const [savingNotifPrefs, setSavingNotifPrefs] = useState(false);
  const [notifPrefsSaved, setNotifPrefsSaved] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch("/api/block?list=1").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setBlockedUsers(d);
    }).catch(() => {});
    fetch("/api/settings/notifications").then((r) => r.json()).then((d) => {
      if (typeof d.emailMessages === "boolean") setEmailMessages(d.emailMessages);
      if (typeof d.emailTagFollows === "boolean") setEmailTagFollows(d.emailTagFollows);
      if (typeof d.emailDigest === "boolean") setEmailDigest(d.emailDigest);
      if (typeof d.emailFollowers === "boolean") setEmailFollowers(d.emailFollowers);
    }).catch(() => {});
  }, [session]);

  async function unblock(blockedId: string) {
    setUnblocking(blockedId);
    await fetch(`/api/block?blockedId=${blockedId}`, { method: "DELETE" });
    setBlockedUsers((prev) => prev.filter((u) => u.id !== blockedId));
    setUnblocking(null);
  }

  if (!session) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-gray-500">
        <p className="text-4xl mb-4">🔒</p>
        <p>You must be signed in to access settings.</p>
        <Link href="/signin" className="mt-4 inline-block text-indigo-600 hover:underline">Sign in</Link>
      </div>
    );
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwStatus(null);
    if (newPassword !== confirmPassword) {
      setPwStatus({ ok: false, msg: "New passwords do not match." });
      return;
    }
    setSavingPw(true);
    const res = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSavingPw(false);
    if (res.ok) {
      setPwStatus({ ok: true, msg: "Password changed successfully." });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } else {
      setPwStatus({ ok: false, msg: data.error });
    }
  }

  async function saveNotifPrefs() {
    setSavingNotifPrefs(true);
    await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailMessages, emailTagFollows, emailDigest, emailFollowers }),
    });
    setSavingNotifPrefs(false);
    setNotifPrefsSaved(true);
    setTimeout(() => setNotifPrefsSaved(false), 2000);
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (deleteConfirm !== "DELETE") {
      setDeleteStatus("Type DELETE exactly to confirm.");
      return;
    }
    setDeleting(true);
    const res = await fetch("/api/settings/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    const data = await res.json();
    if (res.ok) {
      await signOut({ redirect: false });
      router.push("/?deleted=1");
    } else {
      setDeleteStatus(data.error || "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-7">
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          <p className="text-gray-400 text-sm mt-1">{session.user?.name} · {session.user?.email}</p>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Change Password</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your password must be at least 8 characters.</p>
        </div>
        <form onSubmit={changePassword} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {pwStatus && (
            <div className={`text-sm px-4 py-3 rounded-xl ${pwStatus.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {pwStatus.msg}
            </div>
          )}
          <button
            type="submit"
            disabled={savingPw || !currentPassword || !newPassword || !confirmPassword}
            className="bg-indigo-600 text-white text-sm px-6 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition font-semibold"
          >
            {savingPw ? "Saving…" : "Update Password"}
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Email Notifications</h2>
          <p className="text-sm text-gray-500 mt-0.5">Control which emails SpotId sends you.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: "New messages", desc: "When someone sends you an in-app message", val: emailMessages, set: setEmailMessages },
            { label: "New followers", desc: "When someone starts following you", val: emailFollowers, set: setEmailFollowers },
            { label: "Tag follows", desc: "When someone tags with a hashtag you follow", val: emailTagFollows, set: setEmailTagFollows },
            { label: "Weekly digest", desc: "A weekly summary of people you follow", val: emailDigest, set: setEmailDigest },
          ].map(({ label, desc, val, set }) => (
            <label key={label} className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={val}
                onClick={() => set(!val)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${val ? "bg-indigo-600" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${val ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </label>
          ))}
          <button
            onClick={saveNotifPrefs}
            disabled={savingNotifPrefs}
            className="text-sm bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition font-semibold disabled:opacity-40"
          >
            {notifPrefsSaved ? "✓ Saved" : savingNotifPrefs ? "Saving…" : "Save Preferences"}
          </button>
        </div>
      </div>

      {/* Blocked Users */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Blocked Users</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Blocked users won&apos;t appear in your search results and can&apos;t message you.
          </p>
        </div>
        <div className="px-6 py-5">
          {blockedUsers.length === 0 ? (
            <p className="text-sm text-gray-400 italic">You haven&apos;t blocked anyone.</p>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0 overflow-hidden">
                    {u.image
                      ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                      : (u.name?.[0] ?? "?").toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.name || "Anonymous"}</p>
                    {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/profile/${u.id}`} className="text-xs text-gray-400 hover:text-indigo-600 transition">
                      View profile
                    </Link>
                    <button
                      onClick={() => unblock(u.id)}
                      disabled={unblocking === u.id}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition disabled:opacity-40"
                    >
                      {unblocking === u.id ? "Unblocking…" : "Unblock"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Privacy & Data */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Privacy &amp; Data</h2>
          <p className="text-sm text-gray-500 mt-0.5">Download a copy of all data SpotId holds about you.</p>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            Your export includes your profile, daily history, closet &amp; work listings, messages, social graph,
            followed hashtags, and notification history — as a single JSON file.
          </p>
          <a
            href="/api/user/export"
            download
            className="inline-flex items-center gap-2 text-sm bg-gray-800 text-white px-5 py-2 rounded-xl hover:bg-gray-900 transition font-semibold"
          >
            <span>⬇</span> Download My Data
          </a>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-red-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-red-100 bg-red-50">
          <h2 className="font-bold text-red-900">Danger Zone</h2>
          <p className="text-sm text-red-700 mt-0.5">These actions are permanent and cannot be undone.</p>
        </div>
        <form onSubmit={deleteAccount} className="px-6 py-5 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 space-y-1">
            <p className="font-semibold">Deleting your account will permanently remove:</p>
            <ul className="list-disc list-inside space-y-0.5 text-red-700">
              <li>Your profile, photos, and bio</li>
              <li>All Daily Profile history</li>
              <li>All Closet listings</li>
              <li>All Work listings</li>
              <li>All blocks and reports you&apos;ve made</li>
            </ul>
            <p className="pt-1">Your data will be removed from search results immediately.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter your password to confirm</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
              placeholder="Your current password"
              className="w-full px-3 py-2 border border-red-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-red-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          {deleteStatus && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
              {deleteStatus}
            </div>
          )}
          <button
            type="submit"
            disabled={deleting || deleteConfirm !== "DELETE" || !deletePassword}
            className="bg-red-600 text-white text-sm px-6 py-2 rounded-xl hover:bg-red-700 disabled:opacity-40 transition font-semibold"
          >
            {deleting ? "Deleting account…" : "Permanently Delete My Account"}
          </button>
        </form>
      </div>

    </div>
  );
}
