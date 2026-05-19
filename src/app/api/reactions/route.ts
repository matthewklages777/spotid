import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reactions?dailyProfileId=xxx  → { liked: bool, count: number }
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const myId = (session?.user as { id?: string })?.id;
  const url = new URL(req.url);
  const dailyProfileId = url.searchParams.get("dailyProfileId");
  if (!dailyProfileId) return Response.json({ error: "dailyProfileId required" }, { status: 400 });

  const count = await prisma.dailyProfileReaction.count({ where: { dailyProfileId } });
  if (!myId) return Response.json({ liked: false, count });

  const existing = await prisma.dailyProfileReaction.findUnique({
    where: { userId_dailyProfileId: { userId: myId, dailyProfileId } },
  });
  return Response.json({ liked: !!existing, count });
}

// POST /api/reactions  { dailyProfileId } → toggles like
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const myId = (session.user as { id?: string })?.id!;

  const { dailyProfileId } = await req.json();
  if (!dailyProfileId) return Response.json({ error: "dailyProfileId required" }, { status: 400 });

  const profile = await prisma.dailyProfile.findUnique({
    where: { id: dailyProfileId },
    select: { userId: true },
  });
  if (!profile) return Response.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.dailyProfileReaction.findUnique({
    where: { userId_dailyProfileId: { userId: myId, dailyProfileId } },
  });

  if (existing) {
    await prisma.dailyProfileReaction.delete({ where: { id: existing.id } });
    const count = await prisma.dailyProfileReaction.count({ where: { dailyProfileId } });
    return Response.json({ liked: false, count });
  }

  await prisma.dailyProfileReaction.create({ data: { userId: myId, dailyProfileId } });
  const count = await prisma.dailyProfileReaction.count({ where: { dailyProfileId } });

  // Notify the profile owner (deduped: only once per liker per day)
  if (profile.userId !== myId) {
    const today = new Date().toISOString().split("T")[0];
    const todayStart = new Date(`${today}T00:00:00.000Z`);
    const alreadyNotified = await prisma.notification.findFirst({
      where: {
        userId: profile.userId,
        type: "reaction",
        linkUrl: `/profile/${myId}`,
        createdAt: { gte: todayStart },
      },
    });
    if (!alreadyNotified) {
      const reactor = await prisma.user.findUnique({ where: { id: myId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          userId: profile.userId,
          type: "reaction",
          title: `${reactor?.name || "Someone"} liked your day`,
          body: "They saw your daily profile and gave it a ❤️.",
          linkUrl: `/profile/${myId}`,
        },
      });
    }
  }

  return Response.json({ liked: true, count });
}
