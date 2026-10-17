"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { cancelMembership, grantMembership, requireActiveAccount } from "@/lib/data/members";
import { recordActivity } from "@/lib/data/activity";

export type MembershipPurchaseResult = {
  success: boolean;
  isMember?: boolean;
  membershipExpiresAt?: string;
  error?: string;
};

export async function purchaseMembershipAction(): Promise<MembershipPurchaseResult> {
  const session = await auth();
  const memberId = session?.user?.id;
  if (!memberId) return { success: false, error: "Sign in to get membership." };

  const member = await requireActiveAccount(memberId);
  if (!member) return { success: false, error: "Your account cannot start a membership right now." };

  const membershipExpiresAt = await grantMembership(memberId);
  if (!membershipExpiresAt) {
    return { success: false, error: "Your membership could not be updated." };
  }
  await recordActivity({ actorId: memberId, action: "membership.purchased", targetKind: "membership", detail: "Started or renewed membership" });

  revalidatePath("/membership");
  return { success: true, isMember: true, membershipExpiresAt };
}

export async function cancelMembershipAction(): Promise<MembershipPurchaseResult> {
  const session = await auth();
  const memberId = session?.user?.id;
  if (!memberId) return { success: false, error: "Sign in to manage membership." };

  const member = await requireActiveAccount(memberId);
  if (!member) return { success: false, error: "Your account cannot manage membership right now." };

  const cancelled = await cancelMembership(memberId);
  if (!cancelled) {
    return { success: false, error: "Your membership could not be cancelled." };
  }
  await recordActivity({ actorId: memberId, action: "membership.cancelled", targetKind: "membership", detail: "Cancelled membership" });

  revalidatePath("/membership");
  return { success: true, isMember: false };
}
