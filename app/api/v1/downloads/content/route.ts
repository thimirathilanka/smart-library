import { NextResponse } from "next/server";
import { corsHeaders, preflight } from "@/lib/api/cors";
import { jsonError } from "@/lib/api/http";
import { requireMobileMember } from "@/lib/api/mobile-auth";
import { encryptPdfForMobile, verifyDownloadGrant } from "@/lib/api/mobile-downloads";
import { recordFileOpen } from "@/lib/data/reads";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const access = await requireMobileMember(request);
  if (!access.ok) return jsonError(request, access.error, access.status);

  const grantToken = new URL(request.url).searchParams.get("grant")?.trim();
  if (!grantToken) return jsonError(request, "Missing download grant.", 400);

  const grant = await verifyDownloadGrant(grantToken);
  if (!grant || grant.sub !== access.member._id) {
    return jsonError(request, "Invalid or expired download grant.", 403);
  }

  const encrypted = await encryptPdfForMobile(grant.fileId);
  if (!encrypted) return jsonError(request, "File not found.", 404);

  await recordFileOpen(grant.kind, grant.resourceId, access.member._id, request);

  const response = new NextResponse(new Uint8Array(encrypted.ciphertext), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.smartlibrary.encrypted",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-IV": encrypted.iv,
      "X-Auth-Tag": encrypted.authTag,
      "X-Wrapped-Key": encrypted.wrappedKey,
      "X-Resource-Kind": grant.kind,
      "X-Resource-Id": grant.resourceId,
      "X-Resource-Title": encodeURIComponent(grant.title),
    },
  });

  for (const [key, value] of Object.entries(corsHeaders(request))) {
    response.headers.set(key, value);
  }
  return response;
}
