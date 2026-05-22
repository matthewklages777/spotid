import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const saverId = (session.user as { id?: string })?.id;
  if (!saverId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const saved = await prisma.savedProfile.findMany({
    where: { saverId },
    orderBy: { createdAt: "desc" },
  });

  const userIds = saved.map((s) => s.savedUserId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true, name: true, image: true, bio: true, location: true, occupation: true, username: true, isPremium: true,
      dailyProfiles: {
        where: { date: new Date().toISOString().split("T")[0] },
        take: 1,
        select: { id: true },
      },
    },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return Response.json(saved.map((s) => ({
    ...s,
    savedUser: userMap[s.savedUserId] || null,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const saverId = (session.user as { id?: string })?.id;
  if (!saverId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { savedUserId, note } = await req.json();
  if (!savedUserId) return Response.json({ error: "savedUserId required" }, { status: 400 });
  if (savedUserId === saverId) return Response.json({ error: "Cannot save yourself" }, { status: 400 });

  const isNew = !(await prisma.savedProfile.findUnique({
    where: { saverId_savedUserId: { saverId, savedUserId } },
  }));

  const record = await prisma.savedProfile.upsert({
    where: { saverId_savedUserId: { saverId, savedUserId } },
    update: { note: note ?? undefined },
    create: { saverId, savedUserId, note },
  });

  // Notify the saved user (only on first save, not updates)
  if (isNew) {
    const saver = await prisma.user.findUnique({ where: { id: saverId }, select: { name: true, id: true } });
    await prisma.notification.create({
      data: {
        userId: savedUserId,
        type: "save",
        title: `${saver?.name || "Someone"} saved your profile`,
        body: "They may reach out soon.",
        linkUrl: `/profile/${saverId}`,
      },
    }).catch(() => {});
  }

  return Response.json(record);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const saverId = (session.user as { id?: string })?.id;
  if (!saverId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const savedUserId = url.searchParams.get("savedUserId");
  if (!savedUserId) return Response.json({ error: "savedUserId required" }, { status: 400 });

  await prisma.savedProfile.deleteMany({ where: { saverId, savedUserId } });
  return Response.json({ success: true });
}
