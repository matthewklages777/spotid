import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from "../../profile/[id]/ProfileClient";
import Script from "next/script";

const BASE_URL = process.env.NEXTAUTH_URL || "https://spotid.app";

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true, name: true, bio: true, image: true, occupation: true, location: true, instagram: true, twitter: true },
    });
    if (!user) return { title: "Profile not found — SpotId" };

    const name = user.name || "Anonymous";
    const title = `${name} on SpotId`;
    const parts = [user.occupation, user.location].filter(Boolean);
    const description = parts.length > 0
      ? `${parts.join(" · ")}${user.bio ? ` — ${user.bio.slice(0, 100)}` : ""}`
      : (user.bio?.slice(0, 150) || "Find and discover people on SpotId by hashtag.");
    const profileUrl = `${BASE_URL}/u/${username.toLowerCase()}`;

    return {
      title,
      description,
      alternates: { canonical: profileUrl },
      openGraph: {
        title, description, url: profileUrl, siteName: "SpotId", type: "profile",
        images: [{ url: `${BASE_URL}/api/og?userId=${user.id}`, width: 1200, height: 630, alt: name }],
      },
      twitter: {
        card: "summary_large_image",
        title, description,
        images: [`${BASE_URL}/api/og?userId=${user.id}`],
      },
    };
  } catch {
    return { title: "SpotId" };
  }
}

export default async function UsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true, name: true, bio: true, image: true, occupation: true, location: true,
      instagram: true, twitter: true, website: true, username: true,
    },
  });

  if (!user) notFound();

  const profileUrl = `${BASE_URL}/u/${username.toLowerCase()}`;
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
    <>
      <Script
        id={`profile-jsonld-${user.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProfileClient forcedId={user.id} />
    </>
  );
}
