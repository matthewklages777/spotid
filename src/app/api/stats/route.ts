import { prisma } from "@/lib/prisma";

// Public stats endpoint — cached for 5 minutes client-side
export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  const [totalUsers, activeToday, totalItems, totalServices, totalTags] = await Promise.all([
    prisma.user.count({ where: { onboardingComplete: true } }),
    prisma.dailyProfile.count({ where: { date: today } }),
    prisma.closetItem.count({ where: { sold: false } }),
    prisma.workItem.count(),
    prisma.hashtag.count(),
  ]);

  return Response.json({ totalUsers, activeToday, totalItems, totalServices, totalTags }, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
