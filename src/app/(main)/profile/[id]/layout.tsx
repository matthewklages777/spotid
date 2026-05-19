import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, bio: true, image: true, username: true, occupation: true },
  });

  if (!user) {
    return { title: "Profile not found · SpotId" };
  }

  const displayName = user.name || "Anonymous";
  const title = `${displayName} · SpotId`;
  const description = user.bio || (user.occupation ? `${displayName} · ${user.occupation}` : `Check out ${displayName}'s profile on SpotId`);
  const url = user.username
    ? `${process.env.NEXTAUTH_URL}/u/${user.username}`
    : `${process.env.NEXTAUTH_URL}/profile/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      images: user.image ? [{ url: user.image, width: 400, height: 400, alt: displayName }] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: user.image ? [user.image] : [],
    },
  };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
