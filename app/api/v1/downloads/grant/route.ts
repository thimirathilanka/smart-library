import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http";
import { requireMobileMember } from "@/lib/api/mobile-auth";
import { resolveDownloadableResource, signDownloadGrant } from "@/lib/api/mobile-downloads";
import type { ResourceKind } from "@/lib/types";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const access = await requireMobileMember(request);
  if (!access.ok) return jsonError(request, access.error, access.status);

  const body = await readJsonBody<{ kind?: string; resourceId?: string }>(request);
  if (!body) return jsonError(request, "Invalid JSON body.");

  const kind: ResourceKind | null = body.kind === "book" || body.kind === "paper" ? body.kind : null;
  const resourceId = String(body.resourceId ?? "").trim();
  if (!kind || !resourceId || resourceId.length > 80) {
    return jsonError(request, "Provide kind and resourceId.");
  }

  const resource = await resolveDownloadableResource(kind, resourceId);
  if (!resource) return jsonError(request, "File not available for download.", 404);

  const grant = await signDownloadGrant({
    sub: access.member._id,
    kind: resource.kind,
    resourceId: resource.resourceId,
    fileId: resource.fileId,
    title: resource.title,
  });

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  return jsonOk(request, {
    grant,
    expiresAt,
    kind: resource.kind,
    resourceId: resource.resourceId,
    title: resource.title,
  });
}
