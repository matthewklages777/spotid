import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/isAdmin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, createdAt: true,
      onboardingComplete: true, banned: true,
      _count: {
        select: { closetItems: true, workItems: true, dailyProfiles: true, profilePhotos: true },
      },
    },
  });

  // Count reports against each user
  const reports = await prisma.report.groupBy({
    by: ["reportedId"],
    _count: { id: true },
  });
  const reportCounts = Object.fromEntries(reports.map((r) => [r.reportedId, r._count.id]));

  const enriched = users.map((u) => ({ ...u, reportCount: reportCounts[u.id] || 0 }));
  return Response.json(enriched);
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { userId, banned } = await req.json();
  if (!userId || typeof banned !== "boolean") {
    return Response.json({ error: "userId and banned required" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { banned } });
  return Response.json({ success: true, banned });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  await prisma.block.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } });
  await prisma.report.deleteMany({ where: { OR: [{ reporterId: userId }, { reportedId: userId }] } });
  await prisma.tosAcceptance.deleteMany({ where: { userId } });
  await prisma.savedProfile.deleteMany({ where: { OR: [{ saverId: userId }, { savedUserId: userId }] } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { recipientId: userId }] } });
  await prisma.user.delete({ where: { id: userId } });

  return Response.json({ success: true });
}
