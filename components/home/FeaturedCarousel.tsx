"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookCard } from "@/components/books/BookCard";
import type { Book } from "@/lib/types";

export function FeaturedCarousel({ books }: { books: Book[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  function scroll(direction: -1 | 1) {
    scroller.current?.scrollBy({ left: direction * 280, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div className="mb-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="rounded-full border border-line bg-white p-2 text-navy hover:bg-paper"
          aria-label="Previous"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          className="rounded-full border border-line bg-white p-2 text-navy hover:bg-paper"
          aria-label="Next"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
      >
        {books.map((book) => (
          <div key={book._id} className="w-56 shrink-0 snap-start sm:w-60">
            <BookCard book={book} />
          </div>
        ))}
      </div>
    </div>
  );
}
