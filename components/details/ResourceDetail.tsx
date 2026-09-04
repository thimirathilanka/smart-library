import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Bookmark, Calendar, FileText, Hash, Languages, Quote } from "lucide-react";
import { BookCover } from "@/components/ui/BookCover";
import { AccessBadge } from "@/components/ui/AccessBadge";
import { RatingStars } from "@/components/ui/RatingStars";
import { CitationBlock } from "@/components/details/CitationBlock";
import { BookCard } from "@/components/books/BookCard";
import { PaperCard } from "@/components/papers/PaperCard";
import { formatNumber } from "@/lib/format";
import type { Book, ResearchPaper } from "@/lib/types";

export function BookDetail({
  book,
  related,
}: {
  book: Book;
  related: Book[];
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <div>
          <BookCover book={book} size="hero" className="mx-auto" />
          <Link
            href={`/books/${book._id}/read`}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-navy py-3 text-sm font-medium text-white hover:bg-navy-mid"
          >
            <BookOpen className="size-4" />
            Read online
          </Link>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">
            {book.category}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-navy">{book.title}</h1>
          {book.subtitle ? (
            <p className="mt-2 text-lg text-muted">{book.subtitle}</p>
          ) : null}
          <p className="mt-3 text-navy-mid">{book.author}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <AccessBadge access={book.access} />
            <RatingStars rating={book.rating} count={book.ratingsCount} />
          </div>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted">{book.description}</p>
          <dl className="mt-8 grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
            <Meta icon={<Hash className="size-4" />} label="ISBN" value={book.isbn} />
            <Meta icon={<Quote className="size-4" />} label="Publisher" value={book.publisher} />
            <Meta icon={<Calendar className="size-4" />} label="Year" value={String(book.year)} />
            <Meta icon={<FileText className="size-4" />} label="Pages" value={String(book.pages)} />
            <Meta icon={<Languages className="size-4" />} label="Language" value={book.language} />
            <Meta icon={<Bookmark className="size-4" />} label="Reads" value={formatNumber(book.reads)} />
          </dl>
          <div className="mt-6">
            <CitationBlock book={book} />
          </div>
        </div>
      </div>
      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-serif text-2xl text-navy">Related books</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <BookCard key={item._id} book={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function PaperDetail({
  paper,
  related,
}: {
  paper: ResearchPaper;
  related: ResearchPaper[];
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="border-b border-line bg-paper px-6 py-4 text-xs tracking-[0.18em] text-muted uppercase">
            In-browser preview
          </div>
          <div className="bg-[linear-gradient(#e8edf4_1px,transparent_1px)] bg-[size:100%_28px] px-8 py-10">
            <p className="text-center text-[11px] tracking-[0.25em] text-muted uppercase">
              {paper.venue}
            </p>
            <h2 className="mt-4 text-center font-serif text-2xl leading-snug text-navy">
              {paper.title}
            </h2>
            <p className="mt-3 text-center text-sm text-navy-mid">{paper.authors.join(", ")}</p>
            <p className="mt-8 font-serif text-sm leading-7 text-ink/80">
              {paper.abstract}
            </p>
          </div>
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            <AccessBadge access={paper.access} />
            <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs text-navy-mid ring-1 ring-line">
              {paper.field}
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl text-navy">{paper.title}</h1>
          <p className="mt-2 text-navy-mid">{paper.authors.join(" · ")}</p>
          <LinkCta href={`/research/${paper._id}/read`} />
          <section className="mt-6">
            <h2 className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
              Abstract
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">{paper.abstract}</p>
          </section>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {paper.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-paper px-2.5 py-1 text-[11px] text-navy-mid ring-1 ring-line">
                {keyword}
              </span>
            ))}
          </div>
          <dl className="mt-6 grid gap-3 rounded-2xl border border-line bg-white p-5">
            <Meta label="Venue" value={`${paper.venue} (${paper.venueType})`} />
            <Meta label="Published" value={paper.publishedAt} />
            <Meta label="Pages" value={paper.pages} />
            <Meta label="DOI" value={paper.doi} />
            <Meta label="Citations" value={formatNumber(paper.citations)} />
          </dl>
          <div className="mt-6">
            <CitationBlock paper={paper} />
          </div>
        </div>
      </div>
      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-navy">Related papers</h2>
          <div className="mt-6 flex flex-col gap-4">
            {related.map((item) => (
              <PaperCard key={item._id} paper={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function LinkCta({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="mt-5 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-mid"
    >
      <FileText className="size-4" />
      Read online
    </Link>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon ? <span className="mt-0.5 text-navy-soft">{icon}</span> : null}
      <div>
        <dt className="text-[11px] tracking-wide text-muted uppercase">{label}</dt>
        <dd className="text-sm text-navy">{value}</dd>
      </div>
    </div>
  );
}
