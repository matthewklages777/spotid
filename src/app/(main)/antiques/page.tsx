import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/Brand";

export const metadata: Metadata = {
  title: "Find Antiques & Vintage Items by Hashtag — SpotId",
  description:
    "Search rare antiques and vintage collectibles by hashtag on SpotId. List your items once, get found forever. No algorithm, no fees — just tags that connect buyers and sellers.",
  keywords: ["antiques", "vintage", "collectibles", "hashtag search", "find antiques online", "buy vintage items", "sell antiques"],
  openGraph: {
    title: "Find Antiques & Vintage Items by Hashtag — SpotId",
    description: "Search rare antiques and vintage collectibles by hashtag. List once, get found forever.",
    type: "website",
    siteName: "SpotId",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "SpotId — Find Antiques & Vintage by Hashtag" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Antiques & Vintage Items by Hashtag — SpotId",
    description: "Search rare antiques and vintage collectibles by hashtag on SpotId.",
    images: ["/api/og"],
  },
  alternates: { canonical: "https://www.spotidapp.com/antiques" },
};

const EXAMPLE_SEARCHES = [
  { tags: ["antique", "bluelamp", "Gruene", "Texas", "19thCentury"], label: "Blue antique lamp from Gruene, TX" },
  { tags: ["vintage", "Eames", "midCentury", "chair", "original"], label: "Mid-century Eames chair" },
  { tags: ["victorian", "silver", "candlestick", "hallmarked"], label: "Victorian silver candlesticks" },
  { tags: ["artDeco", "bronze", "figurine", "1920s", "French"], label: "Art Deco bronze figurine" },
  { tags: ["vintage", "Levi501", "originalButton", "1970s"], label: "Original 1970s Levi's 501s" },
  { tags: ["depression", "pinkGlass", "forSale", "setOf4"], label: "Depression-era pink glass set" },
];

const HOW_IT_WORKS = [
  {
    icon: "🏷️",
    title: "Sellers tag everything",
    desc: "Every item in a Closet listing is tagged with descriptive hashtags: era, color, material, maker, origin, style, condition. Anything a buyer might search.",
  },
  {
    icon: "🔍",
    title: "Buyers search hashtags",
    desc: "No scrolling through infinite listings. Search the exact tags that describe what you're looking for and get only the results that match.",
  },
  {
    icon: "🤝",
    title: "Connect directly",
    desc: "When your search finds the item, you message the seller directly. No middlemen, no platform cut, no auction fees.",
  },
  {
    icon: "♾️",
    title: "Listings never expire",
    desc: "Your Closet items stay searchable until you sell them. Tag once, get found anytime someone searches those exact words.",
  },
];

