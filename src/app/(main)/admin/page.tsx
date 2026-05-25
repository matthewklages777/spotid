"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AdminUser {
  id: string; name?: string; email: string; createdAt: string;
  onboardingComplete: boolean; reportCount: number; banned: boolean;
  isPremium: boolean; premiumSince?: string;
  _count: { closetItems: number; workItems: number; dailyProfiles: number; profilePhotos: number };
}

interface Report {
  id: string; reason: string; details?: string; createdAt: string;
  reporterId: string; reportedId: string;
  reporter?: { id: string; name?: string; email: string };
  reported?: { id: string; name?: string; email: string };
}

type Panel = "reports" | "users" | "analytics";

interface Analytics {
  totals: {
    totalUsers: number; newUsers7d: number; newUsers30d: number;
    activeToday: number; active7d: number;
    totalDailyProfiles: number; dailyProfiles7d: number;
    totalMessages: number; messages7d: number;
    totalCloset: number; totalWork: number;
    totalFollows: number; totalReactions: number;
    totalPremium: number; newPremium7d: number;
  };
  signupTrend: { date: string; count: number }[];
  dapTrend: { date: string; count: number }[];
  topTags: { name: string; count: number }[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/signin"); return; }
    if (status !== "authenticated") return;
    fetchAll();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAll() {
    setLoading(true);
    const [rRes, uRes, aRes] = await Promise.all([
      fetch("/api/admin/reports"),
      fetch("/api/admin/users"),
      fetch("/api/admin/analytics"),
    ]);
    if (aRes.ok) setAnalytics(await aRes.json());
    if (rRes.status === 403 || uRes.status === 403) {
      setError("Access denied. Admin account required.");
      setLoading(false);
      return;
    }
    setReports(await rRes.json());
    setUsers(await uRes.json());
    setLoading(false);
  }

  async function dismissReport(reportId: string) {
    setDismissingId(reportId);
    await fetch("/api/admin/reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }),
    });
    setDismissingId(null);
    fetchAll();
  }

