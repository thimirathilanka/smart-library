import type { Book } from "@/lib/types";
import { BookCover } from "@/components/ui/BookCover";
import { AccessBadge } from "@/components/ui/AccessBadge";
import { RatingStars } from "@/components/ui/RatingStars";
import { cn } from "@/lib/format";
import Link from "next/link";

export function BookCard({
  book,
  layout = "grid",
}: {
  book: Book;
  layout?: "grid" | "list";
}) {
  if (layout === "list") {
    return (
      <Link
        href={`/books/${book._id}`}
        className="group grid grid-cols-[88px_1fr] gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-navy/20 hover:shadow-md sm:grid-cols-[112px_1fr_auto]"
      >
        <BookCover book={book} size="sm" className="w-full" />
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-navy-soft uppercase">
            {book.category}
          </p>
          <h3 className="mt-1 font-serif text-xl text-navy group-hover:text-navy-mid">
            {book.title}
          </h3>
          <p className="mt-1 text-sm text-muted">{book.author}</p>
          <p className="mt-2 line-clamp-2 hidden text-sm leading-6 text-muted sm:block">
            {book.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <AccessBadge access={book.access} />
            <RatingStars rating={book.rating} count={book.ratingsCount} compact />
          </div>
        </div>
        <div className="hidden flex-col items-end justify-between text-right sm:flex">
          <p className="text-sm text-muted">{book.year}</p>
          <span className="text-sm font-medium text-navy-mid">View details</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/books/${book._id}`}
      className={cn(
        "group flex flex-col rounded-2xl border border-line bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:border-navy/20 hover:shadow-lg",
      )}
    >
      <BookCover book={book} />
      <div className="flex flex-1 flex-col px-1 pt-3 pb-1">
        <p className="text-[11px] font-medium tracking-wide text-navy-soft uppercase">
          {book.category}
        </p>
        <h3 className="mt-1 line-clamp-2 font-serif text-lg leading-snug text-navy">
          {book.title}
        </h3>
        <p className="mt-1 text-sm text-muted">{book.author}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <AccessBadge access={book.access} />
          <RatingStars rating={book.rating} compact />
        </div>
      </div>
    </Link>
  );
}
