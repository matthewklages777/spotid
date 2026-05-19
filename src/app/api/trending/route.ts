import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const [todayTags, closetTags, workTags] = await Promise.all([
    // Tags used in today's daily profiles
    prisma.dailyProfileHashtag.groupBy({
      by: ["hashtagId"],
      where: { dailyProfile: { date: today } },
      _count: { hashtagId: true },
      orderBy: { _count: { hashtagId: "desc" } },
      take: 30,
    }),

    // Top closet hashtags (all time, active items)
    prisma.closetItemHashtag.groupBy({
      by: ["hashtagId"],
      where: { closetItem: { sold: false } },
      _count: { hashtagId: true },
      orderBy: { _count: { hashtagId: "desc" } },
      take: 20,
    }),

    // Top work hashtags (all time)
    prisma.workItemHashtag.groupBy({
      by: ["hashtagId"],
      where: {},
      _count: { hashtagId: true },
      orderBy: { _count: { hashtagId: "desc" } },
      take: 20,
    }),
  ]);

  // Fetch tag names
  const allTagIds = [
    ...new Set([
      ...todayTags.map((t) => t.hashtagId),
      ...closetTags.map((t) => t.hashtagId),
      ...workTags.map((t) => t.hashtagId),
    ]),
  ];
  const tags = await prisma.hashtag.findMany({
    where: { id: { in: allTagIds } },
    select: { id: true, name: true },
  });
  const tagMap = Object.fromEntries(tags.map((t) => [t.id, t.name]));

  return Response.json({
    today: todayTags.map((t) => ({ name: tagMap[t.hashtagId], count: t._count.hashtagId })).filter((t) => t.name),
    closet: closetTags.map((t) => ({ name: tagMap[t.hashtagId], count: t._count.hashtagId })).filter((t) => t.name),
    work: workTags.map((t) => ({ name: tagMap[t.hashtagId], count: t._count.hashtagId })).filter((t) => t.name),
  });
}
