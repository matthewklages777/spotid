import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const dayMs = 86_400_000;

  // Top users by followers
  const topByFollowers = await prisma.user.findMany({
    where: { followers: { some: {} } },
    select: {
      id: true, name: true, image: true, occupation: true, username: true, isPremium: true,
      _count: { select: { followers: true } },
    },
    orderBy: { followers: { _count: "desc" } },
    take: 10,
  });

  // Top users by streak — get candidates from recent activity, then batch-fetch all dates
  const recentActiveUsers = await prisma.dailyProfile.groupBy({
    by: ["userId"],
    where: { date: { gte: new Date(Date.now() - 30 * dayMs).toISOString().split("T")[0] } },
    _count: { userId: true },
    orderBy: { _count: { userId: "desc" } },
    take: 30, // Fetch extra so we have enough after filtering low-streak users
  });

  const userIds = recentActiveUsers.map((r: { userId: string; _count: { userId: number } }) => r.userId);

  // Single batched query for all dates across all candidate users
  const [users, allDailyDates] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true, occupation: true, username: true, isPremium: true },
    }),
    prisma.dailyProfile.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, date: true },
      orderBy: { date: "desc" },
    }),
  ]);

  // Group dates by userId
  const datesByUser = new Map<string, string[]>();
  for (const row of allDailyDates) {
    const arr = datesByUser.get(row.userId) ?? [];
    arr.push(row.date);
    datesByUser.set(row.userId, arr);
  }

  // Compute streak for each user in-memory (already sorted desc by the query)
  const streakUsers = userIds.map((uid) => {
    const dates = datesByUser.get(uid) ?? [];
    let streak = 0;
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(Date.now() - i * dayMs).toISOString().slice(0, 10);
      if (dates[i] === expected) streak++;
      else break;
    }
    const u = users.find((u) => u.id === uid);
    return u ? { ...u, streak, totalDays: dates.length } : null;
  });

  const topByStreak = streakUsers
    .filter((u): u is NonNullable<typeof u> => u !== null && u.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 10);

  // Most active today
  const activeToday = await prisma.user.findMany({
    where: { dailyProfiles: { some: { date: today, hashtags: { some: {} } } } },
    select: {
      id: true, name: true, image: true, occupation: true, username: true, isPremium: true,
      dailyProfiles: {
        where: { date: today },
        include: { hashtags: { include: { hashtag: true } } },
      },
    },
    take: 10,
  });

  return Response.json({
    topByFollowers: topByFollowers.map((u) => ({ ...u, followerCount: u._count.followers })),
    topByStreak,
    activeToday,
  });
}
