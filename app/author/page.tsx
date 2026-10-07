import { redirect } from "next/navigation";
import { AuthorStudio, type AuthorSubmission } from "@/components/author/AuthorStudio";
import { auth } from "@/auth";
import { listBooksByAuthor } from "@/lib/data/books";
import { listPapersByAuthor } from "@/lib/data/papers";
import type { Book, ResearchPaper } from "@/lib/types";

export const metadata = {
  title: "Author studio",
};

function fromBook(book: Book): AuthorSubmission {
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
    year: book.year,
    access: book.access,
    description: book.description,
  };
}

function fromPaper(paper: ResearchPaper): AuthorSubmission {
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
    year: paper.year,
    access: paper.access,
    description: paper.abstract,
  };
}

export default async function AuthorPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAuthor) redirect("/");

  const [books, papers] = await Promise.all([
    listBooksByAuthor(session.user.id),
    listPapersByAuthor(session.user.id),
  ]);
  const submissions = [...books.map(fromBook), ...papers.map(fromPaper)].sort((a, b) =>
    b.addedAt.localeCompare(a.addedAt),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">Author studio</p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Author studio</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Upload a book or paper, then wait for an admin to publish it. If a submission is rejected, you can edit it and send it back.
      </p>
      <div className="mt-8">
        <AuthorStudio submissions={submissions} />
      </div>
    </div>
  );
}
