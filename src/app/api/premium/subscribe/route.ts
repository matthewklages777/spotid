import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/premium/subscribe
// Creates a Stripe Checkout session and returns the URL.
// Requires STRIPE_SECRET_KEY and STRIPE_PRICE_ID to be set.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  const userEmail = session.user?.email;
  if (!userId || !userEmail) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  const priceId = process.env["STRIPE_PRICE_ID"];
  const base = process.env["NEXTAUTH_URL"] || "https://www.spotidapp.com";

  if (!stripeKey || !priceId) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }

  // Dynamically import stripe to avoid build errors when not installed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Stripe: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Stripe = ((await import("stripe" as any)) as any).default;
  } catch {
    return Response.json({ error: "Stripe not installed" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true, isPremium: true } });
  if (user?.isPremium) return Response.json({ error: "Already premium" }, { status: 400 });

  // Create or reuse Stripe customer
  let customerId = user?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: userEmail, metadata: { spotidUserId: userId } });
    customerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/upgrade?success=1`,
    cancel_url: `${base}/upgrade?cancelled=1`,
    metadata: { spotidUserId: userId },
  });

  return Response.json({ url: checkoutSession.url });
}
