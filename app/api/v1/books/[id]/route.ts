import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk } from "@/lib/api/http";
import { getMemberFromRequest } from "@/lib/api/mobile-auth";
import { getBook, relatedBooks } from "@/lib/data/books";
import { getUserResourceRating } from "@/lib/data/ratings";
import { getMemberLibrary, hasActiveMembership, isActiveAccount } from "@/lib/data/members";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return jsonError(request, "Book not found.", 404);

  const member = await getMemberFromRequest(request);
  const related = await relatedBooks(book);
  let userRating = 0;
  let saved = false;
  let favorited = false;
  let canRead = book.access === "open";

  if (member && isActiveAccount(member)) {
    const [rating, library] = await Promise.all([
      getUserResourceRating(member._id, "book", id),
      getMemberLibrary(member._id),
    ]);
    userRating = rating;
    saved = library.saved.some((item) => item.resourceId === id && item.kind === "book");
    favorited = library.favorites.some((item) => item.resourceId === id && item.kind === "book");
    canRead = book.access === "open" || member.isAdmin || hasActiveMembership(member);
  } else if (book.access === "members") {
    canRead = false;
  }

  return jsonOk(request, { book, related, userRating, saved, favorited, canRead });
}
