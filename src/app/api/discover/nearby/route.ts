import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const myId = (session.user as { id?: string })?.id!;

  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: { location: true },
  });
  if (!me?.location || me.location.trim().length < 2) {
    return Response.json({ location: null, users: [] });
  }

  const today = new Date().toISOString().split("T")[0];
  const locationStr = me.location.trim();

  // Find first word/city token from location (e.g., "Dallas, TX" → "Dallas")
  const cityToken = locationStr.split(/[\s,]+/)[0];

  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: myId }, { blockedId: myId }] },
    select: { blockerId: true, blockedId: true },
  });
  const blockedIds = blocks.map((b) => b.blockerId === myId ? b.blockedId : b.blockerId);

  const users = await prisma.user.findMany({
    where: {
      id: { not: myId, notIn: blockedIds },
      location: { contains: cityToken },
      dailyProfiles: { some: { date: today, hashtags: { some: {} } } },
    },
    select: {
      id: true, name: true, image: true, location: true, occupation: true, username: true, isPremium: true,
      dailyProfiles: {
        where: { date: today },
        include: { hashtags: { include: { hashtag: true } } },
      },
    },
    take: 10,
    orderBy: { updatedAt: "desc" },
  });

  return Response.json({ location: locationStr, users });
}
