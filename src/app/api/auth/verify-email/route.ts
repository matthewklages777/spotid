import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    return Response.json({ error: "Invalid verification link" }, { status: 400 });
  }

  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email, token },
  });

  if (!record) {
    return Response.json({ error: "Invalid or already used verification link" }, { status: 400 });
  }
  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    return Response.json({ error: "Verification link has expired. Please request a new one." }, { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  return Response.json({ success: true });
}

export async function POST(req: NextRequest) {
  // Resend verification email
  const { email } = await req.json();
  if (!email) return Response.json({ error: "email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, select: { name: true, emailVerified: true } });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });
  if (user.emailVerified) return Response.json({ error: "Already verified" }, { status: 400 });

  // Delete old tokens
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const crypto = await import("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  const base = process.env["NEXTAUTH_URL"] || "http://localhost:3000";
  const verifyUrl = `${base}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  const { sendEmail, verificationEmail } = await import("@/lib/email");
  await sendEmail({ to: email, ...verificationEmail(user.name ?? "there", verifyUrl) }).catch(() => {});

  return Response.json({ success: true });
}
