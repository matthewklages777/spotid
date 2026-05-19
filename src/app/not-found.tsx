import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
      <div className="text-center space-y-5 max-w-md">
        <p className="text-8xl">🔍</p>
        <h1 className="text-4xl font-black text-gray-900">404</h1>
        <h2 className="text-xl font-bold text-gray-700">Page not found</h2>
        <p className="text-gray-500">
          This page doesn&apos;t exist or has been removed.
          Maybe try searching for what you&apos;re looking for?
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/search"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition">
            Search SpotId
          </Link>
          <Link href="/"
            className="bg-white text-gray-700 border border-gray-200 px-6 py-2.5 rounded-xl font-semibold hover:border-indigo-400 transition">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
