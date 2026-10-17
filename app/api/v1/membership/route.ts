import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http";
import { memberToMobileUser, requireActiveMemberFromRequest } from "@/lib/api/mobile-auth";
import { recordActivity } from "@/lib/data/activity";
import {
  cancelMembership,
  getMemberById,
  grantMembership,
  hasActiveMembership,
} from "@/lib/data/members";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const member = await requireActiveMemberFromRequest(request);
  if (!member) return jsonError(request, "Unauthorized.", 401);

  return jsonOk(request, {
    isMember: hasActiveMembership(member),
    membershipExpiresAt: member.membershipExpiresAt ?? null,
    user: memberToMobileUser(member),
  });
}

export async function POST(request: Request) {
  const member = await requireActiveMemberFromRequest(request);
  if (!member) return jsonError(request, "Unauthorized.", 401);

  const body = await readJsonBody<{ action?: string }>(request);
  if (!body) return jsonError(request, "Invalid JSON body.");

  const action = String(body.action ?? "").trim();
  if (action === "purchase") {
    const membershipExpiresAt = await grantMembership(member._id);
    if (!membershipExpiresAt) return jsonError(request, "Your membership could not be updated.");
    await recordActivity({
      actorId: member._id,
      action: "membership.purchased",
      targetKind: "membership",
      detail: "Started or renewed membership (mobile)",
    });
    const updated = await getMemberById(member._id);
    return jsonOk(request, {
      success: true,
      isMember: true,
      membershipExpiresAt,
      user: updated ? memberToMobileUser(updated) : null,
    });
  }

  if (action === "cancel") {
    const cancelled = await cancelMembership(member._id);
    if (!cancelled) return jsonError(request, "Your membership could not be cancelled.");
    await recordActivity({
      actorId: member._id,
      action: "membership.cancelled",
      targetKind: "membership",
      detail: "Cancelled membership (mobile)",
    });
    const updated = await getMemberById(member._id);
    return jsonOk(request, {
      success: true,
      isMember: false,
      membershipExpiresAt: null,
      user: updated ? memberToMobileUser(updated) : null,
    });
  }

  return jsonError(request, "Action must be purchase or cancel.");
}
