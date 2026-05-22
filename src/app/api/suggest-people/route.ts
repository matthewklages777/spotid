import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);

  // Get current user's hashtags for today
  const myProfile = await prisma.dailyProfile.findUnique({
    where: { userId_date: { userId, date: today } },
    select: { hashtags: { select: { hashtagId: true } } },
  });

  if (!myProfile || myProfile.hashtags.length === 0) {
    return Response.json([]);
  }

  const myHashtagIds = myProfile.hashtags.map((h) => h.hashtagId);

  // Get blocks (both directions)
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const blockedIds = new Set(blocks.map((b) => b.blockerId === userId ? b.blockedId : b.blockerId));

  // Get already-followed users (filter them out of suggestions)
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followedId: true },
  });
  const followingIds = new Set(following.map((f) => f.followedId));

  // Find daily profiles today that share at least one hashtag with me
  const matches = await prisma.dailyProfile.findMany({
    where: {
      date: today,
      userId: { not: userId },
      hashtags: { some: { hashtagId: { in: myHashtagIds } } },
    },
    select: {
      userId: true,
      hashtags: { select: { hashtagId: true, hashtag: { select: { name: true } } } },
      user: {
        select: {
          id: true, name: true, image: true, occupation: true, location: true, username: true,
          openToContact: true, isPremium: true,
        },
      },
    },
    take: 20,
  });

  // Score by overlap count, filter blocked/saved/following, sort descending
  const scored = matches
    .filter((m) => !blockedIds.has(m.userId) && !followingIds.has(m.userId))
    .map((m) => {
      const overlap = m.hashtags.filter((h) => myHashtagIds.includes(h.hashtagId));
      const overlapNames = overlap.map((h) => h.hashtag.name);
      return { ...m.user, overlapCount: overlap.length, overlapTags: overlapNames };
    })
    .sort((a, b) => b.overlapCount - a.overlapCount)
    .slice(0, 6);

  return Response.json(scored);
}
