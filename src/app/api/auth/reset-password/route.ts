import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, email, password } = await req.json();
  if (!token || !email || !password)
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  if (password.length < 8)
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: `reset:${email}`, token } },
  });

  if (!record) return Response.json({ error: "Invalid or expired reset link" }, { status: 400 });
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: `reset:${email}`, token } },
    });
    return Response.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: `reset:${email}`, token } },
  });

  return Response.json({ success: true });
}
