import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk } from "@/lib/api/http";
import { getMemberFromRequest, memberToMobileUser } from "@/lib/api/mobile-auth";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const member = await getMemberFromRequest(request);
  if (!member) return jsonError(request, "Unauthorized.", 401);
  return jsonOk(request, { user: memberToMobileUser(member) });
}
