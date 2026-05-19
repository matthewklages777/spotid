import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ClosetItemClient from "./ClosetItemClient";

const BASE_URL = process.env.NEXTAUTH_URL || "https://spotid.app";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  try {
    const item = await prisma.closetItem.findUnique({
      where: { id },
      select: {
        title: true, description: true, price: true, image: true,
        user: { select: { name: true } },
      },
    });
    if (!item) return { title: "Listing not found — SpotId" };

    const price = item.price != null ? ` · $${item.price.toFixed(2)}` : "";
    const title = `${item.title}${price} — SpotId`;
    const description = item.description
      ? item.description.slice(0, 150)
      : `${item.title} listed by ${item.user.name ?? "someone"} on SpotId.`;
    const url = `${BASE_URL}/closet/${id}`;

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
        images: item.image ? [{ url: item.image, alt: item.title }] : [],
      },
      twitter: {
        card: item.image ? "summary_large_image" : "summary",
        title,
        description,
        images: item.image ? [item.image] : [],
      },
    };
  } catch {
    return { title: "SpotId" };
  }
}

export default async function ClosetItemPage() {
  return <ClosetItemClient />;
}
