import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = getIp(req);
  if (!rateLimit(`browse:${ip}`, 60, 60_000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "closet"; // "closet" | "work"
  const q = url.searchParams.get("q") || "";
  const skip = parseInt(url.searchParams.get("skip") || "0", 10);
  const TAKE = 24;

  const tags = q
    .split(/[\s,]+/)
    .map((t) => t.toLowerCase().replace(/^#/, ""))
    .filter(Boolean);

  if (type === "work") {
    const where =
      tags.length > 0
        ? {
            OR: [
              { hashtags: { some: { hashtag: { name: { in: tags } } } } },
              ...tags.map((tag) => ({ title: { contains: tag } })),
              ...tags.map((tag) => ({ description: { contains: tag } })),
              ...tags.map((tag) => ({ category: { contains: tag } })),
            ],
          }
        : {};

    const items = await prisma.workItem.findMany({
      where,
      include: {
        hashtags: { include: { hashtag: true } },
        user: { select: { id: true, name: true, image: true, username: true, isPremium: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: TAKE,
    });

    return Response.json({ items, hasMore: items.length === TAKE });
  }

  // Default: closet
  const tagFilter =
    tags.length > 0
      ? {
          OR: [
            { hashtags: { some: { hashtag: { name: { in: tags } } } } },
            ...tags.map((tag) => ({ title: { contains: tag } })),
            ...tags.map((tag) => ({ description: { contains: tag } })),
          ],
        }
      : {};

  const where = { sold: false, ...tagFilter };

  const items = await prisma.closetItem.findMany({
    where,
    include: {
      hashtags: { include: { hashtag: true } },
      user: { select: { id: true, name: true, image: true, username: true, isPremium: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: TAKE,
  });

  return Response.json({ items, hasMore: items.length === TAKE });
}
