import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/isAdmin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Attach reporter and reported names
  type ReportRow = { id: string; reporterId: string; reportedId: string; reason: string; details: string | null; createdAt: Date };
  type UserRow = { id: string; name: string | null; email: string };
  const userIds = [...new Set([...reports.map((r: ReportRow) => r.reporterId), ...reports.map((r: ReportRow) => r.reportedId)])];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(users.map((u: UserRow) => [u.id, u]));

  const enriched = reports.map((r: ReportRow) => ({
    ...r,
    reporter: userMap[r.reporterId],
    reported: userMap[r.reportedId],
  }));

  return Response.json(enriched);
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { reportId } = await req.json();
  if (!reportId) return Response.json({ error: "reportId required" }, { status: 400 });

  await prisma.report.delete({ where: { id: reportId } });
  return Response.json({ success: true });
}
