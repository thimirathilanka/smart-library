import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReaderView } from "@/components/read/ReaderView";
import { TrackRead } from "@/components/read/TrackRead";
import { PdfPageViewer } from "@/components/read/PdfPageViewer";
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
  searchParams,
}: PageProps<"/books/[id]/read">) {
  const { id } = await params;
  const query = await searchParams;
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

  const savedPage = member?.library?.history?.find((item) => item.kind === "book" && item.resourceId === book._id)?.bookmarkPage;
  const requestedPage = Number(query.page);
  const initialPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : savedPage ?? 1;

  return (
    <>
      <TrackRead kind="book" id={book._id} />
      <ReaderView
        backHref={`/books/${book._id}`}
        kicker={`${book.publisher} · ${book.year}`}
        title={book.title}
        byline={book.author}
        showBackLink={!book.fileId}
      >
        {book.fileId ? (
          <PdfPageViewer
            src={`/api/books/${book._id}/file`}
            title={book.title}
            kind="book"
            resourceId={book._id}
            backHref={`/books/${book._id}`}
            initialPage={initialPage}
            initialBookmarkPage={savedPage}
            isSignedIn={Boolean(session?.user?.id && member?.status === "Active")}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
            <p className="text-muted">No PDF is available for this title yet.</p>
            <Link
              href={`/books/${book._id}`}
              className="mt-4 inline-flex rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-mid"
            >
              Back to details
            </Link>
          </div>
        )}
      </ReaderView>
    </>
  );
}
