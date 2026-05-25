import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// HMAC secret for unsubscribe tokens — uses NEXTAUTH_SECRET as the signing key
function makeToken(email: string): string {
  const secret = process.env["NEXTAUTH_SECRET"] || "spotid-unsubscribe-key";
  return crypto.createHmac("sha256", secret).update(email.toLowerCase()).digest("hex").slice(0, 32);
}

function verifyToken(email: string, token: string): boolean {
  return makeToken(email) === token;
}

export function buildUnsubscribeUrl(email: string, base: string): string {
  const token = makeToken(email);
  return `${base}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

// GET /api/unsubscribe?email=...&token=...&type=digest|all
// One-click unsubscribe handler (links in emails)
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const token = req.nextUrl.searchParams.get("token");
  const type = req.nextUrl.searchParams.get("type") || "digest";

  if (!email || !token || !verifyToken(email, token)) {
    return new Response("Invalid unsubscribe link.", { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    // Still return success to not expose user existence
    return Response.redirect(`${req.nextUrl.origin}/unsubscribe?done=1`);
  }

  const update: Record<string, boolean> = {};
  if (type === "all") {
    update.emailDigest = false;
    update.emailMessages = false;
    update.emailFollowers = false;
    update.emailTagFollows = false;
  } else if (type === "digest") {
    update.emailDigest = false;
  } else if (type === "messages") {
    update.emailMessages = false;
  } else if (type === "followers") {
    update.emailFollowers = false;
  }

  if (Object.keys(update).length > 0) {
    await prisma.user.update({ where: { id: user.id }, data: update });
  }

  return Response.redirect(`${req.nextUrl.origin}/unsubscribe?done=1&type=${type}`);
}
