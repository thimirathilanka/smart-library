import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import {
  cancelMembership,
  getMemberByStripeCustomerId,
  getMemberByStripeSubscriptionId,
  grantMembership,
} from "@/lib/data/members";
import { recordActivity } from "@/lib/data/activity";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // In local development without webhook secret configured
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const memberId = session.metadata?.memberId || session.client_reference_id;

        if (memberId) {
          const customerId =
            typeof session.customer === "string" ? session.customer : session.customer?.id;
          const subscriptionId =
            typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
          const autoRenew = session.metadata?.autoRenew === "true";

          await grantMembership(memberId, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            autoRenew,
          });

          await recordActivity({
            actorId: memberId,
            action: "membership.purchased",
            targetKind: "membership",
            detail: autoRenew
              ? "Completed recurring subscription checkout via Stripe"
              : "Completed 30-day membership checkout via Stripe",
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Avoid double-processing the first invoice already handled by checkout.session.completed
        if (invoice.billing_reason === "subscription_cycle") {
          const subscriptionRef =
            (invoice as unknown as { subscription?: string | { id: string } }).subscription ??
            invoice.parent?.subscription_details?.subscription;
          const subscriptionId =
            typeof subscriptionRef === "string"
              ? subscriptionRef
              : subscriptionRef?.id;
          const customerRef = invoice.customer;
          const customerId =
            typeof customerRef === "string" ? customerRef : customerRef?.id;

          let member = subscriptionId ? await getMemberByStripeSubscriptionId(subscriptionId) : null;
          if (!member && customerId) {
            member = await getMemberByStripeCustomerId(customerId);
          }

          if (member) {
            await grantMembership(member._id, {
              days: 30,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              autoRenew: true,
            });

            await recordActivity({
              actorId: member._id,
              action: "membership.renewed",
              targetKind: "membership",
              detail: "Automatically renewed monthly membership via Stripe subscription",
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const member = await getMemberByStripeSubscriptionId(subscription.id);
        if (member) {
          await cancelMembership(member._id);
          await recordActivity({
            actorId: member._id,
            action: "membership.cancelled",
            targetKind: "membership",
            detail: "Stripe subscription ended/cancelled",
          });
        }
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing Stripe webhook (${event.type}):`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
