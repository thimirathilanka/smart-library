import { notFound } from "next/navigation";
import { BookDetail } from "@/components/details/ResourceDetail";
import { getBook, relatedBooks } from "@/lib/mock-data";

export async function generateMetadata({ params }: PageProps<"/books/[id]">) {
  const { id } = await params;
  const book = getBook(id);
  return { title: book?.title ?? "Book" };
}

export default async function BookPage({ params }: PageProps<"/books/[id]">) {
  const { id } = await params;
  const book = getBook(id);
  if (!book) notFound();

  return <BookDetail book={book} related={relatedBooks(book)} />;
}
