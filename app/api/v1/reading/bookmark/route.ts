import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http";
import { requireActiveMemberFromRequest } from "@/lib/api/mobile-auth";
import { removeReadingBookmark, saveReadingBookmark } from "@/lib/data/members";
import type { ResourceKind } from "@/lib/types";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const member = await requireActiveMemberFromRequest(request);
  if (!member) return jsonError(request, "Unauthorized.", 401);

  const body = await readJsonBody<{
    resourceId?: string;
    kind?: string;
    page?: number;
    totalPages?: number;
  }>(request);
  if (!body) return jsonError(request, "Invalid JSON body.");

  const kind: ResourceKind | null = body.kind === "book" || body.kind === "paper" ? body.kind : null;
  const resourceId = String(body.resourceId ?? "").trim();
  const page = Number(body.page);
  const totalPages = Number(body.totalPages);
  if (!kind || !resourceId || resourceId.length > 80) {
    return jsonError(request, "Provide kind and resourceId.");
  }
  if (!Number.isInteger(page) || !Number.isInteger(totalPages) || page < 1 || totalPages < 1 || page > totalPages) {
    return jsonError(request, "This page number is not valid.");
  }

  const result = await saveReadingBookmark(member._id, resourceId, kind, page, totalPages);
  if (!result) return jsonError(request, "Your reading position could not be saved.");
  return jsonOk(request, { saved: true, ...result });
}

export async function DELETE(request: Request) {
  const member = await requireActiveMemberFromRequest(request);
  if (!member) return jsonError(request, "Unauthorized.", 401);

  const body = await readJsonBody<{ resourceId?: string; kind?: string }>(request);
  if (!body) return jsonError(request, "Invalid JSON body.");

  const kind: ResourceKind | null = body.kind === "book" || body.kind === "paper" ? body.kind : null;
  const resourceId = String(body.resourceId ?? "").trim();
  if (!kind || !resourceId) return jsonError(request, "Provide kind and resourceId.");

  const removed = await removeReadingBookmark(member._id, resourceId, kind);
  if (!removed) return jsonError(request, "This bookmark could not be removed.");
  return jsonOk(request, { removed: true });
}
