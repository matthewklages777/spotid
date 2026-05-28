import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env["NEXTAUTH_URL"] || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "always", priority: 0.9 },
    { url: `${BASE_URL}/discover`, lastModified: new Date(), changeFrequency: "always", priority: 0.8 },
    { url: `${BASE_URL}/browse`, lastModified: new Date(), changeFrequency: "always", priority: 0.8 },
    { url: `${BASE_URL}/browse?type=work`, lastModified: new Date(), changeFrequency: "always", priority: 0.7 },
    { url: `${BASE_URL}/trending`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.7 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/signin`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/guidelines`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/dmca`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE_URL}/antiques`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  try {
    const [users, hashtags, closetItems, workItems] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, username: true, updatedAt: true },
        take: 5000,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.hashtag.findMany({
        select: { name: true },
        take: 2000,
        orderBy: { id: "desc" },
      }),
      prisma.closetItem.findMany({
        where: { sold: false },
        select: { id: true, updatedAt: true },
        take: 5000,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.workItem.findMany({
        select: { id: true, updatedAt: true },
        take: 5000,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const profilePages: MetadataRoute.Sitemap = users.map((u) => ({
      url: u.username ? `${BASE_URL}/u/${u.username}` : `${BASE_URL}/profile/${u.id}`,
      lastModified: u.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const tagPages: MetadataRoute.Sitemap = hashtags.map((h) => ({
      url: `${BASE_URL}/tag/${h.name}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.5,
    }));

    const closetPages: MetadataRoute.Sitemap = closetItems.map((item) => ({
      url: `${BASE_URL}/closet/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    const workPages: MetadataRoute.Sitemap = workItems.map((item) => ({
      url: `${BASE_URL}/work/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    return [...staticPages, ...profilePages, ...tagPages, ...closetPages, ...workPages];
  } catch {
    return staticPages;
  }
}
