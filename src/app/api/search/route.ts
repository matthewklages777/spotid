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
  const searLat = parseFloat(url.searchParams.get("lat") || "");
  const searLng = parseFloat(url.searchParams.get("lng") || "");
  const hasSearcherCoords = isFinite(searLat) && isFinite(searLng);

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

  // Haversine distance in miles between two lat/lng points
  function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 3958.8;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Attach distance label to each user result if both parties have coordinates
  type UserResult = (typeof users)[number];
  function withDistance<T extends UserResult>(arr: T[]) {
    return arr.map((u) => {
      const dp = u.dailyProfiles?.[0] as ({ lat?: number | null; lng?: number | null } & object) | undefined;
      if (hasSearcherCoords && dp?.lat != null && dp?.lng != null) {
        const d = distanceMiles(searLat, searLng, dp.lat, dp.lng);
        const label = d < 0.1 ? "< 0.1 mi away" : `${d.toFixed(1)} mi away`;
        return { ...u, distanceMiles: d, distanceLabel: label };
      }
      return { ...u, distanceMiles: null as number | null, distanceLabel: null as string | null };
    });
  }

  // Sort: premium first, then by distance (nearest first) when available, else leave order
  function sortResults<T extends { isPremium?: boolean; distanceMiles?: number | null }>(arr: T[]) {
    return [...arr].sort((a, b) => {
      // Premium always tops
      const premDiff = (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0);
      if (premDiff !== 0) return premDiff;
      // Both have distance — closer first
      if (a.distanceMiles != null && b.distanceMiles != null) return a.distanceMiles - b.distanceMiles;
      // One has distance — put it first
      if (a.distanceMiles != null) return -1;
      if (b.distanceMiles != null) return 1;
      return 0;
    });
  }

  const usersWithDist = withDistance(users);
  const profilesWithDist = withDistance(profiles as UserResult[]);

  return Response.json({
    users: sortResults(usersWithDist),
    profiles: sortResults(profilesWithDist),
    closet,
    work,
  });
}
