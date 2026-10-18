import type { Book, ResearchPaper } from "@/lib/types";

function matchesQuery(haystacks: Array<string | number | undefined | null>, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystacks.some((value) => String(value ?? "").toLowerCase().includes(q));
}

export function filterBooks(books: Book[], search?: string, category?: string) {
  return books.filter((book) => {
    if (category && book.category.toLowerCase() !== category.toLowerCase()) return false;
    return matchesQuery(
      [book.title, book.subtitle, book.author, book.category, book.isbn, book.publisher, book.description],
      search ?? "",
    );
  });
}

export function filterPapers(papers: ResearchPaper[], search?: string, field?: string) {
  return papers.filter((paper) => {
    if (field && paper.field.toLowerCase() !== field.toLowerCase()) return false;
    return matchesQuery(
      [
        paper.title,
        paper.abstract,
        paper.field,
        paper.venue,
        paper.doi,
        ...paper.authors,
        ...paper.keywords,
      ],
      search ?? "",
    );
  });
}
