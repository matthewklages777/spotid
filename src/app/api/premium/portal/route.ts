import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// POST /api/premium/portal
// Creates a Stripe Customer Portal session and returns the URL.
// Allows premium users to manage their billing, update payment method, etc.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  if (!stripeKey) return Response.json({ error: "Stripe not configured" }, { status: 503 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, isPremium: true },
  });

  if (!user?.stripeCustomerId) {
    return Response.json({ error: "No billing account found" }, { status: 400 });
  }

  const base = process.env["NEXTAUTH_URL"] || "https://www.spotidapp.com";
  const stripe = new Stripe(stripeKey);

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${base}/settings`,
  });

  return Response.json({ url: portalSession.url });
}
