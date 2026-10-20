import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured in environment variables.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export const MEMBERSHIP_PRICE_AMOUNT = Number(process.env.STRIPE_PRICE_AMOUNT) || 1000;
export const MEMBERSHIP_CURRENCY = (process.env.STRIPE_CURRENCY || "inr").toLowerCase();

export function getAppBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

export async function createStripeCheckoutSession({
  memberId,
  email,
  name,
  autoRenew,
}: {
  memberId: string;
  email: string;
  name?: string;
  autoRenew: boolean;
}) {
  const stripe = getStripe();
  const baseUrl = getAppBaseUrl();
  const unitAmount = Math.round(MEMBERSHIP_PRICE_AMOUNT * 100);

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
    price_data: {
      currency: MEMBERSHIP_CURRENCY,
      product_data: {
        name: autoRenew
          ? "Library Membership (Monthly Subscription)"
          : "Library Membership (30-Day Pass)",
        description: autoRenew
          ? "Automatic monthly membership with access to exclusive library titles."
          : "30 days of full access to exclusive books, research papers, and offline reading.",
      },
      unit_amount: unitAmount,
      ...(autoRenew
        ? {
            recurring: {
              interval: "month",
            },
          }
        : {}),
    },
    quantity: 1,
  };

  const session = await stripe.checkout.sessions.create({
    mode: autoRenew ? "subscription" : "payment",
    customer_email: email,
    client_reference_id: memberId,
    metadata: {
      memberId,
      autoRenew: String(autoRenew),
      memberName: name ?? "",
    },
    ...(autoRenew
      ? {
          subscription_data: {
            metadata: {
              memberId,
              autoRenew: "true",
            },
          },
        }
      : {}),
    line_items: [lineItem],
    success_url: `${baseUrl}/membership?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/membership?payment=cancelled`,
  });

  return session;
}

export async function cancelStripeSubscription(subscriptionId: string) {
  const stripe = getStripe();
  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error("Failed to cancel Stripe subscription:", error);
    return null;
  }
}
