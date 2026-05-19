import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 3 exports per hour per user
  if (!rateLimit(`export:${userId}`, 3, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many export requests. Please wait before downloading again." }, { status: 429 });
  }

  // Fetch all user data in parallel
  const [
    user,
    dailyProfiles,
    closetItems,
    workItems,
    messagesSent,
    messagesReceived,
    follows,
    followers,
    blockedList,
    savedProfiles,
    followedHashtags,
    interestTags,
    notifications,
    reactions,
    profilePhotos,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, username: true,
        bio: true, location: true, occupation: true, website: true,
        phone: true, instagram: true, tiktok: true, twitter: true,
        image: true, coverImage: true, openToContact: true,
        createdAt: true, onboardingComplete: true,
        emailMessages: true, emailTagFollows: true, emailDigest: true,
        emailFollowers: true,
      },
    }),
    prisma.dailyProfile.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: { hashtags: { include: { hashtag: { select: { name: true } } } } },
    }),
    prisma.closetItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { hashtags: { include: { hashtag: { select: { name: true } } } } },
    }),
    prisma.workItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { hashtags: { include: { hashtag: { select: { name: true } } } } },
    }),
    prisma.message.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, recipientId: true, subject: true, body: true, createdAt: true, read: true },
    }),
    prisma.message.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, senderId: true, subject: true, body: true, createdAt: true, read: true },
    }),
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { followed: { select: { id: true, name: true, username: true } }, createdAt: true },
    }),
    prisma.follow.findMany({
      where: { followedId: userId },
      select: { follower: { select: { id: true, name: true, username: true } }, createdAt: true },
    }),
    prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true, createdAt: true },
    }),
    prisma.savedProfile.findMany({
      where: { saverId: userId },
      select: { savedUserId: true, note: true, createdAt: true },
    }),
    prisma.followedHashtag.findMany({
      where: { userId },
      select: { hashtag: { select: { name: true } }, createdAt: true },
    }),
    prisma.interestTag.findMany({
      where: { userId },
      select: { hashtag: { select: { name: true } }, createdAt: true },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { type: true, title: true, body: true, createdAt: true, read: true },
    }),
    prisma.dailyProfileReaction.findMany({
      where: { userId },
      select: { dailyProfileId: true, createdAt: true },
    }),
    prisma.profilePhoto.findMany({
      where: { userId },
      select: { url: true, caption: true, createdAt: true },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    exportVersion: "1.0",
    note: "This file contains all personal data SpotId holds about your account.",
    profile: user,
    profilePhotos: profilePhotos.map((p) => ({
      url: p.url,
      caption: p.caption,
      uploadedAt: p.createdAt,
    })),
    dailyProfiles: dailyProfiles.map((dp) => ({
      date: dp.date,
      note: dp.note,
      hashtags: dp.hashtags.map((h) => h.hashtag.name),
    })),
    closetItems: closetItems.map((item) => ({
      title: item.title,
      description: item.description,
      price: item.price,
      sold: item.sold,
      image: item.image,
      hashtags: item.hashtags.map((h) => h.hashtag.name),
      createdAt: item.createdAt,
    })),
    workItems: workItems.map((item) => ({
      title: item.title,
      description: item.description,
      category: item.category,
      contactInfo: item.contactInfo,
      image: item.image,
      hashtags: item.hashtags.map((h) => h.hashtag.name),
      createdAt: item.createdAt,
    })),
    messages: {
      sent: messagesSent.map((m) => ({
        toUserId: m.recipientId,
        subject: m.subject,
        body: m.body,
        sentAt: m.createdAt,
        read: m.read,
      })),
      received: messagesReceived.map((m) => ({
        fromUserId: m.senderId,
        subject: m.subject,
        body: m.body,
        receivedAt: m.createdAt,
        read: m.read,
      })),
    },
    social: {
      following: follows.map((f) => ({ user: f.followed, followedAt: f.createdAt })),
      followers: followers.map((f) => ({ user: f.follower, followedAt: f.createdAt })),
      blockedUserIds: blockedList.map((b) => ({ userId: b.blockedId, blockedAt: b.createdAt })),
      savedProfileIds: savedProfiles.map((s) => ({
        userId: s.savedUserId,
        note: s.note,
        savedAt: s.createdAt,
      })),
    },
    followedHashtags: followedHashtags.map((fh) => ({
      hashtag: fh.hashtag.name,
      followedAt: fh.createdAt,
    })),
    interestTags: interestTags.map((it) => ({
      hashtag: it.hashtag.name,
      addedAt: it.createdAt,
    })),
    reactions: reactions.map((r) => ({
      dailyProfileId: r.dailyProfileId,
      reactedAt: r.createdAt,
    })),
    notifications: notifications.map((n) => ({
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      at: n.createdAt,
    })),
  };

  const json = JSON.stringify(exportData, null, 2);
  return new Response(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="spotid-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
