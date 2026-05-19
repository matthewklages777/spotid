import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sendEmail, passwordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 3, 60 * 60 * 1000)) {
    return Response.json({ success: true }); // silent — prevent enumeration
  }
  const { email } = await req.json();
  if (!email) return Response.json({ error: "Email is required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  if (!user) return Response.json({ success: true }); // silent — prevent enumeration

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.verificationToken.deleteMany({ where: { identifier: `reset:${email}` } });
  await prisma.verificationToken.create({
    data: { identifier: `reset:${email}`, token, expires },
  });

  const base = process.env["NEXTAUTH_URL"] || "http://localhost:3000";
  const resetUrl = `${base}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  await sendEmail({ to: email, ...passwordResetEmail(resetUrl, user.name || undefined) });

  return Response.json({ success: true });
}
