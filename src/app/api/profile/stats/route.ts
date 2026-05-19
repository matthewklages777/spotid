import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returns last 14 days of view stats for the authenticated user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await prisma.profileViewStat.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    take: 14,
    select: { date: true, count: true },
  });

  return Response.json(stats);
}
