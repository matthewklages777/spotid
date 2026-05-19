import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await prisma.workItem.findUnique({
    where: { id },
    include: {
      hashtags: { include: { hashtag: true } },
      user: { select: { id: true, name: true, image: true, username: true, location: true, openToContact: true } },
    },
  });
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });

  const tagIds = item.hashtags.map((h) => h.hashtagId);
  const related = tagIds.length > 0
    ? await prisma.workItem.findMany({
        where: {
          id: { not: id },
          hashtags: { some: { hashtagId: { in: tagIds } } },
        },
        include: {
          hashtags: { include: { hashtag: true } },
          user: { select: { id: true, name: true, image: true } },
        },
        take: 6,
        orderBy: { createdAt: "desc" },
      })
    : [];

  return Response.json({ item, related });
}
