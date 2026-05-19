import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword)
    return Response.json({ error: "Both fields are required" }, { status: 400 });
  if (newPassword.length < 8)
    return Response.json({ error: "New password must be at least 8 characters" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user?.password)
    return Response.json({ error: "Account has no password set" }, { status: 400 });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid)
    return Response.json({ error: "Current password is incorrect" }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  return Response.json({ success: true });
}
