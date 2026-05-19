import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Called once daily (e.g. at 4 PM local time via cron).
// Creates in-app notifications for users who had a streak going but haven't tagged today yet.
// Protect with CRON_SECRET env var.
export async function GET(req: NextRequest) {
  const secret = process.env["CRON_SECRET"];
  const auth = req.headers.get("authorization") || req.nextUrl.searchParams.get("secret");
  if (secret && auth !== secret && auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const dayMs = 86_400_000;
  const yesterday = new Date(Date.now() - dayMs).toISOString().slice(0, 10);

  // Find all users who tagged yesterday but NOT today
  const taggedYesterday = await prisma.dailyProfile.findMany({
    where: { date: yesterday },
    select: { userId: true },
  });
  const taggedYesterdayIds = taggedYesterday.map((d) => d.userId);

  if (taggedYesterdayIds.length === 0) {
    return Response.json({ notified: 0, reason: "No users tagged yesterday" });
  }

  const taggedToday = await prisma.dailyProfile.findMany({
    where: { date: today, userId: { in: taggedYesterdayIds } },
    select: { userId: true },
  });
  const taggedTodayIds = new Set(taggedToday.map((d) => d.userId));

  // Users with an active streak who haven't tagged today
  const atRiskIds = taggedYesterdayIds.filter((id) => !taggedTodayIds.has(id));

  if (atRiskIds.length === 0) {
    return Response.json({ notified: 0, reason: "All streak users have already tagged today" });
  }

  // Compute streak length for each at-risk user to personalize message
  const allDates = await prisma.dailyProfile.findMany({
    where: { userId: { in: atRiskIds } },
    select: { userId: true, date: true },
    orderBy: { date: "desc" },
  });

  // Group dates by user
  const datesByUser = new Map<string, string[]>();
  for (const row of allDates) {
    const existing = datesByUser.get(row.userId) ?? [];
    existing.push(row.date);
    datesByUser.set(row.userId, existing);
  }

  // Check if a notification was already sent today (idempotency)
  const existingNotifs = await prisma.notification.findMany({
    where: {
      userId: { in: atRiskIds },
      type: "streak_reminder",
      createdAt: { gte: new Date(today + "T00:00:00.000Z") },
    },
    select: { userId: true },
  });
  const alreadyNotifiedIds = new Set(existingNotifs.map((n) => n.userId));

  // Build notifications
  const toNotify = atRiskIds.filter((id) => !alreadyNotifiedIds.has(id));

  if (toNotify.length === 0) {
    return Response.json({ notified: 0, reason: "All eligible users already notified today" });
  }

  const notifications = toNotify.map((userId) => {
    const dates = datesByUser.get(userId) ?? [];
    // Count streak ending yesterday
    let streak = 0;
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(Date.now() - (i + 1) * dayMs).toISOString().slice(0, 10);
      if (dates[i] === expected) streak++;
      else break;
    }
    const streakText = streak > 1 ? ` Your ${streak}-day streak is at risk!` : " Don't break your streak!";
    return {
      userId,
      type: "streak_reminder",
      title: "🔥 Tag today to keep your streak",
      body: `You haven't tagged yet today.${streakText} Head to your Daily Profile to check in.`,
      linkUrl: "/daily",
      read: false,
    };
  });

  // Batch insert notifications
  await prisma.notification.createMany({ data: notifications });

  return Response.json({ notified: notifications.length, skipped: alreadyNotifiedIds.size });
}
