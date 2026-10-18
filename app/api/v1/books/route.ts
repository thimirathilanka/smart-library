import { preflight } from "@/lib/api/cors";
import { filterBooks } from "@/lib/api/catalog-filter";
import { jsonOk } from "@/lib/api/http";
import { listBooks } from "@/lib/data/books";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const books = filterBooks(await listBooks(), search, category);
  return jsonOk(request, { books });
}
