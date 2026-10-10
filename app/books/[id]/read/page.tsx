import { notFound, redirect } from "next/navigation";
import { ReaderView } from "@/components/read/ReaderView";
import { TrackRead } from "@/components/read/TrackRead";
import { getBook } from "@/lib/data/books";
import { getMemberById, hasActiveMembership } from "@/lib/data/members";
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
  const member = session?.user?.id ? await getMemberById(session.user.id) : null;
  if (book.access === "members") {
    if (!member) {
      redirect(`/login?callbackUrl=/books/${book._id}/read`);
    }
    const isAdmin = member.status === "Active" && member.isAdmin;
    if (!isAdmin && !hasActiveMembership(member)) {
      redirect(`/books/${book._id}?locked=1`);
    }
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
        {book.fileId ? (
          <iframe
            src={`/api/books/${book._id}/file`}
            title={`Read ${book.title}`}
            className="h-[78dvh] min-h-[32rem] w-full rounded-lg border border-line bg-white"
          />
        ) : (
          <>
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
          </>
        )}
      </ReaderView>
    </>
  );
}
