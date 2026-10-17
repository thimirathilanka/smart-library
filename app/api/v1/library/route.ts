import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireActiveMemberFromRequest } from "@/lib/api/mobile-auth";
import { listBooks } from "@/lib/data/books";
import { getMemberLibrary } from "@/lib/data/members";
import { listPapers } from "@/lib/data/papers";
import type { Book, LibraryItem, ResearchPaper } from "@/lib/types";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

function enrich(
  items: LibraryItem[],
  booksById: Map<string, Book>,
  papersById: Map<string, ResearchPaper>,
) {
  return items
    .map((item) => {
      if (item.kind === "book") {
        const book = booksById.get(item.resourceId);
        return book ? { ...item, book } : null;
      }
      const paper = papersById.get(item.resourceId);
      return paper ? { ...item, paper } : null;
    })
    .filter(Boolean);
}

export async function GET(request: Request) {
  const member = await requireActiveMemberFromRequest(request);
  if (!member) return jsonError(request, "Unauthorized.", 401);

  const [library, books, papers] = await Promise.all([
    getMemberLibrary(member._id),
    listBooks(),
    listPapers(),
  ]);
  const booksById = new Map(books.map((book) => [book._id, book]));
  const papersById = new Map(papers.map((paper) => [paper._id, paper]));

  return jsonOk(request, {
    library: {
      saved: enrich(library.saved, booksById, papersById),
      favorites: enrich(library.favorites, booksById, papersById),
      history: enrich(library.history, booksById, papersById),
    },
  });
}
