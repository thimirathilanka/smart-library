import { notFound } from "next/navigation";
import { BookDetail } from "@/components/details/ResourceDetail";
import { getBook, relatedBooks } from "@/lib/data/books";
import { auth } from "@/auth";
import { getMemberLibrary } from "@/lib/data/members";

export async function generateMetadata({ params }: PageProps<"/books/[id]">) {
  const { id } = await params;
  const book = await getBook(id);
  return { title: book?.title ?? "Book" };
}

export default async function BookPage({ params }: PageProps<"/books/[id]">) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();
  const session = await auth();
  const library = session?.user?.id ? await getMemberLibrary(session.user.id) : null;

  return (
    <BookDetail
      book={book}
      related={await relatedBooks(book)}
      signedIn={Boolean(session?.user)}
      saved={library?.saved.some((item) => item.resourceId === book._id) ?? false}
      favorited={library?.favorites.some((item) => item.resourceId === book._id) ?? false}
    />
  );
}
