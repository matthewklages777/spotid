import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const myId = (session.user as { id?: string })?.id!;

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "followers"; // "followers" | "following"
  const today = new Date().toISOString().split("T")[0];

  if (type === "following") {
    const rows = await prisma.follow.findMany({
      where: { followerId: myId },
      include: {
        followed: {
          select: {
            id: true, name: true, image: true, bio: true, occupation: true, username: true, isPremium: true,
            dailyProfiles: { where: { date: today }, take: 1, select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(rows.map((r) => ({
      ...r.followed,
      activeToday: r.followed.dailyProfiles.length > 0,
      since: r.createdAt,
    })));
  }

  const rows = await prisma.follow.findMany({
    where: { followedId: myId },
    include: {
      follower: {
        select: {
          id: true, name: true, image: true, bio: true, occupation: true, username: true,
          dailyProfiles: { where: { date: today }, take: 1, select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(rows.map((r) => ({
    ...r.follower,
    activeToday: r.follower.dailyProfiles.length > 0,
    since: r.createdAt,
  })));
}
