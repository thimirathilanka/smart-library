"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { cancelMembership, getMemberById, grantMembership, requireActiveAccount } from "@/lib/data/members";
import { recordActivity } from "@/lib/data/activity";
import { cancelStripeSubscription, createStripeCheckoutSession, getStripe } from "@/lib/stripe";

export type MembershipCheckoutResult = {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
};

export type MembershipPurchaseResult = {
  success: boolean;
  isMember?: boolean;
  membershipExpiresAt?: string;
  error?: string;
};

export async function createMembershipCheckoutAction(autoRenew: boolean): Promise<MembershipCheckoutResult> {
  const session = await auth();
  const memberId = session?.user?.id;
  if (!memberId) return { success: false, error: "Please sign in to continue to payment." };

  const member = await requireActiveAccount(memberId);
  if (!member) return { success: false, error: "Your account cannot start a membership right now." };

  try {
    const checkoutSession = await createStripeCheckoutSession({
      memberId,
      email: member.email,
      name: member.name,
      autoRenew,
    });

    if (!checkoutSession.url) {
      return { success: false, error: "Unable to generate payment checkout URL." };
    }

    return { success: true, checkoutUrl: checkoutSession.url };
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    const message = error instanceof Error ? error.message : "Failed to initiate payment gateway.";
    return { success: false, error: message };
  }
}

export async function verifyCheckoutSessionAction(sessionId: string): Promise<MembershipPurchaseResult> {
  const session = await auth();
  const memberId = session?.user?.id;
  if (!memberId) return { success: false, error: "Sign in to verify payment." };

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.metadata?.memberId !== memberId) {
      return { success: false, error: "Payment does not match current user account." };
    }

    const isPaid = checkoutSession.payment_status === "paid" || checkoutSession.status === "complete";
    if (!isPaid) {
      return { success: false, error: "Payment has not yet completed." };
    }

    const customerId =
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : checkoutSession.customer?.id;

    const subscriptionId =
      typeof checkoutSession.subscription === "string"
        ? checkoutSession.subscription
        : checkoutSession.subscription?.id;

    const autoRenew = checkoutSession.metadata?.autoRenew === "true";

    const membershipExpiresAt = await grantMembership(memberId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      autoRenew,
    });

    if (!membershipExpiresAt) {
      return { success: false, error: "Could not apply membership after payment." };
    }

    await recordActivity({
      actorId: memberId,
      action: "membership.purchased",
      targetKind: "membership",
      detail: autoRenew ? "Purchased recurring monthly membership via Stripe" : "Purchased 30-day membership via Stripe",
    });

    revalidatePath("/membership");
    return { success: true, isMember: true, membershipExpiresAt };
  } catch (error) {
    console.error("Error verifying Stripe session:", error);
    return { success: false, error: "Could not verify payment session." };
  }
}

export async function cancelMembershipAction(): Promise<MembershipPurchaseResult> {
  const session = await auth();
  const memberId = session?.user?.id;
  if (!memberId) return { success: false, error: "Sign in to manage membership." };

  const member = await requireActiveAccount(memberId);
  if (!member) return { success: false, error: "Your account cannot manage membership right now." };

  const currentMember = await getMemberById(memberId);
  if (currentMember?.stripeSubscriptionId) {
    await cancelStripeSubscription(currentMember.stripeSubscriptionId);
  }

  const cancelled = await cancelMembership(memberId);
  if (!cancelled) {
    return { success: false, error: "Your membership could not be cancelled." };
  }

  await recordActivity({
    actorId: memberId,
    action: "membership.cancelled",
    targetKind: "membership",
    detail: "Cancelled membership and stopped automatic renewal",
  });

  revalidatePath("/membership");
  return { success: true, isMember: false };
}
