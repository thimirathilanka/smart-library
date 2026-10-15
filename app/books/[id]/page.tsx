import { notFound } from "next/navigation";
import { BookDetail } from "@/components/details/ResourceDetail";
import { getBook, relatedBooks } from "@/lib/data/books";
import { auth } from "@/auth";
import { getMemberById, hasActiveMembership } from "@/lib/data/members";
import { getUserResourceRating } from "@/lib/data/ratings";

export async function generateMetadata({ params }: PageProps<"/books/[id]">) {
  const { id } = await params;
  const book = await getBook(id);
  return { title: book?.title ?? "Book" };
}

export default async function BookPage({
  params,
  searchParams,
}: PageProps<"/books/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const book = await getBook(id);
  if (!book) notFound();
  const session = await auth();
  const [member, related, userRating] = await Promise.all([
    session?.user?.id ? getMemberById(session.user.id) : Promise.resolve(null),
    relatedBooks(book),
    session?.user?.id ? getUserResourceRating(session.user.id, "book", book._id) : Promise.resolve(0),
  ]);
  const library = member?.library;
  const hasMembership = hasActiveMembership(member);

  return (
    <BookDetail
      book={book}
      related={related}
      signedIn={Boolean(session?.user)}
      hasMembership={hasMembership}
      promptLocked={query.locked === "1"}
      saved={library?.saved.some((item) => item.resourceId === book._id) ?? false}
      favorited={library?.favorites.some((item) => item.resourceId === book._id) ?? false}
      userRating={userRating}
    />
  );
}
