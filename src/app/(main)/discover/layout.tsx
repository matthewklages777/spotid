import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://spotid.app";

export const metadata: Metadata = {
  title: "Discover People — SpotId",
  description: "Discover people active on SpotId today. Browse who's sharing their day, selling items, and offering services near you.",
  alternates: { canonical: `${BASE_URL}/discover` },
  openGraph: {
    title: "Discover People — SpotId",
    description: "Discover people active on SpotId today. Browse who's sharing their day, selling items, and offering services near you.",
    url: `${BASE_URL}/discover`,
    siteName: "SpotId",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Discover People — SpotId",
    description: "Discover people active on SpotId today.",
  },
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
