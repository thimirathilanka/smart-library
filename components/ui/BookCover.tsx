import type { Book } from "@/lib/types";
import { cn } from "@/lib/format";

type BookCoverProps = {
  book: Book;
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
  priority?: boolean;
};

const sizes = {
  sm: "aspect-[3/4] w-20",
  md: "aspect-[3/4] w-full",
  lg: "aspect-[3/4] w-56",
  hero: "aspect-[3/4] w-full max-w-[280px]",
};

export function BookCover({ book, className, size = "md", priority = false }: BookCoverProps) {
  const isHighPriority = priority || size === "hero";

  if (book.coverId) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-sm shadow-[0_18px_40px_-18px_rgba(11,31,58,0.55)]",
          sizes[size],
          className,
        )}
        style={{
          background: book.cover
            ? `linear-gradient(155deg, ${book.cover.from} 0%, ${book.cover.to} 72%)`
            : "#151917",
        }}
      >
        {/* Instant book backdrop placeholder: visible immediately before image finishes downloading */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col justify-between p-3 select-none pointer-events-none opacity-40"
        >
          <div className="absolute inset-y-0 left-0 w-[8px] bg-black/25" />
          <p className="line-clamp-2 font-serif text-xs font-semibold leading-snug text-white">
            {book.title}
          </p>
          <p className="text-[10px] tracking-wider text-white/70 uppercase">
            {book.author}
          </p>
        </div>

        <img
          src={`/api/books/${book._id}/cover`}
          alt={book.title || ""}
          loading={isHighPriority ? "eager" : "lazy"}
          decoding={isHighPriority ? "sync" : "async"}
          fetchPriority={isHighPriority ? "high" : "auto"}
          className="relative z-10 h-full w-full object-cover transition-opacity duration-300"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm shadow-[0_18px_40px_-18px_rgba(11,31,58,0.55)] transition-transform duration-300",
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(155deg, ${book.cover.from} 0%, ${book.cover.to} 72%)`,
      }}
    >
      <div className="absolute inset-y-0 left-0 w-[10px] bg-black/25" />
      <div
        className="absolute inset-y-0 left-[10px] w-px opacity-70"
        style={{ background: book.cover.accent }}
      />
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
      <div className="relative flex h-full flex-col justify-between p-4 pl-6 text-white">
        <div>
          <p className="font-serif text-[0.95rem] leading-snug tracking-tight sm:text-lg">
            {book.title}
          </p>
          {book.subtitle ? (
            <p className="mt-1 line-clamp-2 text-[10px] uppercase tracking-[0.14em] text-white/70">
              {book.subtitle}
            </p>
          ) : null}
        </div>
        <div>
          <div
            className="mb-2 h-px w-10"
            style={{ background: book.cover.accent }}
          />
          <p className="text-[11px] tracking-[0.16em] uppercase text-white/85">
            {book.author}
          </p>
        </div>
      </div>
    </div>
  );
}
