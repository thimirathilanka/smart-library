import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireMobileMember } from "@/lib/api/mobile-auth";
import { getBook, relatedBooks } from "@/lib/data/books";
import { getUserResourceRating } from "@/lib/data/ratings";
import { getMemberLibrary } from "@/lib/data/members";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireMobileMember(request);
  if (!access.ok) return jsonError(request, access.error, access.status);

  const { id } = await params;
  const book = await getBook(id);
  if (!book) return jsonError(request, "Book not found.", 404);

  const [related, userRating, library] = await Promise.all([
    relatedBooks(book),
    getUserResourceRating(access.member._id, "book", id),
    getMemberLibrary(access.member._id),
  ]);

  return jsonOk(request, {
    book,
    related,
    userRating,
    saved: library.saved.some((item) => item.resourceId === id && item.kind === "book"),
    favorited: library.favorites.some((item) => item.resourceId === id && item.kind === "book"),
    canRead: true,
  });
}
