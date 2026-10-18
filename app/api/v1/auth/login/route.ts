import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http";
import { loginWithCredentials } from "@/lib/api/mobile-auth";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const body = await readJsonBody<{ email?: string; password?: string }>(request);
  if (!body) return jsonError(request, "Invalid JSON body.");

  const result = await loginWithCredentials(String(body.email ?? ""), String(body.password ?? ""));
  if ("error" in result) return jsonError(request, result.error, 401);
  return jsonOk(request, result);
}
