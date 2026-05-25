import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/og?userId=xxx
// Generates a branded OG image card for a user profile.
// Shows: name, occupation, location, today's top hashtags, SpotId branding.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  // Default fallback card
  if (!userId) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: "white",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: -2 }}>SpotId</div>
          <div style={{ fontSize: 28, marginTop: 12, opacity: 0.8 }}>Tag yourself. Get spotted.</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    const [user, dailyProfile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, image: true, occupation: true, location: true, bio: true, isPremium: true },
      }),
      prisma.dailyProfile.findFirst({
        where: { userId, date: today },
        include: { hashtags: { include: { hashtag: true }, take: 6 } },
      }),
    ]);

    if (!user) {
      return new Response("Not found", { status: 404 });
    }

    const name = user.name || "Anonymous";
    const tags = dailyProfile?.hashtags?.map((h) => h.hashtag.name) ?? [];
    const meta = [user.occupation, user.location].filter(Boolean).join(" · ");

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: "#f8f7ff",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          {/* Left accent bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 12,
              background: "linear-gradient(180deg, #4f46e5, #7c3aed)",
            }}
          />

          {/* Main content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "60px 72px 60px 84px",
              flex: 1,
            }}
          >
            {/* Top: SpotId branding */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  color: "white",
                  fontSize: 20,
                  fontWeight: 900,
                  padding: "6px 16px",
                  borderRadius: 20,
                  letterSpacing: -0.5,
                }}
              >
                SpotId
              </div>
              {user.isPremium && (
                <div style={{ fontSize: 16, color: "#4f46e5", fontWeight: 700 }}>✅ Verified</div>
              )}
            </div>

            {/* Middle: User info */}
            <div style={{ display: "flex", alignItems: "center", gap: 36, flex: 1, paddingTop: 40 }}>
              {/* Avatar */}
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  width={140}
                  height={140}
                  style={{ borderRadius: "50%", objectFit: "cover", border: "4px solid #4f46e5", flexShrink: 0 }}
                  alt={name}
                />
              ) : (
                <div
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 56,
                    color: "white",
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {name[0].toUpperCase()}
                </div>
              )}

              {/* Name and meta */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: "#111827", lineHeight: 1.1 }}>
                  {name}
                </div>
                {meta && (
                  <div style={{ fontSize: 22, color: "#6b7280", fontWeight: 500 }}>
                    {meta}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Tags + tagline */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      style={{
                        background: "#eef2ff",
                        color: "#4338ca",
                        padding: "8px 20px",
                        borderRadius: 100,
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      #{tag}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 18, color: "#9ca3af" }}>
                Tag yourself. Get spotted. · spotidapp.com
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (err) {
    console.error("OG image error:", err);
    return new Response("Error generating image", { status: 500 });
  }
}
