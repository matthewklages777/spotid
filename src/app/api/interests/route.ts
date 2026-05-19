import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/interests?userId=xxx — returns array of { name: string }
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  const interests = await prisma.interestTag.findMany({
    where: { userId },
    select: { hashtag: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(interests.map((i) => i.hashtag.name));
}

// PUT /api/interests — replace all interest tags with { tags: string[] }
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id!;

  const { tags } = await req.json();
  if (!Array.isArray(tags)) return Response.json({ error: "tags must be an array" }, { status: 400 });

  const cleaned = (tags as string[])
    .map((t) => t.toLowerCase().replace(/^#/, "").replace(/[^a-z0-9_]/g, "").slice(0, 40))
    .filter(Boolean)
    .slice(0, 30);

  const hashtags = await Promise.all(
    cleaned.map((name) =>
      prisma.hashtag.upsert({ where: { name }, update: {}, create: { name }, select: { id: true, name: true } })
    )
  );

  await prisma.interestTag.deleteMany({ where: { userId } });
  if (hashtags.length > 0) {
    await prisma.interestTag.createMany({
      data: hashtags.map((h) => ({ userId, hashtagId: h.id })),
    });
  }

  return Response.json({ success: true, tags: hashtags.map((h) => h.name) });
}
