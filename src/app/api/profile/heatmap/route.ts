import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  // Last 52 weeks + partial current week = up to 371 days
  const since = new Date();
  since.setDate(since.getDate() - 364);
  const sinceStr = since.toISOString().split("T")[0];

  const profiles = await prisma.dailyProfile.findMany({
    where: { userId, date: { gte: sinceStr }, hashtags: { some: {} } },
    select: { date: true, _count: { select: { hashtags: true } } },
    orderBy: { date: "asc" },
  });

  const days = profiles.map((p) => ({ date: p.date, count: p._count.hashtags }));
  return Response.json({ days });
}
