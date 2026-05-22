import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// POST /api/premium/cancel
// Cancels the user's subscription at period end (they keep premium until billing cycle ends).
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  if (!stripeKey) return Response.json({ error: "Stripe not configured" }, { status: 503 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, stripeSubId: true },
  });

  if (!user?.isPremium) return Response.json({ error: "Not a premium member" }, { status: 400 });
  if (!user.stripeSubId) return Response.json({ error: "No active subscription found" }, { status: 400 });

  const stripe = new Stripe(stripeKey);
  await stripe.subscriptions.update(user.stripeSubId, { cancel_at_period_end: true });

  return Response.json({ success: true, message: "Your subscription will cancel at the end of the current billing period. You keep premium access until then." });
}

// DELETE /api/premium/cancel — immediate cancellation
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  if (!stripeKey) return Response.json({ error: "Stripe not configured" }, { status: 503 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, stripeSubId: true },
  });

  if (!user?.stripeSubId) return Response.json({ error: "No active subscription found" }, { status: 400 });

  const stripe = new Stripe(stripeKey);
  await stripe.subscriptions.cancel(user.stripeSubId);
  await prisma.user.update({ where: { id: userId }, data: { isPremium: false, stripeSubId: null } });

  return Response.json({ success: true });
}
