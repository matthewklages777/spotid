import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const blockerId = (session.user as { id?: string })?.id!;

  const { blockedId } = await req.json();
  if (!blockedId) return Response.json({ error: "blockedId required" }, { status: 400 });
  if (blockerId === blockedId) return Response.json({ error: "Cannot block yourself" }, { status: 400 });

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    update: {},
    create: { blockerId, blockedId },
  });
  return Response.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const blockerId = (session.user as { id?: string })?.id!;

  const url = new URL(req.url);
  const blockedId = url.searchParams.get("blockedId");
  if (!blockedId) return Response.json({ error: "blockedId required" }, { status: 400 });

  await prisma.block.deleteMany({ where: { blockerId, blockedId } });
  return Response.json({ success: true });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const blockerId = (session.user as { id?: string })?.id!;

  const url = new URL(req.url);

  // ?list=1 — return all users blocked by the current user
  if (url.searchParams.get("list") === "1") {
    const blocks = await prisma.block.findMany({
      where: { blockerId },
      select: { blockedId: true },
    });
    const ids = blocks.map((b) => b.blockedId);
    if (ids.length === 0) return Response.json([]);
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, username: true, image: true },
    });
    return Response.json(users);
  }

  const blockedId = url.searchParams.get("blockedId");
  if (!blockedId) return Response.json({ error: "blockedId required" }, { status: 400 });

  const block = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  return Response.json({ blocked: !!block });
}
