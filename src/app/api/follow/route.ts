import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, newFollowerEmail } from "@/lib/email";

// GET /api/follow?followedId=xxx — returns { following: bool, followerCount: number }
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const myId = (session?.user as { id?: string })?.id;
  const url = new URL(req.url);
  const followedId = url.searchParams.get("followedId");
  if (!followedId) return Response.json({ error: "followedId required" }, { status: 400 });

  const followerCount = await prisma.follow.count({ where: { followedId } });
  if (!myId) return Response.json({ following: false, followerCount });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followedId: { followerId: myId, followedId } },
  });
  return Response.json({ following: !!existing, followerCount });
}

// POST /api/follow — toggle follow for { followedId }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const myId = (session.user as { id?: string })?.id!;

  const { followedId } = await req.json();
  if (!followedId || typeof followedId !== "string") return Response.json({ error: "followedId required" }, { status: 400 });
  if (followedId === myId) return Response.json({ error: "Cannot follow yourself" }, { status: 400 });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followedId: { followerId: myId, followedId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    const followerCount = await prisma.follow.count({ where: { followedId } });
    return Response.json({ following: false, followerCount });
  } else {
    await prisma.follow.create({ data: { followerId: myId, followedId } });
    const followerCount = await prisma.follow.count({ where: { followedId } });

    // Create follow notification for the followed user
    const [follower, followed] = await Promise.all([
      prisma.user.findUnique({ where: { id: myId }, select: { name: true, username: true } }),
      prisma.user.findUnique({ where: { id: followedId }, select: { email: true, emailFollowers: true, name: true } }),
    ]);
    await prisma.notification.create({
      data: {
        userId: followedId,
        type: "follow",
        title: `${follower?.name || "Someone"} followed you`,
        body: "They'll be notified when you tag your day.",
        linkUrl: `/profile/${myId}`,
      },
    });

    // Send email notification (non-blocking)
    if (followed?.email && followed.emailFollowers) {
      const base = process.env.NEXTAUTH_URL || "https://spotid.app";
      const profileUrl = follower?.username
        ? `${base}/u/${follower.username}`
        : `${base}/profile/${myId}`;
      const template = newFollowerEmail(follower?.name || "Someone", profileUrl, `${base}/settings`);
      sendEmail({ to: followed.email, ...template }).catch(() => {});
    }

    return Response.json({ following: true, followerCount });
  }
}
