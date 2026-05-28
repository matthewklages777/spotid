import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpotId — Tag yourself. Get spotted.",
  description: "Tag yourself with hashtags and let the world find you. Search people by location, items for sale by tag, and services by skill — all in real time.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpotId",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "SpotId — Tag yourself. Get spotted.",
    description: "Tag yourself with hashtags and let the world find you. Search people, rare items, and services in real time.",
    type: "website",
    siteName: "SpotId",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "SpotId — Tag yourself. Get spotted." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SpotId — Tag yourself. Get spotted.",
    description: "Tag yourself with hashtags and let the world find you.",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#4f46e5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', function() { navigator.serviceWorker.register('/sw.js').catch(function(){}); }); }`,
          }}
        />
      </head>
      <body className="min-h-full bg-gray-50 font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
