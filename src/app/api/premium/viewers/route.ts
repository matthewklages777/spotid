import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returns recent profile viewers. Full list for premium users; teaser (count only) for free.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true },
  });

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days

  const totalCount = await prisma.profileView.count({
    where: { viewedId: userId, createdAt: { gte: since } },
  });

  if (!user?.isPremium) {
    // Free users: just the count + a teaser of 2 blurred avatars
    const teaserViews = await prisma.profileView.findMany({
      where: { viewedId: userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 2,
      select: { createdAt: true },
    });
    return Response.json({ isPremium: false, count: totalCount, teaser: teaserViews });
  }

  // Premium users: full viewer details, deduplicated to most recent visit per viewer
  const views = await prisma.profileView.findMany({
    where: { viewedId: userId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      createdAt: true,
      viewer: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
          occupation: true,
        },
      },
    },
  });

  // Deduplicate: keep only most recent visit per viewer
  const seen = new Set<string>();
  const unique = views.filter((v) => {
    if (seen.has(v.viewer.id)) return false;
    seen.add(v.viewer.id);
    return true;
  });

  return Response.json({ isPremium: true, count: totalCount, viewers: unique.slice(0, 50) });
}
