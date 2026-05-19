import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const myId = (session.user as { id?: string })?.id!;

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor"); // createdAt ISO for pagination

  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: myId }, { blockedId: myId }] },
    select: { blockerId: true, blockedId: true },
  });
  const blockedIds = blocks.map((b) => b.blockerId === myId ? b.blockedId : b.blockerId);

  const [follows, followedHashtags] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: myId }, select: { followedId: true } }),
    prisma.followedHashtag.findMany({ where: { userId: myId }, select: { hashtagId: true } }),
  ]);

  const followedUserIds = follows.map((f) => f.followedId).filter((id) => !blockedIds.includes(id));
  const followedTagIds = followedHashtags.map((f) => f.hashtagId);

  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const cursorDate = cursor ? new Date(cursor) : undefined;

  // Fetch daily profiles from followed users (last 7 days)
  const dailyProfilesFromFollowed = followedUserIds.length > 0
    ? await prisma.dailyProfile.findMany({
        where: {
          userId: { in: followedUserIds },
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
          hashtags: { some: {} },
          ...(cursorDate ? { updatedAt: { lt: cursorDate } } : {}),
        },
        include: {
          hashtags: { include: { hashtag: true } },
          user: { select: { id: true, name: true, image: true, username: true, occupation: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      })
    : [];

  // Fetch daily profiles from followed hashtags (deduplicate with above)
  const followedUserIdsSet = new Set(followedUserIds);
  const dailyProfilesFromTags = followedTagIds.length > 0
    ? await prisma.dailyProfile.findMany({
        where: {
          userId: { notIn: [...blockedIds, myId, ...followedUserIds] },
          date: today,
          hashtags: { some: { hashtagId: { in: followedTagIds } } },
          ...(cursorDate ? { updatedAt: { lt: cursorDate } } : {}),
        },
        include: {
          hashtags: { include: { hashtag: true } },
          user: { select: { id: true, name: true, image: true, username: true, occupation: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      })
    : [];

  // Recent closet/work items from followed users
  const closetItems = followedUserIds.length > 0
    ? await prisma.closetItem.findMany({
        where: {
          userId: { in: followedUserIds },
          sold: false,
          createdAt: { gte: sevenDaysAgo },
        },
        include: {
          hashtags: { include: { hashtag: true } },
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  const workItems = followedUserIds.length > 0
    ? await prisma.workItem.findMany({
        where: {
          userId: { in: followedUserIds },
          createdAt: { gte: sevenDaysAgo },
        },
        include: {
          hashtags: { include: { hashtag: true } },
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  return Response.json({
    dailyFromFollowed: dailyProfilesFromFollowed,
    dailyFromTags: dailyProfilesFromTags,
    closetItems,
    workItems,
    isEmpty: !followedUserIds.length && !followedTagIds.length,
  });
}
