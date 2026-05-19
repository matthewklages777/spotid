import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getIp(req);

  if (!rateLimit(`view:${ip}:${id}`, 1, 10 * 60 * 1000)) {
    return Response.json({ ok: true });
  }

  const date = new Date().toISOString().slice(0, 10);
  await Promise.all([
    prisma.user.update({ where: { id }, data: { profileViews: { increment: 1 } } }),
    prisma.profileViewStat.upsert({
      where: { userId_date: { userId: id, date } },
      create: { userId: id, date, count: 1 },
      update: { count: { increment: 1 } },
    }),
  ]);

  return Response.json({ ok: true });
}
