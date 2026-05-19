import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import WorkItemClient from "./WorkItemClient";

const BASE_URL = process.env.NEXTAUTH_URL || "https://spotid.app";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  try {
    const item = await prisma.workItem.findUnique({
      where: { id },
      select: {
        title: true, description: true, category: true, image: true,
        user: { select: { name: true } },
      },
    });
    if (!item) return { title: "Listing not found — SpotId" };

    const cat = item.category ? ` · ${item.category}` : "";
    const title = `${item.title}${cat} — SpotId`;
    const description = item.description
      ? item.description.slice(0, 150)
      : `${item.title} offered by ${item.user.name ?? "someone"} on SpotId.`;
    const url = `${BASE_URL}/work/${id}`;

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

export default async function WorkItemPage() {
  return <WorkItemClient />;
}
