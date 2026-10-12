import type { ReactNode } from "react";
import { BookOpen, Bookmark, Calendar, FileText, Hash, Languages, LockKeyhole, Quote } from "lucide-react";
import { BookCover } from "@/components/ui/BookCover";
import { AccessBadge } from "@/components/ui/AccessBadge";
import { RatingStars } from "@/components/ui/RatingStars";
import { CitationBlock } from "@/components/details/CitationBlock";
import { BookCard } from "@/components/books/BookCard";
import { PaperCard } from "@/components/papers/PaperCard";
import { LibraryActions } from "@/components/library/LibraryActions";
import { ReadAccessLink } from "@/components/details/ReadAccessLink";
import { formatNumber } from "@/lib/format";
import type { Book, ResearchPaper } from "@/lib/types";

export function BookDetail({
  book,
  related,
  signedIn = false,
  hasMembership = false,
  promptLocked = false,
  saved = false,
  favorited = false,
}: {
  book: Book;
  related: Book[];
  signedIn?: boolean;
  hasMembership?: boolean;
  promptLocked?: boolean;
  saved?: boolean;
  favorited?: boolean;
}) {
  const membersOnly = book.access === "members" && !hasMembership;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <div>
          <BookCover book={book} size="hero" className="mx-auto" />
          <ReadAccessLink
            href={`/books/${book._id}/read`}
            requiresMembership={book.access === "members"}
            hasMembership={hasMembership}
            signedIn={signedIn}
            openOnMount={promptLocked}
            preview={{
              kicker: `${book.publisher} · ${book.year}`,
              title: book.title,
              byline: book.author,
              paragraphs: [
                { text: book.description },
                {
                  text: `This opening chapter sets the terms of the inquiry: what is at stake, which methods will carry the argument, and how later sections will return to evidence. ${book.author} writes with care for both specialists and readers coming to ${book.title.toLowerCase()} for the first time.`,
                },
              ],
            }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-navy py-3 text-sm font-medium text-white hover:bg-navy-mid"
          >
            {membersOnly ? <LockKeyhole className="size-4" /> : <BookOpen className="size-4" />}
            {membersOnly ? "Members only" : "Read online"}
          </ReadAccessLink>
          <LibraryActions
            resourceId={book._id}
            kind="book"
            saved={saved}
            favorited={favorited}
            signedIn={signedIn}
          />
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
          {book.aiSummary ? (
            <section className="mt-6 max-w-3xl">
              <h2 className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">AI summary</h2>
              <p className="mt-2 text-base leading-8 whitespace-pre-line text-muted">{book.aiSummary}</p>
            </section>
          ) : null}
          <dl className="mt-8 grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
            {book.isbn ? <Meta icon={<Hash className="size-4" />} label="ISBN" value={book.isbn} /> : null}
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
  signedIn = false,
  hasMembership = false,
  promptLocked = false,
  saved = false,
  favorited = false,
}: {
  paper: ResearchPaper;
  related: ResearchPaper[];
  signedIn?: boolean;
  hasMembership?: boolean;
  promptLocked?: boolean;
  saved?: boolean;
  favorited?: boolean;
}) {
  const membersOnly = paper.access === "members" && !hasMembership;
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
          <ReadAccessLink
            href={`/research/${paper._id}/read`}
            requiresMembership={paper.access === "members"}
            hasMembership={hasMembership}
            signedIn={signedIn}
            openOnMount={promptLocked}
            preview={{
              kicker: `${paper.venue} · ${paper.year}`,
              title: paper.title,
              byline: paper.authors.join(", "),
              paragraphs: [
                { label: "Abstract.", text: paper.abstract },
                {
                  label: "1. Introduction.",
                  text: `The authors situate the problem in ${paper.field.toLowerCase()} and outline the contribution that follows. Keywords: ${paper.keywords.join(", ")}.`,
                },
                {
                  label: "2. Contribution.",
                  text: paper.doi
                    ? `Findings are reported under DOI ${paper.doi} and indexed with the venue record for ${paper.venue}.`
                    : `Findings are indexed with the venue record for ${paper.venue}.`,
                },
              ],
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-mid"
          >
            {membersOnly ? <LockKeyhole className="size-4" /> : <FileText className="size-4" />}
            {membersOnly ? "Members only" : "Read online"}
          </ReadAccessLink>
          <LibraryActions
            resourceId={paper._id}
            kind="paper"
            saved={saved}
            favorited={favorited}
            signedIn={signedIn}
          />
          <section className="mt-6">
            <h2 className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
              Abstract
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">{paper.abstract}</p>
          </section>
          {paper.aiSummary ? (
            <section className="mt-6">
              <h2 className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">AI summary</h2>
              <p className="mt-2 text-sm leading-7 whitespace-pre-line text-muted">{paper.aiSummary}</p>
            </section>
          ) : null}
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
            {paper.doi ? <Meta label="DOI" value={paper.doi} /> : null}
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
