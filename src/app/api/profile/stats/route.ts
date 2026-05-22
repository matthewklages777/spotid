import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returns view stats for the authenticated user.
// Premium: last 90 days. Free: last 14 days.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPremium: true } });
  const days = user?.isPremium ? 90 : 14;

  const stats = await prisma.profileViewStat.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    take: days,
    select: { date: true, count: true },
  });

  return Response.json({ stats, isPremium: user?.isPremium ?? false, days });
}
