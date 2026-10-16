"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { BookCover } from "@/components/ui/BookCover";
import type { Book } from "@/lib/types";

export function FeaturedCarousel({ books }: { books: Book[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  function scroll(direction: -1 | 1) {
    scroller.current?.scrollBy({ left: direction * 280, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div className="absolute -top-12 right-0 flex gap-2">
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="rounded-sm border border-white/20 p-2 text-white/70 transition hover:border-white/50 hover:text-white"
          aria-label="Previous"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          className="rounded-sm border border-white/20 p-2 text-white/70 transition hover:border-white/50 hover:text-white"
          aria-label="Next"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-1 sm:gap-5"
      >
        {books.map((book) => (
          <Link
            key={book._id}
            href={`/books/${book._id}`}
            className="group w-[clamp(138px,18vw,190px)] shrink-0 snap-start"
          >
            <BookCover
              book={book}
              className="rounded-[2px] shadow-[0_16px_34px_-18px_rgba(0,0,0,.9)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_42px_-18px_rgba(0,0,0,.95)]"
            />
            <div className="pt-3">
              <p className="line-clamp-1 text-[10px] font-semibold tracking-[0.14em] text-[#e50914] uppercase">{book.category}</p>
              <h3 className="mt-1 line-clamp-2 min-h-11 font-serif text-base leading-snug text-white/90 transition group-hover:text-white">{book.title}</h3>
              <p className="mt-1 line-clamp-1 text-xs text-white/45">{book.author}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
