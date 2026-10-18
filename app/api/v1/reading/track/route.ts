import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http";
import { requireActiveMemberFromRequest } from "@/lib/api/mobile-auth";
import { getBook } from "@/lib/data/books";
import { hasActiveMembership, recordReading } from "@/lib/data/members";
import { getPaper } from "@/lib/data/papers";
import type { ResourceKind } from "@/lib/types";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const member = await requireActiveMemberFromRequest(request);
  if (!member) return jsonError(request, "Unauthorized.", 401);

  const body = await readJsonBody<{ kind?: string; resourceId?: string }>(request);
  if (!body) return jsonError(request, "Invalid JSON body.");

  const kind: ResourceKind | null = body.kind === "book" || body.kind === "paper" ? body.kind : null;
  const resourceId = String(body.resourceId ?? "").trim();
  if (!kind || !resourceId || resourceId.length > 80) {
    return jsonError(request, "Provide kind and resourceId.");
  }

  const resource = kind === "book" ? await getBook(resourceId) : await getPaper(resourceId);
  if (!resource) return jsonError(request, "Resource not found.", 404);

  if (resource.access === "members" && !member.isAdmin && !hasActiveMembership(member)) {
    return jsonError(request, "Membership required.", 403);
  }

  await recordReading(member._id, resourceId, kind);
  return jsonOk(request, { tracked: true });
}
