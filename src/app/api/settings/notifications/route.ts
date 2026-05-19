import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailMessages: true, emailTagFollows: true, emailDigest: true, emailFollowers: true },
  });
  return Response.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const { emailMessages, emailTagFollows, emailDigest, emailFollowers } = await req.json();
  const data: Record<string, boolean> = {};
  if (typeof emailMessages === "boolean") data.emailMessages = emailMessages;
  if (typeof emailTagFollows === "boolean") data.emailTagFollows = emailTagFollows;
  if (typeof emailDigest === "boolean") data.emailDigest = emailDigest;
  if (typeof emailFollowers === "boolean") data.emailFollowers = emailFollowers;

  await prisma.user.update({ where: { id: userId }, data });
  return Response.json({ success: true });
}
