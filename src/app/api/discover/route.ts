import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const today = new Date().toISOString().split("T")[0];
  const url = new URL(req.url);
  const location = url.searchParams.get("location") || "";
  const followingOnly = url.searchParams.get("following") === "1";
  const skip = parseInt(url.searchParams.get("skip") || "0", 10);

  const session = await getServerSession(authOptions);
  const myId = (session?.user as { id?: string })?.id;
  let blockedIds: string[] = [];
  if (myId) {
    const blocks = await prisma.block.findMany({
      where: { OR: [{ blockerId: myId }, { blockedId: myId }] },
      select: { blockerId: true, blockedId: true },
    });
    blockedIds = blocks.map((b) => b.blockerId === myId ? b.blockedId : b.blockerId);
  }
  const blockFilter = blockedIds.length > 0 ? { id: { notIn: blockedIds } } : {};
  const locationFilter = location ? { location: { contains: location } } : {};

  // For "following" tab: filter to only users the current user follows
  let followingFilter: { id?: { in: string[] } } = {};
  if (followingOnly && myId) {
    const follows = await prisma.follow.findMany({
      where: { followerId: myId },
      select: { followedId: true },
    });
    followingFilter = { id: { in: follows.map((f) => f.followedId) } };
  }

  const [activeUsers, recentCloset, recentWork] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...blockFilter,
        ...locationFilter,
        ...followingFilter,
        dailyProfiles: {
          some: {
            date: today,
            hashtags: { some: {} },
          },
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        location: true,
        occupation: true,
        username: true,
        isPremium: true,
        dailyProfiles: {
          where: { date: today },
          include: { hashtags: { include: { hashtag: true } } },
        },
      },
      orderBy: [{ isPremium: "desc" }, { updatedAt: "desc" }],
      skip,
      take: 20,
    }),

    prisma.closetItem.findMany({
      where: {
        sold: false,
        createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        ...(blockedIds.length > 0 ? { userId: { notIn: blockedIds } } : {}),
      },
      include: {
        hashtags: { include: { hashtag: true } },
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),

    prisma.workItem.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        ...(blockedIds.length > 0 ? { userId: { notIn: blockedIds } } : {}),
      },
      include: {
        hashtags: { include: { hashtag: true } },
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return Response.json({ activeUsers, recentCloset, recentWork, hasMore: activeUsers.length === 20 });
}
