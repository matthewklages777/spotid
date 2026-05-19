import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://spotid.app";

export const metadata: Metadata = {
  title: "Trending Tags — SpotId",
  description: "See what hashtags people are using right now on SpotId — trending tags in daily life, the marketplace, and services.",
  alternates: { canonical: `${BASE_URL}/trending` },
  openGraph: {
    title: "Trending Tags — SpotId",
    description: "See what hashtags people are using right now on SpotId.",
    url: `${BASE_URL}/trending`,
    siteName: "SpotId",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Trending Tags — SpotId",
    description: "See what hashtags people are using right now on SpotId.",
  },
};

export default function TrendingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
