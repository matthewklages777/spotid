import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Marketplace — SpotId",
  description: "Browse items for sale and services on SpotId. Find vintage, antiques, collectibles, and professional services tagged by the community.",
  openGraph: {
    title: "Browse Marketplace — SpotId",
    description: "Browse items for sale and services tagged by the community.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Browse Marketplace — SpotId",
    description: "Browse items for sale and services tagged by the community.",
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
