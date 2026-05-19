import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const reporterId = (session.user as { id?: string })?.id!;

  if (!rateLimit(`report:${reporterId}`, 5, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many reports. Please try again later." }, { status: 429 });
  }

  const { reportedId, reason, details } = await req.json();
  if (!reportedId || !reason) {
    return Response.json({ error: "reportedId and reason required" }, { status: 400 });
  }
  if (typeof reason !== "string" || reason.length > 200) {
    return Response.json({ error: "Reason must be under 200 characters" }, { status: 400 });
  }
  if (details !== undefined && (typeof details !== "string" || details.length > 2000)) {
    return Response.json({ error: "Details must be under 2000 characters" }, { status: 400 });
  }
  if (reporterId === reportedId) {
    return Response.json({ error: "Cannot report yourself" }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: { reporterId, reportedId, reason, details },
  });
  return Response.json({ success: true, id: report.id });
}
