import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateCode(userId: string): string {
  // 6-char alphanumeric code derived from userId + timestamp for uniqueness
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seed = userId.slice(-4) + Date.now().toString(36);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[seed.charCodeAt(i % seed.length) % chars.length];
  }
  return code;
}

// GET /api/referral — Returns the current user's referral code (generates one if needed)
// Also returns count of successful referrals
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, referralCount: true, isPremium: true },
  });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  // Generate and save a referral code if one doesn't exist yet
  if (!user.referralCode) {
    let code = generateCode(userId);
    // Ensure uniqueness — retry up to 5 times with timestamp variation
    for (let i = 0; i < 5; i++) {
      const existing = await prisma.user.findUnique({ where: { referralCode: code } });
      if (!existing) break;
      code = generateCode(userId + i);
    }
    user = await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
      select: { referralCode: true, referralCount: true, isPremium: true },
    });
  }

  const base = process.env["NEXTAUTH_URL"] || "https://www.spotidapp.com";
  const referralUrl = `${base}/signup?ref=${user.referralCode}`;

  return Response.json({
    code: user.referralCode,
    url: referralUrl,
    count: user.referralCount,
    isPremium: user.isPremium,
  });
}

// POST /api/referral — Validate a referral code at signup
// Body: { code: string, newUserId: string }
// Called internally after a new user signs up with ?ref=CODE
export async function POST(req: NextRequest) {
  const { code, newUserId } = await req.json().catch(() => ({}));
  if (!code || !newUserId) return Response.json({ error: "Missing fields" }, { status: 400 });

  // Find the referrer
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code.toUpperCase() },
    select: { id: true, referralCount: true },
  });
  if (!referrer) return Response.json({ error: "Invalid code" }, { status: 404 });

  // Prevent self-referral
  if (referrer.id === newUserId) return Response.json({ error: "Cannot refer yourself" }, { status: 400 });

  // Check if this new user was already attributed
  const newUser = await prisma.user.findUnique({
    where: { id: newUserId },
    select: { referredBy: true },
  });
  if (!newUser) return Response.json({ error: "User not found" }, { status: 404 });
  if (newUser.referredBy) return Response.json({ ok: true, alreadyAttributed: true });

  // Attribute the referral
  await prisma.$transaction([
    prisma.user.update({
      where: { id: newUserId },
      data: { referredBy: referrer.id },
    }),
    prisma.user.update({
      where: { id: referrer.id },
      data: { referralCount: { increment: 1 } },
    }),
  ]);

  return Response.json({ ok: true, referrerId: referrer.id });
}
