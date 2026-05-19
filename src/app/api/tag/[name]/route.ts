import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const tagName = decodeURIComponent(name).toLowerCase().replace(/^#/, "");

  const hashtag = await prisma.hashtag.findUnique({
    where: { name: tagName },
    select: { id: true, name: true, _count: { select: { dailyProfiles: true } } },
  });
  if (!hashtag) return Response.json({ error: "Tag not found" }, { status: 404 });

  // Usage by day over last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const recentProfiles = await prisma.dailyProfileHashtag.findMany({
    where: {
      hashtagId: hashtag.id,
      dailyProfile: { date: { gte: thirtyDaysAgo } },
    },
    include: { dailyProfile: { select: { date: true } } },
  });

  // Group by date
  const byDate = new Map<string, number>();
  for (const p of recentProfiles) {
    const d = p.dailyProfile.date;
    byDate.set(d, (byDate.get(d) ?? 0) + 1);
  }
  const dailyActivity = Array.from(byDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Follower count
  const followerCount = await prisma.followedHashtag.count({ where: { hashtagId: hashtag.id } });

  // Related tags: other hashtags that co-occur in the same daily profiles over last 30 days
  const profileIds = recentProfiles.map((p) => p.dailyProfileId);
  const relatedRaw = profileIds.length > 0
    ? await prisma.dailyProfileHashtag.findMany({
        where: {
          dailyProfileId: { in: profileIds },
          hashtagId: { not: hashtag.id },
        },
        include: { hashtag: { select: { name: true } } },
      })
    : [];

  const relatedCounts = new Map<string, number>();
  for (const r of relatedRaw) {
    relatedCounts.set(r.hashtag.name, (relatedCounts.get(r.hashtag.name) ?? 0) + 1);
  }
  const relatedTags = Array.from(relatedCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));

  return Response.json({
    name: tagName,
    totalUses: hashtag._count.dailyProfiles,
    followerCount,
    dailyActivity,
    relatedTags,
  });
}
