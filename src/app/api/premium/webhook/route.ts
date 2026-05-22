import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// POST /api/premium/webhook
// Stripe webhook — activates/deactivates premium based on subscription events.
// Add this URL in Stripe dashboard → Developers → Webhooks.
// Set STRIPE_WEBHOOK_SECRET in Railway env vars.
export async function POST(req: NextRequest) {
  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!stripeKey || !webhookSecret) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Resolve the SpotId userId from event metadata or customer ID
  async function resolveUserId(obj: { metadata?: Stripe.Metadata | null; customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null }): Promise<string | null> {
    if (obj.metadata?.spotidUserId) return obj.metadata.spotidUserId;
    const customerId = typeof obj.customer === "string" ? obj.customer : obj.customer?.id;
    if (!customerId) return null;
    const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
    return user?.id ?? null;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const uid = await resolveUserId(s);
      if (uid) {
        await prisma.user.update({
          where: { id: uid },
          data: { isPremium: true, premiumSince: new Date(), stripeSubId: typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null },
        });
      }
      break;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.paused": {
      const sub = event.data.object as Stripe.Subscription;
      const uid = await resolveUserId(sub);
      if (uid) await prisma.user.update({ where: { id: uid }, data: { isPremium: false } });
      break;
    }
    case "customer.subscription.resumed":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const uid = await resolveUserId(sub);
      if (uid) {
        const active = ["active", "trialing"].includes(sub.status);
        await prisma.user.update({ where: { id: uid }, data: { isPremium: active } });
      }
      break;
    }
  }

  return Response.json({ received: true });
}