  async function toggleBan(userId: string, currentlyBanned: boolean, name?: string) {
    const action = currentlyBanned ? "unban" : "ban";
    if (!confirm(`${action === "ban" ? "Ban" : "Unban"} "${name || userId}"?`)) return;
    setDeletingId(userId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, banned: !currentlyBanned }),
    });
    setDeletingId(null);
    fetchAll();
  }

  async function togglePremium(userId: string, currentlyPremium: boolean, name?: string) {
    const action = currentlyPremium ? "revoke" : "grant";
    if (!confirm(`${action === "grant" ? "Grant" : "Revoke"} premium for "${name || userId}"?`)) return;
    setDeletingId(userId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isPremium: !currentlyPremium }),
    });
    setDeletingId(null);
    fetchAll();
  }

  async function deleteUser(userId: string, name?: string) {
    if (!confirm(`Permanently delete account for "${name || userId}"? This cannot be undone.`)) return;
    setDeletingId(userId);
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setDeletingId(null);
    fetchAll();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <p>Loading admin panel…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <p className="text-5xl">🔒</p>
        <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-500">{error}</p>
        <p className="text-xs text-gray-400">Set ADMIN_EMAIL in your .env.local to your account email.</p>
        <Link href="/" className="text-indigo-600 text-sm hover:underline">Go home</Link>
      </div>
    );
  }

  const pendingReports = reports.length;
  const totalUsers = users.length;
  const reportedUsers = users.filter((u) => u.reportCount > 0).sort((a, b) => b.reportCount - a.reportCount);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">SpotId Moderation Dashboard — {session?.user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: "Total Users", value: totalUsers, color: "text-gray-900" },
            { label: "Reports", value: pendingReports, color: pendingReports > 0 ? "text-red-600" : "text-gray-900" },
            { label: "Flagged Users", value: reportedUsers.length, color: reportedUsers.length > 0 ? "text-amber-600" : "text-gray-900" },
          ].map((s) => (
            <div key={s.label} className="px-6 py-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2 flex-wrap">
        {(["reports", "users", "analytics"] as Panel[]).map((p) => (
          <button
            key={p}
            onClick={() => setPanel(p)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition capitalize ${
              panel === p ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
            }`}
          >
            {p === "reports" ? `Reports (${pendingReports})` : p === "users" ? `All Users (${totalUsers})` : "📊 Analytics"}
          </button>
        ))}
      </div>

      {/* Reports panel */}
      {panel === "reports" && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-medium">No reports yet.</p>
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">{r.reason}</span>
                      <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-700 space-y-0.5">
                      <p>
                        <span className="text-gray-500">Reported user: </span>
                        <Link href={`/profile/${r.reported?.id}`} className="font-semibold text-indigo-600 hover:underline">
                          {r.reported?.name || r.reported?.email || r.reportedId}
                        </Link>
                      </p>
                      <p>
                        <span className="text-gray-500">By: </span>
                        <span className="font-medium">{r.reporter?.name || r.reporter?.email || r.reporterId}</span>
                      </p>
                      {r.details && (
                        <p className="mt-2 text-gray-600 italic bg-gray-50 rounded-lg px-3 py-2">
                          &ldquo;{r.details}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link
                      href={`/profile/${r.reported?.id}`}
                      target="_blank"
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-700 transition text-center"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => dismissReport(r.id)}
                      disabled={dismissingId === r.id}
                      className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium transition"
                    >
                      {dismissingId === r.id ? "…" : "Dismiss"}
                    </button>
                    <button
                      onClick={() => {
                        const userId = r.reported?.id || r.reportedId;
                        const u = users.find((u) => u.id === userId);
                        toggleBan(userId, u?.banned ?? false, r.reported?.name);
                      }}
                      disabled={deletingId === (r.reported?.id || r.reportedId)}
                      className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium transition"
                    >
                      {deletingId === (r.reported?.id || r.reportedId) ? "…" : (() => { const u = users.find((u) => u.id === (r.reported?.id || r.reportedId)); return u?.banned ? "Unban" : "Ban User"; })()}
                    </button>
                    <button
                      onClick={() => deleteUser(r.reported?.id || r.reportedId, r.reported?.name)}
                      disabled={deletingId === (r.reported?.id || r.reportedId)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-medium transition"
                    >
                      {deletingId === (r.reported?.id || r.reportedId) ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Users panel */}
      {panel === "users" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reports</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className={u.banned ? "bg-gray-50 opacity-60" : u.reportCount > 0 ? "bg-red-50/30" : ""}>
                  <td className="px-5 py-3">
                    <Link href={`/profile/${u.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition">
                      {u.name || "—"}
                    </Link>
                    <p className="text-xs text-gray-400">{u.email}</p>
                    {u.isPremium && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">✅ Premium</span>}
                    {u.banned && <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium ml-1">Banned</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {u.reportCount > 0
                      ? <span className="text-red-700 font-bold">{u.reportCount}</span>
                      : <span className="text-gray-300">0</span>
                    }
                  </td>
                  <td className="px-3 py-3 text-center text-gray-500 text-xs">
                    {u._count.closetItems}🏷️ {u._count.workItems}💼
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => togglePremium(u.id, u.isPremium, u.name)}
                        disabled={deletingId === u.id}
                        className={`text-xs hover:underline disabled:opacity-40 ${u.isPremium ? "text-yellow-600 hover:text-yellow-800" : "text-indigo-500 hover:text-indigo-700"}`}
                      >
                        {deletingId === u.id ? "…" : u.isPremium ? "Revoke ✅" : "Grant ✅"}
                      </button>
                      <button
                        onClick={() => toggleBan(u.id, u.banned, u.name)}
                        disabled={deletingId === u.id}
                        className={`text-xs hover:underline disabled:opacity-40 ${u.banned ? "text-green-600 hover:text-green-800" : "text-orange-500 hover:text-orange-700"}`}
                      >
                        {deletingId === u.id ? "…" : u.banned ? "Unban" : "Ban"}
                      </button>
                      <button
                        onClick={() => deleteUser(u.id, u.name)}
                        disabled={deletingId === u.id}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-40"
                      >
                        {deletingId === u.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Analytics panel */}
      {panel === "analytics" && (
        <div className="space-y-5">
          {!analytics ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              <p className="text-4xl mb-3 animate-pulse">📊</p>
              <p>Loading analytics…</p>
            </div>
          ) : (
            <>
              {/* KPI grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Users", value: analytics.totals.totalUsers, sub: `+${analytics.totals.newUsers7d} this week`, color: "text-gray-900" },
                  { label: "Active Today", value: analytics.totals.activeToday, sub: `${analytics.totals.active7d} unique this week`, color: "text-green-600" },
                  { label: "Daily Posts (7d)", value: analytics.totals.dailyProfiles7d, sub: `${analytics.totals.totalDailyProfiles} all time`, color: "text-indigo-600" },
                  { label: "Messages (7d)", value: analytics.totals.messages7d, sub: `${analytics.totals.totalMessages} all time`, color: "text-purple-600" },
                  { label: "Active Listings", value: analytics.totals.totalCloset, sub: "Closet items", color: "text-orange-600" },
                  { label: "Services", value: analytics.totals.totalWork, sub: "Work listings", color: "text-teal-600" },
                  { label: "Premium Members", value: analytics.totals.totalPremium, display: String(analytics.totals.totalPremium), sub: `+${analytics.totals.newPremium7d} this week`, color: "text-yellow-600" },
                  { label: "Est. MRR", value: analytics.totals.totalPremium * 4.99, display: `$${(analytics.totals.totalPremium * 4.99).toFixed(2)}`, sub: `$${(analytics.totals.totalPremium * 4.99 * 12).toFixed(0)}/yr run rate`, color: "text-green-700" },
                  { label: "Total Follows", value: analytics.totals.totalFollows, display: analytics.totals.totalFollows.toLocaleString(), sub: "User connections", color: "text-blue-600" },
                  { label: "Total Likes", value: analytics.totals.totalReactions, display: analytics.totals.totalReactions.toLocaleString(), sub: "Daily profile reactions", color: "text-red-500" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <p className={`text-3xl font-black ${stat.color}`}>{("display" in stat ? stat.display : null) ?? stat.value.toLocaleString()}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-1">{stat.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Signup trend sparkline */}
              {(() => {
                const max = Math.max(...analytics.signupTrend.map((d) => d.count), 1);
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">New Signups</h3>
                        <p className="text-xs text-gray-400">Last 30 days · {analytics.totals.newUsers30d} total</p>
                      </div>
                      <span className="text-2xl font-black text-indigo-600">+{analytics.totals.newUsers7d}</span>
                    </div>
                    <div className="flex items-end gap-0.5 h-16">
                      {analytics.signupTrend.map((d) => (
                        <div
                          key={d.date}
                          className="flex-1 bg-indigo-200 hover:bg-indigo-400 rounded-t transition group relative"
                          style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 4 : 2)}%` }}
                          title={`${d.date}: ${d.count}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{analytics.signupTrend[0]?.date}</span>
                      <span>Today</span>
                    </div>
                  </div>
                );
              })()}

              {/* DAP trend sparkline */}
              {(() => {
                const max = Math.max(...analytics.dapTrend.map((d) => d.count), 1);
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">Daily Active Posts</h3>
                        <p className="text-xs text-gray-400">Profiles tagged per day · last 30 days</p>
                      </div>
                      <span className="text-2xl font-black text-green-600">{analytics.totals.activeToday} today</span>
                    </div>
                    <div className="flex items-end gap-0.5 h-16">
                      {analytics.dapTrend.map((d) => (
                        <div
                          key={d.date}
                          className="flex-1 bg-green-200 hover:bg-green-400 rounded-t transition"
                          style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 4 : 2)}%` }}
                          title={`${d.date}: ${d.count}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{analytics.dapTrend[0]?.date}</span>
                      <span>Today</span>
                    </div>
                  </div>
                );
              })()}

              {/* Top hashtags */}
              {analytics.topTags.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-1">Top Hashtags This Week</h3>
                  <p className="text-xs text-gray-400 mb-4">By daily profile usage</p>
                  <div className="space-y-2">
                    {analytics.topTags.map((tag, i) => {
                      const pct = Math.round((tag.count / analytics.topTags[0].count) * 100);
                      return (
                        <div key={tag.name} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
                          <span className="text-sm font-semibold text-indigo-600 w-32 truncate">#{tag.name}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{tag.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Cron Jobs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <h2 className="font-bold text-gray-900">Cron Jobs</h2>
          <p className="text-sm text-gray-400 mt-0.5">Trigger scheduled jobs manually. These run automatically when Railway cron is configured.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CronButton label="🔥 Streak Reminders" endpoint="/api/cron/streak-reminder" />
          <CronButton label="📰 Weekly Digest" endpoint="/api/cron/digest" />
          <CronButton label="✅ Premium Stats" endpoint="/api/cron/premium-stats" />
        </div>
      </div>

    </div>
  );
}

function CronButton({ label, endpoint }: { label: string; endpoint: string }) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState("");

  async function run() {
    setStatus("running");
    setResult("");
    try {
      const secret = prompt("Enter CRON_SECRET (or leave blank if not set):");
      const res = await fetch(`${endpoint}?secret=${encodeURIComponent(secret || "")}`, { method: "GET" });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
      setStatus(res.ok ? "done" : "error");
    } catch (e) {
      setResult(String(e));
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={run}
        disabled={status === "running"}
        className={`text-sm px-4 py-2 rounded-xl font-semibold transition ${
          status === "done" ? "bg-green-100 text-green-700" :
          status === "error" ? "bg-red-100 text-red-700" :
          "bg-indigo-600 text-white hover:bg-indigo-700"
        } disabled:opacity-50`}
      >
        {status === "running" ? "Running…" : status === "done" ? "✓ Done" : status === "error" ? "✗ Error" : label}
      </button>
      {result && (
        <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-2 max-w-xs overflow-auto max-h-24 text-gray-600">
          {result}
        </pre>
      )}
    </div>
  );
}
