import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sendEmail, tagFollowEmail } from "@/lib/email";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;
  await prisma.dailyProfile.deleteMany({ where: { userId, date: todayStr() } });
  return Response.json({ success: true });
}

async function upsertHashtags(names: string[]) {
  return Promise.all(
    names.map((name) =>
      prisma.hashtag.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const url = new URL(req.url);
  const history = url.searchParams.get("history") === "1";

  if (history) {
    const profiles = await prisma.dailyProfile.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 14,
      include: { hashtags: { include: { hashtag: true } } },
    });
    return Response.json(profiles);
  }

  const date = url.searchParams.get("date") || todayStr();
  const profile = await prisma.dailyProfile.findUnique({
    where: { userId_date: { userId, date } },
    include: { hashtags: { include: { hashtag: true } } },
  });
  return Response.json(profile);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const ip = getIp(req);
  if (!rateLimit(`daily:${userId}:${ip}`, 20, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many updates. Please slow down." }, { status: 429 });
  }

  const { hashtags, note, image } = await req.json();
  if (note !== undefined && note !== null && (typeof note !== "string" || note.length > 500)) {
    return Response.json({ error: "Note must be under 500 characters" }, { status: 400 });
  }
  if (!Array.isArray(hashtags)) {
    return Response.json({ error: "hashtags must be an array" }, { status: 400 });
  }
  if (image !== undefined && image !== null && typeof image !== "string") {
    return Response.json({ error: "image must be a string URL" }, { status: 400 });
  }
  const date = todayStr();

  const rawTags = (hashtags as string[])
    .map((h) => h.toLowerCase().replace(/^#/, "").replace(/[^a-z0-9_]/g, "").slice(0, 40))
    .filter(Boolean)
    .slice(0, 30);
  const tags = await upsertHashtags(rawTags);

  const existing = await prisma.dailyProfile.findUnique({
    where: { userId_date: { userId, date } },
  });

  let profile;
  if (existing) {
    await prisma.dailyProfileHashtag.deleteMany({ where: { dailyProfileId: existing.id } });
    profile = await prisma.dailyProfile.update({
      where: { id: existing.id },
      data: {
        note,
        ...(image !== undefined ? { image: image || null } : {}),
        hashtags: { create: tags.map((t) => ({ hashtagId: t.id })) },
      },
      include: { hashtags: { include: { hashtag: true } } },
    });
  } else {
    profile = await prisma.dailyProfile.create({
      data: {
        userId,
        date,
        note,
        image: image || null,
        hashtags: { create: tags.map((t) => ({ hashtagId: t.id })) },
      },
      include: { hashtags: { include: { hashtag: true } } },
    });
  }

  // If a new photo was uploaded, also save it to the photo album (ProfilePhoto)
  if (image) {
    const alreadyInAlbum = await prisma.profilePhoto.findFirst({ where: { userId, url: image } });
    if (!alreadyInAlbum) {
      await prisma.profilePhoto.create({ data: { userId, url: image, caption: `Daily photo — ${date}` } });
    }
  }

  // Notify followers of any hashtags just tagged — one notification per follower per poster per day
  const tagIds = tags.map((t) => t.id);
  if (tagIds.length > 0) {
    const followers = await prisma.followedHashtag.findMany({
      where: { hashtagId: { in: tagIds }, userId: { not: userId } },
      select: { userId: true, hashtagId: true },
    });

    const perFollower = new Map<string, string>();
    for (const f of followers) {
      if (!perFollower.has(f.userId)) perFollower.set(f.userId, f.hashtagId);
    }

    if (perFollower.size > 0) {
      const poster = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      const posterName = poster?.name || "Someone";
      const todayStart = new Date(`${date}T00:00:00.000Z`);

      for (const [followerId, hashtagId] of perFollower) {
        const alreadyNotified = await prisma.notification.findFirst({
          where: { userId: followerId, type: "tag_follow", linkUrl: `/profile/${userId}`, createdAt: { gte: todayStart } },
        });
        if (alreadyNotified) continue;

        const matchedTag = tags.find((t) => t.id === hashtagId);
        if (!matchedTag) continue;
        await prisma.notification.create({
          data: {
            userId: followerId,
            type: "tag_follow",
            title: `${posterName} tagged #${matchedTag.name}`,
            body: `Someone you follow tagged #${matchedTag.name} today — check them out.`,
            linkUrl: `/profile/${userId}`,
          },
        });

        // Send email if follower has tag follow emails enabled
        const followerUser = await prisma.user.findUnique({
          where: { id: followerId },
          select: { email: true, emailTagFollows: true },
        });
        if (followerUser?.email && followerUser.emailTagFollows !== false) {
          const base = process.env["NEXTAUTH_URL"] || "http://localhost:3000";
          sendEmail({
            to: followerUser.email,
            ...tagFollowEmail(posterName, matchedTag.name, `${base}/profile/${userId}`, `${base}/following-tags`),
          }).catch(() => {});
        }
      }
    }
  }

  // Notify user-followers (people following this user directly)
  const userFollowers = await prisma.follow.findMany({
    where: { followedId: userId },
    select: { followerId: true },
  });
  if (userFollowers.length > 0) {
    const todayStart = new Date(`${date}T00:00:00.000Z`);
    const firstTag = tags[0]?.name || "today";

    // poster name already fetched above if tagIds.length > 0; re-fetch if needed
    let pName = "Someone";
    if (tagIds.length > 0) {
      const p = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      pName = p?.name || "Someone";
    }

    for (const { followerId } of userFollowers) {
      const alreadyNotified = await prisma.notification.findFirst({
        where: { userId: followerId, type: "user_tagged", linkUrl: `/profile/${userId}`, createdAt: { gte: todayStart } },
      });
      if (alreadyNotified) continue;
      await prisma.notification.create({
        data: {
          userId: followerId,
          type: "user_tagged",
          title: `${pName} tagged today`,
          body: `${pName} is active today with #${firstTag}${tags.length > 1 ? ` +${tags.length - 1} more` : ""}.`,
          linkUrl: `/profile/${userId}`,
        },
      });
    }
  }

  // Streak milestone notifications — only fire on a new post (not edits)
  if (!existing) {
    const STREAK_MILESTONES = [7, 14, 30, 60, 100, 365];
    const dayMs = 86_400_000;

    // Compute current streak from all daily profiles (lightweight — just dates)
    const allDates = await prisma.dailyProfile.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: "desc" },
    });

    let streak = 0;
    for (let i = 0; i < allDates.length; i++) {
      const expected = new Date(Date.now() - i * dayMs).toISOString().slice(0, 10);
      if (allDates[i].date === expected) streak++;
      else break;
    }

    if (STREAK_MILESTONES.includes(streak)) {
      const alreadyStreakNotif = await prisma.notification.findFirst({
        where: { userId, type: "streak_milestone", title: { contains: String(streak) } },
      });
      if (!alreadyStreakNotif) {
        const labels: Record<number, string> = {
          7: "One week",
          14: "Two weeks",
          30: "One month",
          60: "Two months",
          100: "100 days",
          365: "One full year",
        };
        await prisma.notification.create({
          data: {
            userId,
            type: "streak_milestone",
            title: `🔥 ${labels[streak] ?? streak + " day"} streak!`,
            body: `You've tagged ${streak} days in a row. Keep it up — consistency is how you get found.`,
            linkUrl: `/profile/${userId}`,
          },
        });
      }
    }
  }

  return Response.json(profile);
}
