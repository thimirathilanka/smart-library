import { redirect } from "next/navigation";
import { AuthorStudio, type AuthorRevision, type AuthorSubmission } from "@/components/author/AuthorStudio";
import { auth } from "@/auth";
import { listBooksByAuthor } from "@/lib/data/books";
import { listPapersByAuthor } from "@/lib/data/papers";
import { gridFsFilenames } from "@/lib/db";
import type { Book, BookRevision, PaperRevision, ResearchPaper } from "@/lib/types";

export const metadata = {
  title: "Author studio",
};

function storedFileName(fileId: string | undefined, names: Map<string, string>) {
  if (!fileId) return undefined;
  return names.get(fileId) || "PDF";
}

function fromBook(book: Book, names: Map<string, string>): AuthorSubmission {
  return {
    id: book._id,
    kind: "book",
    title: book.title,
    status: book.publicationStatus ?? "published",
    addedAt: book.addedAt,
    reviewNote: book.reviewNote,
    author: book.author,
    isbn: book.isbn,
    category: book.category,
    publisher: book.publisher,
    language: book.language,
    pages: book.pages,
    year: book.year,
    access: book.access,
    description: book.description,
    hasFile: Boolean(book.fileId),
    hasCover: Boolean(book.coverId),
    fileName: storedFileName(book.fileId, names),
    revision: book.revision ? bookRevision(book.revision, names) : undefined,
  };
}

function bookRevision(revision: BookRevision, names: Map<string, string>): AuthorRevision {
  return {
    status: revision.status,
    submittedAt: revision.submittedAt,
    reviewNote: revision.reviewNote,
    hasFile: Boolean(revision.fileId),
    hasCover: Boolean(revision.coverId),
    fileName: storedFileName(revision.fileId, names),
    clearCover: Boolean(revision.clearCover),
    title: revision.title,
    author: revision.author,
    isbn: revision.isbn,
    category: revision.category,
    publisher: revision.publisher,
    language: revision.language,
    pages: revision.pages,
    year: revision.year,
    access: revision.access,
    description: revision.description,
  };
}

function fromPaper(paper: ResearchPaper, names: Map<string, string>): AuthorSubmission {
  return {
    id: paper._id,
    kind: "paper",
    title: paper.title,
    status: paper.publicationStatus ?? "published",
    addedAt: paper.addedAt,
    reviewNote: paper.reviewNote,
    authors: paper.authors.join(", "),
    doi: paper.doi,
    field: paper.field,
    venue: paper.venue,
    pages: paper.pages,
    keywords: paper.keywords.join(", "),
    year: paper.year,
    access: paper.access,
    description: paper.abstract,
    hasFile: Boolean(paper.fileId),
    hasCover: Boolean(paper.coverId),
    fileName: storedFileName(paper.fileId, names),
    revision: paper.revision ? paperRevision(paper.revision, names) : undefined,
  };
}

function paperRevision(revision: PaperRevision, names: Map<string, string>): AuthorRevision {
  return {
    status: revision.status,
    submittedAt: revision.submittedAt,
    reviewNote: revision.reviewNote,
    hasFile: Boolean(revision.fileId),
    hasCover: Boolean(revision.coverId),
    fileName: storedFileName(revision.fileId, names),
    clearCover: Boolean(revision.clearCover),
    title: revision.title,
    authors: revision.authors.join(", "),
    doi: revision.doi,
    field: revision.field,
    venue: revision.venue,
    pages: revision.pages,
    keywords: revision.keywords.join(", "),
    year: revision.year,
    access: revision.access,
    description: revision.abstract,
  };
}

export default async function AuthorPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAuthor) redirect("/");

  const [books, papers] = await Promise.all([
    listBooksByAuthor(session.user.id),
    listPapersByAuthor(session.user.id),
  ]);
  const fileNames = await gridFsFilenames([
    ...books.flatMap((book) => [book.fileId, book.revision?.fileId]),
    ...papers.flatMap((paper) => [paper.fileId, paper.revision?.fileId]),
  ]);
  const submissions = [...books.map((book) => fromBook(book, fileNames)), ...papers.map((paper) => fromPaper(paper, fileNames))].sort(
    (a, b) => b.addedAt.localeCompare(a.addedAt),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">Author studio</p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Author studio</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Upload a book or paper, then wait for an admin to publish it. You can edit unpublished work, withdraw it, or send a new version of a published title without taking it offline.
      </p>
      <div className="mt-8">
        <AuthorStudio submissions={submissions} />
      </div>
    </div>
  );
}
