import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = getIp(req);
  if (!rateLimit(`search:${ip}`, 30, 60_000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const type = url.searchParams.get("type") || "all";

  const tags = q
    .split(/[\s,]+/)
    .map((t) => t.toLowerCase().replace(/^#/, ""))
    .filter(Boolean);

  if (tags.length === 0) {
    return Response.json({ users: [], profiles: [], closet: [], work: [] });
  }

  const today = new Date().toISOString().split("T")[0];

  // Load block list for authenticated users so we can filter results
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

  // Build a text match condition for any of the search terms against profile fields
  const textConditions = tags.flatMap((tag) => [
    { name: { contains: tag } },
    { bio: { contains: tag } },
    { occupation: { contains: tag } },
    { location: { contains: tag } },
    { username: { contains: tag.replace(/^@/, "") } },
  ]);

  const [users, profiles, closet, work] = await Promise.all([
    // People active TODAY (daily profile match by hashtag OR by name/text)
    type === "all" || type === "people"
      ? prisma.user.findMany({
          where: {
            ...blockFilter,
            dailyProfiles: { some: { date: today } },
            OR: [
              { dailyProfiles: { some: { date: today, hashtags: { some: { hashtag: { name: { in: tags } } } } } } },
              ...textConditions,
            ],
          },
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            location: true,
            occupation: true,
            username: true,
            isPremium: true,
            dailyProfiles: {
              where: { date: today },
              include: { hashtags: { include: { hashtag: true } } },
            },
          },
          take: 30,
        })
      : Promise.resolve([]),

    // Permanent profiles — match by text fields OR all-time hashtags in work/closet
    type === "all" || type === "people"
      ? prisma.user.findMany({
          where: {
            ...blockFilter,
            OR: [
              ...textConditions,
              {
                workItems: {
                  some: {
                    hashtags: { some: { hashtag: { name: { in: tags } } } },
                  },
                },
              },
              {
                closetItems: {
                  some: {
                    sold: false,
                    hashtags: { some: { hashtag: { name: { in: tags } } } },
                  },
                },
              },
              {
                interestTags: {
                  some: { hashtag: { name: { in: tags } } },
                },
              },
            ],
            // Exclude users already in the "active today" set to avoid duplicates
            NOT: {
              AND: [
                { dailyProfiles: { some: { date: today } } },
                { OR: [
                  { dailyProfiles: { some: { date: today, hashtags: { some: { hashtag: { name: { in: tags } } } } } } },
                  ...textConditions,
                ]},
              ],
            },
          },
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            location: true,
            occupation: true,
            username: true,
            isPremium: true,
            dailyProfiles: {
              where: { date: today },
              take: 1,
              include: { hashtags: { include: { hashtag: true } } },
            },
          },
          take: 20,
        })
      : Promise.resolve([]),

    type === "all" || type === "closet"
      ? prisma.closetItem.findMany({
          where: {
            sold: false,
            ...(blockedIds.length > 0 ? { userId: { notIn: blockedIds } } : {}),
            OR: [
              { hashtags: { some: { hashtag: { name: { in: tags } } } } },
              ...tags.map((tag) => ({ title: { contains: tag } })),
              ...tags.map((tag) => ({ description: { contains: tag } })),
            ],
          },
          include: {
            hashtags: { include: { hashtag: true } },
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),

    type === "all" || type === "work"
      ? prisma.workItem.findMany({
          where: {
            ...(blockedIds.length > 0 ? { userId: { notIn: blockedIds } } : {}),
            OR: [
              { hashtags: { some: { hashtag: { name: { in: tags } } } } },
              ...tags.map((tag) => ({ title: { contains: tag } })),
              ...tags.map((tag) => ({ description: { contains: tag } })),
              ...tags.map((tag) => ({ category: { contains: tag } })),
            ],
          },
          include: {
            hashtags: { include: { hashtag: true } },
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
  ]);

  // Sort premium users to the front of each people list
  const sortPremiumFirst = <T extends { isPremium?: boolean }>(arr: T[]) =>
    [...arr].sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));

  return Response.json({
    users: sortPremiumFirst(users),
    profiles: sortPremiumFirst(profiles),
    closet,
    work,
  });
}
