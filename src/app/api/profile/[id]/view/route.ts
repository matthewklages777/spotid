import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getIp(req);

  if (!rateLimit(`view:${ip}:${id}`, 1, 10 * 60 * 1000)) {
    return Response.json({ ok: true });
  }

  const date = new Date().toISOString().slice(0, 10);

  // Increment the aggregate view counters
  await Promise.all([
    prisma.user.update({ where: { id }, data: { profileViews: { increment: 1 } } }),
    prisma.profileViewStat.upsert({
      where: { userId_date: { userId: id, date } },
      create: { userId: id, date, count: 1 },
      update: { count: { increment: 1 } },
    }),
  ]);

  // Record individual viewer identity if signed in and not viewing own profile
  const session = await getServerSession(authOptions);
  const viewerId = (session?.user as { id?: string })?.id;
  if (viewerId && viewerId !== id) {
    // Check if viewer is browsing anonymously
    const viewer = await prisma.user.findUnique({ where: { id: viewerId }, select: { browseAnonymously: true } });
    if (!viewer?.browseAnonymously) {
      // Upsert — only store one view record per viewer per day to limit storage
      const existing = await prisma.profileView.findFirst({
        where: {
          viewedId: id,
          viewerId,
          createdAt: { gte: new Date(`${date}T00:00:00.000Z`) },
        },
      });
      if (!existing) {
        await prisma.profileView.create({ data: { viewedId: id, viewerId } });
      }
    }
  }

  return Response.json({ ok: true });
}
