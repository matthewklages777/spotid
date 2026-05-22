import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, premiumStatsEmail } from "@/lib/email";

// GET /api/cron/premium-stats
// Called weekly by Railway cron. Sends each premium user a stats digest.
// Protect with CRON_SECRET env var.
export async function GET(req: NextRequest) {
  const secret = process.env["CRON_SECRET"];
  const auth = req.headers.get("authorization") || req.nextUrl.searchParams.get("secret");
  if (secret && auth !== secret && auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = process.env["NEXTAUTH_URL"] || "https://www.spotidapp.com";
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
  const dayMs = 86_400_000;

  // All premium users with email
  const premiumUsers = await prisma.user.findMany({
    where: { isPremium: true, email: { not: "" } },
    select: { id: true, name: true, email: true, username: true, profileViews: true },
  });

  let sent = 0;
  let skipped = 0;

  for (const user of premiumUsers) {
    if (!user.email) { skipped++; continue; }

    // Views this week
    const viewsThisWeek = await prisma.profileViewStat.aggregate({
      _sum: { count: true },
      where: { userId: user.id, date: { gte: sevenDaysAgoStr } },
    });
    const weeklyViews = viewsThisWeek._sum.count ?? 0;

    // Streak computation
    const allDates = await prisma.dailyProfile.findMany({
      where: { userId: user.id },
      select: { date: true },
      orderBy: { date: "desc" },
    });
    let streak = 0;
    for (let i = 0; i < allDates.length; i++) {
      const expected = new Date(Date.now() - i * dayMs).toISOString().slice(0, 10);
      if (allDates[i].date === expected) streak++;
      else break;
    }

    // Top 3 recent viewers (deduplicated by viewer)
    const recentViews = await prisma.profileView.findMany({
      where: { viewedId: user.id, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        viewer: { select: { id: true, name: true, username: true } },
      },
    });
    const seen = new Set<string>();
    const topViewers: { name: string; profileUrl: string }[] = [];
    for (const v of recentViews) {
      if (seen.has(v.viewer.id)) continue;
      seen.add(v.viewer.id);
      topViewers.push({
        name: v.viewer.name || v.viewer.username || "Anonymous",
        profileUrl: v.viewer.username ? `${base}/u/${v.viewer.username}` : `${base}/profile/${v.viewer.id}`,
      });
      if (topViewers.length >= 3) break;
    }

    const profileUrl = user.username ? `${base}/u/${user.username}` : `${base}/profile/${user.id}`;

    await sendEmail({
      to: user.email,
      ...premiumStatsEmail(
        user.name || "",
        { viewsThisWeek: weeklyViews, viewsAllTime: user.profileViews, streak, totalDays: allDates.length },
        topViewers,
        profileUrl,
        `${base}/settings`,
      ),
    });
    sent++;
  }

  return Response.json({ sent, skipped, total: premiumUsers.length });
}
