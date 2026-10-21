import { preflight } from "@/lib/api/cors";
import { filterPapers } from "@/lib/api/catalog-filter";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireMobileMember } from "@/lib/api/mobile-auth";
import { listPapers } from "@/lib/data/papers";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const access = await requireMobileMember(request);
  if (!access.ok) return jsonError(request, access.error, access.status);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? undefined;
  const field = searchParams.get("field") ?? undefined;
  const papers = filterPapers(await listPapers(), search, field);
  return jsonOk(request, { papers });
}
