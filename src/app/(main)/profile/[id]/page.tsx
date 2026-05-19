import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";
import Script from "next/script";

const BASE_URL = process.env.NEXTAUTH_URL || "https://spotid.app";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { name: true, bio: true, image: true, occupation: true, location: true, username: true, instagram: true, twitter: true },
    });

    if (!user) return { title: "Profile not found — SpotId" };

    const name = user.name || "Anonymous";
    const title = `${name} on SpotId`;
    const parts = [user.occupation, user.location].filter(Boolean);
    const description = parts.length > 0
      ? `${parts.join(" · ")}${user.bio ? ` — ${user.bio.slice(0, 100)}` : ""}`
      : (user.bio?.slice(0, 150) || "Find and discover people on SpotId by hashtag.");

    const profileUrl = user.username
      ? `${BASE_URL}/u/${user.username}`
      : `${BASE_URL}/profile/${id}`;

    return {
      title,
      description,
      alternates: { canonical: profileUrl },
      openGraph: {
        title,
        description,
        url: profileUrl,
        siteName: "SpotId",
        type: "profile",
        images: user.image ? [{ url: user.image, width: 400, height: 400, alt: name }] : [],
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: user.image ? [user.image] : [],
      },
    };
  } catch {
    return { title: "SpotId" };
  }
}

async function ProfileJsonLd({ id }: { id: string }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        name: true, bio: true, image: true, occupation: true, location: true,
        username: true, instagram: true, twitter: true, website: true,
      },
    });
    if (!user) return null;

    const profileUrl = user.username ? `${BASE_URL}/u/${user.username}` : `${BASE_URL}/profile/${id}`;

    const sameAs: string[] = [];
    if (user.instagram) sameAs.push(`https://instagram.com/${user.instagram}`);
    if (user.twitter) sameAs.push(`https://x.com/${user.twitter}`);
    if (user.website) sameAs.push(user.website);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: user.name || "Anonymous",
      description: user.bio || undefined,
      image: user.image || undefined,
      jobTitle: user.occupation || undefined,
      ...(user.location ? { address: { "@type": "PostalAddress", addressLocality: user.location } } : {}),
      url: profileUrl,
      ...(sameAs.length > 0 ? { sameAs } : {}),
    };

    return (
      <Script
        id={`profile-jsonld-${id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    );
  } catch {
    return null;
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <ProfileJsonLd id={id} />
      <ProfileClient />
    </>
  );
}
