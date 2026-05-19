import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RESERVED = new Set([
  "admin", "api", "search", "trending", "discover", "messages", "settings",
  "onboarding", "signup", "signin", "signout", "terms", "privacy", "guidelines",
  "dmca", "daily", "closet", "work", "saved", "profile", "u", "about", "help",
  "support", "contact", "report", "block", "notifications",
]);

function isValidUsername(u: string) {
  return /^[a-z0-9_]{3,30}$/.test(u);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username")?.toLowerCase();
  if (!username) return Response.json({ error: "username required" }, { status: 400 });

  if (!isValidUsername(username)) {
    return Response.json({ available: false, reason: "Letters, numbers, and underscores only (3–30 chars)" });
  }
  if (RESERVED.has(username)) {
    return Response.json({ available: false, reason: "That username is reserved" });
  }

  const session = await getServerSession(authOptions);
  const myId = (session?.user as { id?: string })?.id;

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  // Available if not taken, or taken by the current user (no change)
  const available = !existing || existing.id === myId;
  return Response.json({ available, reason: available ? null : "Already taken" });
}
