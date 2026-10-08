"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { cancelMembership, grantMembership } from "@/lib/data/members";

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

  const membershipExpiresAt = await grantMembership(memberId);
  if (!membershipExpiresAt) {
    return { success: false, error: "Your membership could not be updated." };
  }

  revalidatePath("/membership");
  return { success: true, isMember: true, membershipExpiresAt };
}

export async function cancelMembershipAction(): Promise<MembershipPurchaseResult> {
  const session = await auth();
  const memberId = session?.user?.id;
  if (!memberId) return { success: false, error: "Sign in to manage membership." };

  const cancelled = await cancelMembership(memberId);
  if (!cancelled) {
    return { success: false, error: "Your membership could not be cancelled." };
  }

  revalidatePath("/membership");
  return { success: true, isMember: false };
}