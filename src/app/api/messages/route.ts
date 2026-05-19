import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, newMessageEmail } from "@/lib/email";
import { rateLimit, getIp } from "@/lib/rateLimit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [received, sent] = await Promise.all([
    prisma.message.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const userIds = [...new Set([
    ...received.map((m) => m.senderId),
    ...sent.map((m) => m.recipientId),
  ])];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return Response.json({
    received: received.map((m) => ({ ...m, sender: userMap[m.senderId] })),
    sent: sent.map((m) => ({ ...m, recipient: userMap[m.recipientId] })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const senderId = (session.user as { id?: string })?.id;
  if (!senderId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getIp(req);
  if (!rateLimit(`msg:${senderId}:${ip}`, 10, 60 * 1000)) {
    return Response.json({ error: "Too many messages. Please slow down." }, { status: 429 });
  }

  const { recipientId, subject, body } = await req.json();
  if (!recipientId || !body?.trim())
    return Response.json({ error: "recipientId and body are required" }, { status: 400 });
  if (typeof body !== "string" || body.length > 5000)
    return Response.json({ error: "Message must be under 5000 characters" }, { status: 400 });
  if (recipientId === senderId)
    return Response.json({ error: "Cannot message yourself" }, { status: 400 });

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, name: true, openToContact: true },
  });
  if (!recipient) return Response.json({ error: "Recipient not found" }, { status: 404 });
  if (!recipient.openToContact) return Response.json({ error: "This user is not accepting messages" }, { status: 403 });

  // Check if sender has blocked or is blocked by recipient
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: recipientId, blockedId: senderId },
        { blockerId: senderId, blockedId: recipientId },
      ],
    },
  });
  if (block) return Response.json({ error: "You cannot message this user" }, { status: 403 });

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { name: true },
  });

  const message = await prisma.message.create({
    data: { senderId, recipientId, subject, body },
  });

  // Create in-app notification
  await prisma.notification.create({
    data: {
      userId: recipientId,
      type: "message",
      title: `New message from ${sender?.name || "someone"}`,
      body: body.length > 80 ? body.slice(0, 80) + "…" : body,
      linkUrl: "/messages",
    },
  });

  // Send email notification (non-blocking, respects user preferences)
  const recipientUser = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { email: true, emailMessages: true },
  });
  if (recipientUser?.email && recipientUser.emailMessages !== false) {
    const base = process.env["NEXTAUTH_URL"] || "http://localhost:3000";
    const preview = body.length > 120 ? body.slice(0, 120) + "…" : body;
    sendEmail({
      to: recipientUser.email,
      ...newMessageEmail(sender?.name || "Someone", preview, `${base}/messages`),
    }).catch(() => {});
  }

  return Response.json(message);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.message.updateMany({ where: { id, recipientId: userId }, data: { read: true } });
  return Response.json({ success: true });
}
