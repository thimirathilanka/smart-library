import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http";
import { memberToMobileUser, requireActiveMemberFromRequest } from "@/lib/api/mobile-auth";
import { recordActivity } from "@/lib/data/activity";
import { cancelMembership, getMemberById, hasActiveMembership } from "@/lib/data/members";
import { getAppBaseUrl } from "@/lib/stripe";

export const runtime = "nodejs";

function membershipUrl() {
  return `${getAppBaseUrl()}/membership`;
}

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const member = await requireActiveMemberFromRequest(request);
  if (!member) return jsonError(request, "Unauthorized.", 401);

  return jsonOk(request, {
    isMember: hasActiveMembership(member),
    membershipExpiresAt: member.membershipExpiresAt ?? null,
    membershipUrl: membershipUrl(),
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
    return jsonOk(
      request,
      {
        error: "Membership can only be purchased on the website.",
        membershipUrl: membershipUrl(),
      },
      { status: 403 },
    );
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

  return jsonError(request, "Action must be cancel.");
}
