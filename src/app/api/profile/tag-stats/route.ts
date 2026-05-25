import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returns hashtag usage stats for the authenticated user.
// Premium: includes per-tag view correlation (avg views on days each tag was used).
// Free: returns tag frequency only (no view data), with isPremium: false so the
//       client can show a locked/upgrade state.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true },
  });
  const isPremium = user?.isPremium ?? false;

  // Get all daily profiles with their hashtags, ordered by date desc, last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const dailyProfiles = await prisma.dailyProfile.findMany({
    where: { userId, date: { gte: cutoffStr } },
    select: {
      date: true,
      hashtags: { select: { hashtag: { select: { name: true } } } },
    },
  });

  if (dailyProfiles.length === 0) {
    return Response.json({ tags: [], isPremium, totalDays: 0 });
  }

  // Build a map: tagName -> list of dates it was used
  const tagDates: Map<string, string[]> = new Map();
  for (const dp of dailyProfiles) {
    for (const { hashtag } of dp.hashtags) {
      const existing = tagDates.get(hashtag.name) ?? [];
      existing.push(dp.date);
      tagDates.set(hashtag.name, existing);
    }
  }

  // Sort tags by usage count desc, take top 20
  const sorted = Array.from(tagDates.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20);

  if (!isPremium) {
    // Free users: just tag name + count, no view correlation
    const tags = sorted.map(([name, dates]) => ({
      name,
      usageCount: dates.length,
      avgViews: null,
      totalViews: null,
    }));
    return Response.json({ tags, isPremium: false, totalDays: dailyProfiles.length });
  }

  // Premium users: join with ProfileViewStat to compute avg views on days each tag was used
  // Fetch all view stats for this user in the window
  const viewStats = await prisma.profileViewStat.findMany({
    where: { userId, date: { gte: cutoffStr } },
    select: { date: true, count: true },
  });
  const viewsByDate = new Map(viewStats.map((v) => [v.date, v.count]));

  const tags = sorted.map(([name, dates]) => {
    const totalViews = dates.reduce((sum, d) => sum + (viewsByDate.get(d) ?? 0), 0);
    const avgViews = dates.length > 0 ? Math.round((totalViews / dates.length) * 10) / 10 : 0;
    return {
      name,
      usageCount: dates.length,
      avgViews,
      totalViews,
    };
  });

  // Sort by totalViews desc for premium (most impactful tags first)
  tags.sort((a, b) => (b.totalViews ?? 0) - (a.totalViews ?? 0));

  return Response.json({ tags, isPremium: true, totalDays: dailyProfiles.length });
}
