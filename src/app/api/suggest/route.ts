import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = getIp(req);
  if (!rateLimit(`suggest:${ip}`, 60, 60_000)) {
    return Response.json([], { status: 429 });
  }

  const url = new URL(req.url);
  const raw = (url.searchParams.get("q") || "").toLowerCase().replace(/^#/, "").trim();

  if (!raw || raw.length < 2) return Response.json([]);

  // Get last token — support multi-tag queries (space/comma separated)
  const token = raw.split(/[\s,]+/).pop() || "";
  if (token.length < 2) return Response.json([]);

  const tags = await prisma.hashtag.findMany({
    where: { name: { startsWith: token } },
    select: {
      name: true,
      _count: {
        select: { dailyProfiles: true, closetItems: true, workItems: true },
      },
    },
    take: 30, // fetch more, then sort and slice below
  });

  // Sort by total usage descending, return top 8
  const sorted = tags
    .map((t) => ({
      name: t.name,
      count: t._count.dailyProfiles + t._count.closetItems + t._count.workItems,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return Response.json(sorted);
}
