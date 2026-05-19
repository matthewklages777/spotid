import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const url = new URL(req.url);
  const list = url.searchParams.get("list");
  const name = url.searchParams.get("name");

  if (list === "1") {
    const today = new Date().toISOString().split("T")[0];
    const rows = await prisma.followedHashtag.findMany({
      where: { userId },
      select: {
        hashtag: {
          select: {
            name: true, id: true,
            _count: { select: { dailyProfiles: true } },
            dailyProfiles: {
              where: { dailyProfile: { date: today } },
              select: { dailyProfileId: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(rows.map((r) => ({
      id: r.hashtag.id,
      name: r.hashtag.name,
      totalUses: r.hashtag._count.dailyProfiles,
      activeToday: r.hashtag.dailyProfiles.length,
    })));
  }

  if (!name) return Response.json({ error: "Missing name" }, { status: 400 });

  const hashtag = await prisma.hashtag.findUnique({ where: { name }, select: { id: true } });
  if (!hashtag) return Response.json({ following: false });

  const existing = await prisma.followedHashtag.findUnique({
    where: { userId_hashtagId: { userId, hashtagId: hashtag.id } },
  });
  return Response.json({ following: !!existing });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const { name } = await req.json();
  if (!name || typeof name !== "string") return Response.json({ error: "Missing name" }, { status: 400 });

  let hashtag = await prisma.hashtag.findUnique({ where: { name }, select: { id: true } });
  if (!hashtag) {
    hashtag = await prisma.hashtag.create({ data: { name }, select: { id: true } });
  }

  const existing = await prisma.followedHashtag.findUnique({
    where: { userId_hashtagId: { userId, hashtagId: hashtag.id } },
  });

  if (existing) {
    await prisma.followedHashtag.delete({ where: { id: existing.id } });
    return Response.json({ following: false });
  } else {
    await prisma.followedHashtag.create({ data: { userId, hashtagId: hashtag.id } });
    return Response.json({ following: true });
  }
}
