import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sendEmail, welcomeEmail, verificationEmail } from "@/lib/email";
import crypto from "crypto";

function isAtLeast18(dob: string): boolean {
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return false;
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  return age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 5, 15 * 60 * 1000)) {
    return Response.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }
  const { name, email, password, dob, referralCode } = await req.json();

  if (!name || !email || !password || !dob) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }
  if (typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
    return Response.json({ error: "Name must be between 2 and 100 characters" }, { status: 400 });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== "string" || email.length > 254 || !emailRegex.test(email)) {
    return Response.json({ error: "Please enter a valid email address" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (password.length > 128) {
    return Response.json({ error: "Password is too long" }, { status: 400 });
  }
  if (!isAtLeast18(dob)) {
    return Response.json({ error: "You must be 18 or older to use SpotId" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "An account with this email already exists" }, { status: 400 });
  }
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, dob },
  });

  await prisma.tosAcceptance.create({
    data: { userId: user.id, version: "1.0" },
  });

  const base = process.env["NEXTAUTH_URL"] || "http://localhost:3000";

  // Create verification token (expires 24h)
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  }).catch(() => {}); // non-fatal if fails

  // Send verification email (non-blocking)
  const verifyUrl = `${base}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  sendEmail({
    to: email,
    ...verificationEmail(name, verifyUrl),
  }).catch(() => {});

  // Also send welcome email (non-blocking)
  sendEmail({
    to: email,
    ...welcomeEmail(name, `${base}/profile/${user.id}`),
  }).catch(() => {});

  // Attribute referral if a valid code was provided
  if (referralCode && typeof referralCode === "string") {
    const code = referralCode.toUpperCase().trim();
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    }).catch(() => null);
    if (referrer && referrer.id !== user.id) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { referredBy: referrer.id } }),
        prisma.user.update({ where: { id: referrer.id }, data: { referralCount: { increment: 1 } } }),
      ]).catch(() => {}); // non-fatal
    }
  }

  return Response.json({ id: user.id, email: user.email, name: user.name });
}
