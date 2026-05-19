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

  const items = await prisma.closetItem.findMany({
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

  const { title, description, price, image, hashtags } = await req.json();
  if (!title || typeof title !== "string" || title.length > 200) {
    return Response.json({ error: "Title required (max 200 characters)" }, { status: 400 });
  }
  if (description && (typeof description !== "string" || description.length > 2000)) {
    return Response.json({ error: "Description must be under 2000 characters" }, { status: 400 });
  }
  if (price !== undefined && price !== null && price !== "") {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0 || numPrice > 999999) {
      return Response.json({ error: "Price must be a non-negative number under 1,000,000" }, { status: 400 });
    }
  }

  const activeCount = await prisma.closetItem.count({ where: { userId, sold: false } });
  if (activeCount >= 100) {
    return Response.json({ error: "Maximum 100 active listings. Mark some as sold before adding more." }, { status: 400 });
  }

  const tags = await upsertHashtags(sanitizeTags(hashtags as string[]));

  const item = await prisma.closetItem.create({
    data: {
      title,
      description,
      price: price ? parseFloat(price) : null,
      image,
      userId,
      hashtags: { create: tags.map((t) => ({ hashtagId: t.id })) },
    },
    include: { hashtags: { include: { hashtag: true } } },
  });
  return Response.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const item = await prisma.closetItem.findFirst({ where: { id, userId } });
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.closetItem.delete({ where: { id } });
  return Response.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const { id, sold, title, description, price, image, hashtags } = await req.json();
  const item = await prisma.closetItem.findFirst({ where: { id, userId } });
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (sold !== undefined) data.sold = sold;
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (price !== undefined) data.price = price ? parseFloat(price) : null;
  if (image !== undefined) data.image = image;

  if (hashtags !== undefined) {
    const tags = await upsertHashtags(
      (hashtags as string[]).map((h) => h.toLowerCase().replace(/^#/, ""))
    );
    await prisma.closetItemHashtag.deleteMany({ where: { closetItemId: id } });
    data.hashtags = { create: tags.map((t) => ({ hashtagId: t.id })) };
  }

  const updated = await prisma.closetItem.update({
    where: { id },
    data,
    include: { hashtags: { include: { hashtag: true } } },
  });
  return Response.json(updated);
}
