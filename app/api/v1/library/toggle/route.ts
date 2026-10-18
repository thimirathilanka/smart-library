import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http";
import { requireMobileMember } from "@/lib/api/mobile-auth";
import { recordActivity } from "@/lib/data/activity";
import { toggleLibraryList } from "@/lib/data/members";
import type { ResourceKind } from "@/lib/types";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const access = await requireMobileMember(request);
  if (!access.ok) return jsonError(request, access.error, access.status);
  const member = access.member;

  const body = await readJsonBody<{
    list?: string;
    resourceId?: string;
    kind?: string;
  }>(request);
  if (!body) return jsonError(request, "Invalid JSON body.");

  const list = body.list === "saved" || body.list === "favorites" ? body.list : null;
  const kind: ResourceKind | null = body.kind === "book" || body.kind === "paper" ? body.kind : null;
  const resourceId = String(body.resourceId ?? "").trim();
  if (!list || !kind || !resourceId || resourceId.length > 80) {
    return jsonError(request, "Provide list, kind, and resourceId.");
  }

  const result = await toggleLibraryList(member._id, list, resourceId, kind);
  await recordActivity({
    actorId: member._id,
    action: `library.${list}_${result.added ? "added" : "removed"}`,
    targetKind: kind,
    targetId: resourceId,
    detail: `${kind} ${result.added ? "added to" : "removed from"} ${list} (mobile)`,
  });

  return jsonOk(request, { added: result.added, library: result.library });
}
