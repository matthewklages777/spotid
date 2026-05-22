import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/premium/webhook
// Stripe webhook handler — activates/deactivates premium based on subscription events.
// Set STRIPE_WEBHOOK_SECRET in Railway env vars after adding this endpoint in Stripe dashboard.
export async function POST(req: NextRequest) {
  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!stripeKey || !webhookSecret) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Stripe: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Stripe = ((await import("stripe" as any)) as any).default;
  } catch {
    return Response.json({ error: "Stripe not installed" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const obj = event.data.object as { metadata?: { spotidUserId?: string }; customer?: string; id?: string };
  const userId = obj.metadata?.spotidUserId;

  // Also resolve userId from customer ID if not in metadata
  async function resolveUserId(): Promise<string | null> {
    if (userId) return userId;
    if (!obj.customer) return null;
    const user = await prisma.user.findFirst({ where: { stripeCustomerId: obj.customer as string } });
    return user?.id ?? null;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const uid = await resolveUserId();
      const subId = (obj as { subscription?: string }).subscription;
      if (uid) {
        await prisma.user.update({
          where: { id: uid },
          data: { isPremium: true, premiumSince: new Date(), stripeSubId: subId ?? null },
        });
      }
      break;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.paused": {
      const uid = await resolveUserId();
      if (uid) {
        await prisma.user.update({ where: { id: uid }, data: { isPremium: false } });
      }
      break;
    }
    case "customer.subscription.resumed":
    case "customer.subscription.updated": {
      const sub = event.data.object as { status: string; metadata?: { spotidUserId?: string }; customer?: string };
      const uid = await resolveUserId();
      if (uid) {
        const active = ["active", "trialing"].includes(sub.status);
        await prisma.user.update({ where: { id: uid }, data: { isPremium: active } });
      }
      break;
    }
  }

  return Response.json({ received: true });
}