export default function AntiquesPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-14">

      {/* Hero */}
      <div className="text-center space-y-5">
        <div className="inline-block bg-amber-100 text-amber-800 text-sm font-semibold px-4 py-1.5 rounded-full">
          For Antique Collectors & Vintage Sellers
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
          Find the exact antique<br />
          <span className="text-amber-600">you&apos;ve been hunting for.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          SpotId is a hashtag-powered directory where antique dealers, estate sale hunters,
          and vintage collectors tag everything they have — and buyers search directly for what they need.
          No algorithm. No fees. Just hashtags.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/search?q=%23antique"
            className="bg-amber-500 text-white px-8 py-3 rounded-full font-bold text-base hover:bg-amber-600 transition shadow-sm"
          >
            Search #antique Now →
          </Link>
          <Link
            href="/signup"
            className="bg-white text-gray-700 border-2 border-gray-200 px-8 py-3 rounded-full font-bold text-base hover:border-amber-400 transition"
          >
            List My Items Free
          </Link>
        </div>
      </div>

      {/* The antique lamp story */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8 space-y-5">
        <div className="flex items-start gap-4">
          <span className="text-5xl flex-shrink-0">🏺</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">The blue lamp story</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              In 1994, you saw a beautiful 19th century blue lamp with a white shade while sightseeing
              in Gruene, Texas. You didn&apos;t buy it. You&apos;ve been looking for it ever since.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Today, you search SpotId with every detail you remember:
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["antique", "bluelamp", "whitelampshade", "Gruene", "TX", "19thCentury", "vintage"].map((tag) => (
                <Link key={tag} href={`/search?q=%23${tag}`}
                  className="bg-amber-600 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-amber-700 transition">
                  #{tag}
                </Link>
              ))}
            </div>
            <p className="text-gray-700 leading-relaxed">
              Somewhere out there, someone has that lamp — or one just like it. They tagged it on SpotId.
              You find each other through hashtags, not through luck.{" "}
              <strong className="text-gray-900">That&apos;s exactly what <Brand /> is for.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Example searches */}
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Try these searches right now</h2>
          <p className="text-gray-500 text-sm">Click any tag combination below to search SpotId today.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {EXAMPLE_SEARCHES.map((example) => (
            <Link
              key={example.label}
              href={`/search?q=${example.tags.map((t) => `%23${t}`).join("+")}`}
              className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-amber-300 hover:shadow-md transition group"
            >
              <p className="text-xs text-gray-400 mb-2 font-medium">{example.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {example.tags.map((tag) => (
                  <span key={tag} className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium group-hover:bg-amber-100 transition">
                    #{tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">How it works for antiques</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <p className="text-3xl mb-3">{item.icon}</p>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* For sellers */}
      <div className="bg-gray-900 rounded-2xl p-8 text-white space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏪</span>
          <h2 className="text-2xl font-bold">Selling antiques or vintage?</h2>
        </div>
        <p className="text-gray-300 leading-relaxed">
          List your pieces with detailed hashtags — era, material, origin, color, style, condition — and
          they stay searchable until you sell. Buyers who search those exact terms find you directly.
          No listing fees. No final value fees. No platform cuts.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: "✓", text: "Free to list" },
            { icon: "✓", text: "No selling fees" },
            { icon: "✓", text: "Listings never expire" },
            { icon: "✓", text: "Tag as many hashtags as you want" },
            { icon: "✓", text: "Buyers contact you directly" },
            { icon: "✓", text: "Works alongside eBay, Etsy, etc." },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-sm">
              <span className="text-green-400 font-bold flex-shrink-0">{item.icon}</span>
              <span className="text-gray-200">{item.text}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/signup"
            className="bg-amber-500 text-white font-bold px-8 py-3 rounded-full hover:bg-amber-400 transition text-sm"
          >
            List My Antiques Free →
          </Link>
          <Link
            href="/browse"
            className="bg-white/10 text-white font-semibold px-8 py-3 rounded-full hover:bg-white/20 transition text-sm"
          >
            Browse Current Listings
          </Link>
        </div>
      </div>

      {/* Tag tips */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-5">
        <h2 className="text-2xl font-bold text-gray-900">📝 Tag tips for antique sellers</h2>
        <p className="text-gray-600 text-sm">
          The key to being found is tagging the way buyers search. Here&apos;s what works:
        </p>
        <div className="space-y-4">
          {[
            {
              category: "Era & Period",
              tags: ["victorian", "edwardian", "artDeco", "artNouveau", "midCentury", "1920s", "1950s", "19thCentury"],
            },
            {
              category: "Material",
              tags: ["silverPlate", "sterling", "brass", "bronze", "mahogany", "oak", "wicker", "porcelain", "stoneware"],
            },
            {
              category: "Type of Item",
              tags: ["candlestick", "sideboard", "wingback", "dresser", "secretaire", "escritoire", "console", "chiffonier"],
            },
            {
              category: "Origin",
              tags: ["French", "English", "American", "German", "Japanese", "Chinese", "Scandinavian"],
            },
            {
              category: "Condition & Status",
              tags: ["excellent", "restored", "original", "patina", "signed", "hallmarked", "forSale", "priceDrop"],
            },
          ].map((group) => (
            <div key={group.category}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group.category}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.tags.map((tag) => (
                  <Link key={tag} href={`/tag/${tag}`}
                    className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full hover:bg-amber-100 transition font-medium">
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center space-y-5 py-4">
        <h2 className="text-3xl font-black text-gray-900">Ready to find what you&apos;ve been hunting for?</h2>
        <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
          Search any hashtag combination. If no one has it today, list your want as a Daily Profile tag
          and let sellers find you when they have it.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/search?q=%23antique+%23vintage"
            className="bg-amber-500 text-white px-8 py-3.5 rounded-full font-bold text-base hover:bg-amber-600 transition shadow-sm"
          >
            Search Antiques & Vintage →
          </Link>
          <Link
            href="/signup"
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-full font-bold text-base hover:bg-indigo-700 transition"
          >
            Join <Brand /> Free
          </Link>
        </div>
        <div className="flex gap-4 justify-center text-sm text-gray-400 pt-2 flex-wrap">
          <Link href="/browse" className="hover:text-gray-600 transition">Browse Listings</Link>
          <span>·</span>
          <Link href="/about" className="hover:text-gray-600 transition">About SpotId</Link>
          <span>·</span>
          <Link href="/help" className="hover:text-gray-600 transition">Help & FAQ</Link>
        </div>
      </div>

    </div>
  );
}
