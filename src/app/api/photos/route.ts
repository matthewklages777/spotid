import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const { url, caption } = await req.json();
  if (!url) return Response.json({ error: "url required" }, { status: 400 });

  const [count, user] = await Promise.all([
    prisma.profilePhoto.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { isPremium: true } }),
  ]);

  const limit = user?.isPremium ? 500 : 10;
  if (count >= limit) {
    const msg = user?.isPremium
      ? "Maximum 500 photos allowed."
      : "Free accounts are limited to 10 photos. Upgrade to Premium for unlimited photos.";
    return Response.json({ error: msg, upgradeRequired: !user?.isPremium }, { status: 400 });
  }

  const photo = await prisma.profilePhoto.create({ data: { url, caption, userId } });
  return Response.json(photo);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const photo = await prisma.profilePhoto.findFirst({ where: { id, userId } });
  if (!photo) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.profilePhoto.delete({ where: { id } });
  return Response.json({ success: true });
}
