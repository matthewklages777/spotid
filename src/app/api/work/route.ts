import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function sanitizeTags(raw: string[]): string[] {
  return [...new Set(
    raw.map((h) => h.toLowerCase().replace(/^#/, "").replace(/[^a-z0-9_]/g, "").slice(0, 40)).filter(Boolean)
  )].slice(0, 30);
}

async function upsertHashtags(names: string[]) {
  return Promise.all(
    names.map((name) =>
      prisma.hashtag.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const items = await prisma.workItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { hashtags: { include: { hashtag: true } } },
  });
  return Response.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const { title, description, category, contactInfo, image, hashtags } = await req.json();
  if (!title || typeof title !== "string" || title.length > 200) {
    return Response.json({ error: "Title required (max 200 characters)" }, { status: 400 });
  }
  if (description && (typeof description !== "string" || description.length > 2000)) {
    return Response.json({ error: "Description must be under 2000 characters" }, { status: 400 });
  }

  const workCount = await prisma.workItem.count({ where: { userId } });
  if (workCount >= 50) {
    return Response.json({ error: "Maximum 50 work listings. Remove some before adding more." }, { status: 400 });
  }

  const tags = await upsertHashtags(sanitizeTags(hashtags as string[]));

  const item = await prisma.workItem.create({
    data: {
      title,
      description,
      category,
      contactInfo,
      image,
      userId,
      hashtags: { create: tags.map((t) => ({ hashtagId: t.id })) },
    },
    include: { hashtags: { include: { hashtag: true } } },
  });
  return Response.json(item);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const { id, title, description, category, contactInfo, image, hashtags } = await req.json();
  const item = await prisma.workItem.findFirst({ where: { id, userId } });
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (category !== undefined) data.category = category;
  if (contactInfo !== undefined) data.contactInfo = contactInfo;
  if (image !== undefined) data.image = image;

  if (hashtags !== undefined) {
    const tags = await upsertHashtags(
      (hashtags as string[]).map((h) => h.toLowerCase().replace(/^#/, ""))
    );
    await prisma.workItemHashtag.deleteMany({ where: { workItemId: id } });
    data.hashtags = { create: tags.map((t) => ({ hashtagId: t.id })) };
  }

  const updated = await prisma.workItem.update({
    where: { id },
    data,
    include: { hashtags: { include: { hashtag: true } } },
  });
  return Response.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const item = await prisma.workItem.findFirst({ where: { id, userId } });
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.workItem.delete({ where: { id } });
  return Response.json({ success: true });
}
