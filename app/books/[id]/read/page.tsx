import { notFound, redirect } from "next/navigation";
import { ReaderView } from "@/components/read/ReaderView";
import { TrackRead } from "@/components/read/TrackRead";
import { getBook } from "@/lib/data/books";
import { auth } from "@/auth";

export async function generateMetadata({ params }: PageProps<"/books/[id]/read">) {
  const { id } = await params;
  const book = await getBook(id);
  return { title: book ? `Reading · ${book.title}` : "Reader" };
}

export default async function BookReaderPage({
  params,
}: PageProps<"/books/[id]/read">) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();
  const session = await auth();
  if (book.access === "members" && !session?.user) {
    redirect(`/login?callbackUrl=/books/${book._id}/read`);
  }

  return (
    <>
      <TrackRead kind="book" id={book._id} />
      <ReaderView
        backHref={`/books/${book._id}`}
        kicker={`${book.publisher} · ${book.year}`}
        title={book.title}
        byline={book.author}
      >
        <p>{book.description}</p>
        <p>
          This opening chapter sets the terms of the inquiry: what is at stake,
          which methods will carry the argument, and how later sections will
          return to evidence. {book.author} writes with care for both specialists
          and readers coming to {book.title.toLowerCase()} for the first time.
        </p>
        <p>
          Libraries that treat knowledge as infrastructure—rather than as a
          warehouse of files—design for presence: a quiet column of type, a
          stable citation, and a record of where the reader left off.
        </p>
        <p>
          Subsequent chapters develop method, evidence, and debate. Your place in
          this volume is kept on My Library.
        </p>
      </ReaderView>
    </>
  );
}
