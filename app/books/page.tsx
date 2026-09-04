import { Suspense } from "react";
import { BookCatalog } from "@/components/books/BookCatalog";
import { listBooks } from "@/lib/data/books";

export const metadata = {
  title: "Books",
};

export default async function BooksPage({ searchParams }: PageProps<"/books">) {
  const params = await searchParams;
  const initialQuery = typeof params.q === "string" ? params.q : "";
  const books = await listBooks();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">
        Catalog
      </p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Books</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Browse the digital monograph collection. Open any title to read it in
        the browser.
      </p>
      <div className="mt-8">
        <Suspense>
          <BookCatalog books={books} initialQuery={initialQuery} />
        </Suspense>
      </div>
    </div>
  );
}
