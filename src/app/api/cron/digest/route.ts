import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, weeklyDigestEmail } from "@/lib/email";

// Called weekly by a cron job. Protect with CRON_SECRET env var.
export async function GET(req: NextRequest) {
  const secret = process.env["CRON_SECRET"];
  const auth = req.headers.get("authorization") || req.nextUrl.searchParams.get("secret");
  if (secret && auth !== secret && auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = process.env["NEXTAUTH_URL"] || "https://spotid.app";
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  // Get all users who follow at least one person and have email enabled
  const usersWithFollows = await prisma.follow.findMany({
    select: { followerId: true },
    distinct: ["followerId"],
  });
  const followerIds = usersWithFollows.map((f) => f.followerId);

  const users = await prisma.user.findMany({
    where: { id: { in: followerIds }, email: { not: "" } },
    select: { id: true, name: true, email: true, emailDigest: true },
  });

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    if (user.emailDigest === false) { skipped++; continue; }

    const follows = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followedId: true },
    });
    const followedIds = follows.map((f) => f.followedId);
    if (followedIds.length === 0) { skipped++; continue; }

    const recentProfiles = await prisma.dailyProfile.findMany({
      where: {
        userId: { in: followedIds },
        date: { gte: sevenDaysAgoStr },
        hashtags: { some: {} },
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
        hashtags: { include: { hashtag: true }, take: 5 },
      },
      orderBy: { date: "desc" },
      distinct: ["userId"],
      take: 20,
    });

    if (recentProfiles.length === 0) { skipped++; continue; }

    const items = recentProfiles.map((p) => ({
      personName: p.user.name || "Anonymous",
      profileUrl: p.user.username ? `${base}/u/${p.user.username}` : `${base}/profile/${p.user.id}`,
      tags: p.hashtags.map((h) => h.hashtag.name),
    }));

    await sendEmail({
      to: user.email,
      ...weeklyDigestEmail(user.name || "there", items, `${base}/discover`, `${base}/settings`),
    });
    sent++;
  }

  return Response.json({ sent, skipped, total: users.length });
}
