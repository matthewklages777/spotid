import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import TagClient from "./TagClient";

const BASE_URL = process.env.NEXTAUTH_URL || "https://spotid.app";

export async function generateMetadata(
  { params }: { params: Promise<{ name: string }> }
): Promise<Metadata> {
  const { name } = await params;
  const tag = decodeURIComponent(name).toLowerCase().replace(/^#/, "");

  try {
    const count = await prisma.hashtag.findUnique({
      where: { name: tag },
      select: { _count: { select: { dailyProfiles: true } } },
    });
    const uses = count?._count?.dailyProfiles ?? 0;
    const title = `#${tag} — SpotId`;
    const description = uses > 0
      ? `${uses} people tagged #${tag} on SpotId. Discover who's active, what they're selling, and what services they offer.`
      : `Explore #${tag} on SpotId — discover people, marketplace items, and services tagged with this hashtag.`;
    const url = `${BASE_URL}/tag/${tag}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        siteName: "SpotId",
        type: "website",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
    return { title: `#${tag} — SpotId` };
  }
}

export default function TagPage() {
  return <TagClient />;
}
