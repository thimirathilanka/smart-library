import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http";
import { registerWithCredentials } from "@/lib/api/mobile-auth";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const body = await readJsonBody<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>(request);
  if (!body) return jsonError(request, "Invalid JSON body.");

  const result = await registerWithCredentials({
    firstName: String(body.firstName ?? ""),
    lastName: String(body.lastName ?? ""),
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
    confirmPassword: String(body.confirmPassword ?? ""),
  });
  if ("error" in result) return jsonError(request, result.error, 400);
  return jsonOk(request, result, { status: 201 });
}
