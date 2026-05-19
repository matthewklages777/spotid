import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await req.json();
  if (!password) return Response.json({ error: "Password is required to delete account" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user?.password) return Response.json({ error: "Account not found" }, { status: 404 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return Response.json({ error: "Incorrect password" }, { status: 400 });

  // Delete records without cascade
  await prisma.block.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } });
  await prisma.report.deleteMany({ where: { OR: [{ reporterId: userId }, { reportedId: userId }] } });
  await prisma.tosAcceptance.deleteMany({ where: { userId } });
  await prisma.savedProfile.deleteMany({ where: { OR: [{ saverId: userId }, { savedUserId: userId }] } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { recipientId: userId }] } });

  // User delete cascades: Account, Session, ProfilePhoto, DailyProfile, ClosetItem, WorkItem
  await prisma.user.delete({ where: { id: userId } });

  return Response.json({ success: true });
}
