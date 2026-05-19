import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://spotid.app";

export const metadata: Metadata = {
  title: "Search — SpotId",
  description: "Search people, hashtags, items for sale, and services on SpotId.",
  alternates: { canonical: `${BASE_URL}/search` },
  openGraph: {
    title: "Search — SpotId",
    description: "Search people, hashtags, items for sale, and services on SpotId.",
    url: `${BASE_URL}/search`,
    siteName: "SpotId",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Search — SpotId",
    description: "Search people, hashtags, items for sale, and services on SpotId.",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
