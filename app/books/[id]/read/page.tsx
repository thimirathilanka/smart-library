import { notFound } from "next/navigation";
import { ReaderView } from "@/components/read/ReaderView";
import { getBook } from "@/lib/mock-data";

export async function generateMetadata({ params }: PageProps<"/books/[id]/read">) {
  const { id } = await params;
  const book = getBook(id);
  return { title: book ? `Reading · ${book.title}` : "Reader" };
}

export default async function BookReaderPage({
  params,
}: PageProps<"/books/[id]/read">) {
  const { id } = await params;
  const book = getBook(id);
  if (!book) notFound();

  return (
    <ReaderView
      backHref={`/books/${book._id}`}
      kicker={`${book.publisher} · ${book.year}`}
      title={book.title}
      byline={book.author}
    >
      <p>{book.description}</p>
      <p>
        This in-browser reader is part of Nextgen Digital Library. In production,
        paginated chapters would stream from the digital object store. For now,
        the opening argument of the volume is presented as continuous text so
        reviewers can judge typography, measure, and the academic reading
        surface.
      </p>
      <p>
        Libraries that treat knowledge as infrastructure—rather than as a
        warehouse of files—design for presence: a quiet column of type, a
        stable citation, and a record of where the reader left off. {book.author}{" "}
        writes in that tradition, insisting that {book.title.toLowerCase()} is
        not only a subject to be mastered but a civic practice.
      </p>
      <p>
        Subsequent chapters develop method, evidence, and debate. Return to the
        catalog when you are ready; your place is kept on My Library.
      </p>
    </ReaderView>
  );
}
