import { requireAdmin } from "@/lib/isAdmin";
import { prisma } from "@/lib/prisma";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const today = new Date().toISOString().split("T")[0];
  const [
    totalUsers,
    newUsers7d,
    newUsers30d,
    activeToday,
    active7d,
    totalDailyProfiles,
    dailyProfiles7d,
    totalMessages,
    messages7d,
    totalCloset,
    totalWork,
    totalFollows,
    totalReactions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: daysAgo(7) } } }),
    prisma.user.count({ where: { createdAt: { gte: daysAgo(30) } } }),
    prisma.dailyProfile.groupBy({ by: ["userId"], where: { date: today } }).then((r: unknown[]) => r.length),
    prisma.dailyProfile.groupBy({ by: ["userId"], where: { date: { gte: dateStr(7) } } }).then((r: unknown[]) => r.length),
    prisma.dailyProfile.count(),
    prisma.dailyProfile.count({ where: { date: { gte: dateStr(7) } } }),
    prisma.message.count(),
    prisma.message.count({ where: { createdAt: { gte: daysAgo(7) } } }),
    prisma.closetItem.count({ where: { sold: false } }),
    prisma.workItem.count(),
    prisma.follow.count(),
    prisma.dailyProfileReaction.count(),
  ]);

  // Signups per day — last 30 days
  const signupRows = await prisma.user.findMany({
    where: { createdAt: { gte: daysAgo(30) } },
    select: { createdAt: true },
  });
  const signupByDay = new Map<string, number>();
  for (const u of signupRows) {
    const d = u.createdAt.toISOString().split("T")[0];
    signupByDay.set(d, (signupByDay.get(d) ?? 0) + 1);
  }
  const signupTrend = Array.from({ length: 30 }, (_, i) => {
    const d = dateStr(29 - i);
    return { date: d, count: signupByDay.get(d) ?? 0 };
  });

  // Daily active (profiles posted) per day — last 30 days
  const dapRows = await prisma.dailyProfile.findMany({
    where: { date: { gte: dateStr(30) } },
    select: { date: true },
    distinct: ["date"],
  });
  void dapRows; // unused — using groupBy below instead
  // Group by date
  const dapGrouped = await prisma.dailyProfile.groupBy({
    by: ["date"],
    where: { date: { gte: dateStr(30) } },
    _count: { userId: true },
    orderBy: { date: "asc" },
  });
  const dapTrend = Array.from({ length: 30 }, (_, i) => {
    const d = dateStr(29 - i);
    const row = dapGrouped.find((r) => r.date === d);
    return { date: d, count: row?._count.userId ?? 0 };
  });

  // Top hashtags — last 7 days
  const topTagRows = await prisma.dailyProfileHashtag.groupBy({
    by: ["hashtagId"],
    where: { dailyProfile: { date: { gte: dateStr(7) } } },
    _count: { hashtagId: true },
    orderBy: { _count: { hashtagId: "desc" } },
    take: 10,
  });
  const tagNames = await prisma.hashtag.findMany({
    where: { id: { in: topTagRows.map((r) => r.hashtagId) } },
    select: { id: true, name: true },
  });
  const tagNameMap = Object.fromEntries(tagNames.map((t) => [t.id, t.name]));
  const topTags = topTagRows.map((r) => ({
    name: tagNameMap[r.hashtagId] ?? "?",
    count: r._count.hashtagId,
  }));

  return Response.json({
    totals: { totalUsers, newUsers7d, newUsers30d, activeToday, active7d, totalDailyProfiles, dailyProfiles7d, totalMessages, messages7d, totalCloset, totalWork, totalFollows, totalReactions },
    signupTrend,
    dapTrend,
    topTags,
  });
}
