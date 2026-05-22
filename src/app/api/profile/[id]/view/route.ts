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
  const [updatedUser] = await Promise.all([
    prisma.user.update({ where: { id }, data: { profileViews: { increment: 1 } }, select: { profileViews: true } }),
    prisma.profileViewStat.upsert({
      where: { userId_date: { userId: id, date } },
      create: { userId: id, date, count: 1 },
      update: { count: { increment: 1 } },
    }),
  ]);

  // Milestone notifications at 10, 50, 100, 500, 1000, 5000, 10000 total views
  const MILESTONES = [10, 50, 100, 500, 1000, 5000, 10000];
  const newTotal = updatedUser.profileViews;
  if (MILESTONES.includes(newTotal)) {
    const alreadyMilestone = await prisma.notification.findFirst({
      where: { userId: id, type: "milestone", title: { contains: String(newTotal) } },
    });
    if (!alreadyMilestone) {
      // Check if profile owner is premium so we can tailor the message
      const profileOwnerForMilestone = await prisma.user.findUnique({ where: { id }, select: { isPremium: true } });
      const isPremiumOwner = profileOwnerForMilestone?.isPremium ?? false;
      await prisma.notification.create({
        data: {
          userId: id,
          type: "milestone",
          title: `🎉 ${newTotal.toLocaleString()} profile views!`,
          body: isPremiumOwner
            ? `Your profile has been viewed ${newTotal.toLocaleString()} times total. Check your profile to see who's been visiting.`
            : `Your profile hit ${newTotal.toLocaleString()} views. Upgrade to Premium to see exactly who's been visiting.`,
          linkUrl: isPremiumOwner ? `/profile/${id}` : "/upgrade",
        },
      });
    }
  }

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
        // Create the view record and check if profile owner is premium for notification
        const [, profileOwner] = await Promise.all([
          prisma.profileView.create({ data: { viewedId: id, viewerId } }),
          prisma.user.findUnique({ where: { id }, select: { isPremium: true } }),
        ]);

        // Premium profile owners get a "someone viewed your profile" notification
        // Cap at one such notif per viewer per day to avoid spam
        if (profileOwner?.isPremium) {
          const viewerProfileLink = `/profile/${viewerId}`;
          const alreadyNotified = await prisma.notification.findFirst({
            where: {
              userId: id,
              type: "profile_view",
              linkUrl: viewerProfileLink,
              createdAt: { gte: new Date(`${date}T00:00:00.000Z`) },
            },
          });
          if (!alreadyNotified) {
            const viewerUser = await prisma.user.findUnique({ where: { id: viewerId }, select: { name: true, username: true } });
            const displayName = viewerUser?.name || viewerUser?.username || "Someone";
            await prisma.notification.create({
              data: {
                userId: id,
                type: "profile_view",
                title: "New profile view",
                body: `${displayName} viewed your profile`,
                linkUrl: viewerProfileLink,
              },
            });
          }
        }
      }
    }
  }

  return Response.json({ ok: true });
}
