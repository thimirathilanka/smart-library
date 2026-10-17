"use client";

import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { BookCover } from "@/components/ui/BookCover";
import { PaperCover } from "@/components/ui/PaperCover";
import type { ContinueReadingItem } from "@/lib/types";

function readHref(item: ContinueReadingItem) {
  const base =
    item.kind === "book" && item.book
      ? `/books/${item.book._id}/read`
      : item.kind === "paper" && item.paper
        ? `/research/${item.paper._id}/read`
        : null;
  if (!base) return null;
  return item.bookmarkPage ? `${base}?page=${item.bookmarkPage}` : base;
}

function progressFor(item: ContinueReadingItem) {
  if (item.progress != null) return Math.min(100, item.progress);
  if (item.bookmarkPage != null && item.totalPages) {
    return Math.min(100, Math.round((item.bookmarkPage / item.totalPages) * 100));
  }
  return undefined;
}

export function ContinueReading({ items }: { items: ContinueReadingItem[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  function scroll(direction: -1 | 1) {
    scroller.current?.scrollBy({ left: direction * 280, behavior: "smooth" });
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pt-12 pb-2 sm:px-8 lg:px-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-[#e50914] uppercase">
            Pick up where you left off
          </p>
          <h2 className="font-serif text-2xl text-white sm:text-3xl">Continue reading</h2>
        </div>
        <Link
          href="/library"
          className="group mb-1 inline-flex shrink-0 items-center gap-2 text-xs font-medium text-white/55 transition hover:text-white sm:text-sm"
        >
          My library <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="relative">
        <div className="mb-3 flex justify-end gap-2">
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
          {items.map((item) => {
            const href = readHref(item);
            if (!href) return null;
            const title = item.book?.title ?? item.paper?.title ?? "Untitled";
            const byline = item.book?.author ?? item.paper?.authors.join(" · ") ?? "";
            const label = item.kind === "book" ? item.book?.category ?? "Book" : item.paper?.field ?? "Research";
            const progress = progressFor(item);

            return (
              <Link
                key={`${item.kind}-${item.resourceId}`}
                href={href}
                className="group w-[clamp(138px,18vw,190px)] shrink-0 snap-start"
              >
                {item.book ? (
                  <BookCover
                    book={item.book}
                    className="rounded-[2px] shadow-[0_16px_34px_-18px_rgba(0,0,0,.9)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_42px_-18px_rgba(0,0,0,.95)]"
                  />
                ) : item.paper ? (
                  <PaperCover
                    paper={item.paper}
                    className="rounded-[2px] shadow-[0_16px_34px_-18px_rgba(0,0,0,.9)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_42px_-18px_rgba(0,0,0,.95)]"
                  />
                ) : null}
                <div className="pt-3">
                  <p className="line-clamp-1 text-[10px] font-semibold tracking-[0.14em] text-[#e50914] uppercase">
                    {label}
                  </p>
                  <h3 className="mt-1 line-clamp-2 min-h-11 font-serif text-base leading-snug text-white/90 transition group-hover:text-white">
                    {title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-white/45">{byline}</p>
                  {progress != null ? (
                    <div className="mt-2.5">
                      <div className="h-1 overflow-hidden rounded-full bg-white/15">
                        <div
                          className="h-full rounded-full bg-[#e50914]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] tracking-wide text-white/40">
                        {item.bookmarkPage != null && item.totalPages
                          ? `Page ${item.bookmarkPage} of ${item.totalPages}`
                          : `${progress}%`}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2.5 text-[10px] tracking-wide text-white/40">Continue</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
