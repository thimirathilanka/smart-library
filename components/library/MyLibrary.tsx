"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, FileText } from "lucide-react";
import { BookCover } from "@/components/ui/BookCover";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/format";
import type { Book, LibraryItem, ResearchPaper, ResourceKind, UserLibrary } from "@/lib/types";

const tabs = [
  { id: "books", label: "Books", icon: BookOpen },
  { id: "papers", label: "Research papers", icon: FileText },
  { id: "history", label: "History", icon: Clock },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function MyLibrary({
  library,
  books,
  papers,
}: {
  library: UserLibrary;
  books: Book[];
  papers: ResearchPaper[];
}) {
  const [tab, setTab] = useState<TabId>("books");
  const kind: ResourceKind = tab === "papers" ? "paper" : "book";

  const favorites = useMemo(
    () => library.favorites.filter((item) => item.kind === kind),
    [library.favorites, kind],
  );
  const saved = useMemo(
    () => library.saved.filter((item) => item.kind === kind),
    [library.saved, kind],
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm",
                tab === item.id ? "bg-navy text-white" : "bg-white text-navy-mid ring-1 ring-line",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        {tab === "history" ? (
          <ItemList
            items={library.history}
            books={books}
            papers={papers}
            empty="No reading history yet."
          />
        ) : (
          <div className="flex flex-col gap-8">
            <LibrarySection
              title="Favorites"
              empty={kind === "book" ? "No favorite books yet." : "No favorite papers yet."}
              items={favorites}
              books={books}
              papers={papers}
            />
            <LibrarySection
              title="Saved"
              empty={kind === "book" ? "No saved books yet." : "No saved papers yet."}
              items={saved}
              books={books}
              papers={papers}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function LibrarySection({
  title,
  empty,
  items,
  books,
  papers,
}: {
  title: string;
  empty: string;
  items: LibraryItem[];
  books: Book[];
  papers: ResearchPaper[];
}) {
  return (
    <section>
      <h2 className="font-serif text-2xl text-navy">{title}</h2>
      <div className="mt-4">
        <ItemList items={items} books={books} papers={papers} empty={empty} />
      </div>
    </section>
  );
}

function ItemList({
  items,
  books,
  papers,
  empty,
}: {
  items: LibraryItem[];
  books: Book[];
  papers: ResearchPaper[];
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-muted">
        {empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <LibraryRow
          key={`${item.kind}-${item.resourceId}`}
          item={item}
          book={books.find((entry) => entry._id === item.resourceId)}
          paper={papers.find((entry) => entry._id === item.resourceId)}
        />
      ))}
    </div>
  );
}

function LibraryRow({
  item,
  book,
  paper,
}: {
  item: LibraryItem;
  book?: Book;
  paper?: ResearchPaper;
}) {
  const removed = !book && !paper;
  const href = book ? `/books/${book._id}` : paper ? `/research/${paper._id}` : null;
  const readBase = book ? `/books/${book._id}/read` : paper ? `/research/${paper._id}/read` : null;
  const readHref =
    readBase && item.bookmarkPage ? `${readBase}?page=${item.bookmarkPage}` : readBase;
  const progress = item.bookmarkPage && item.totalPages
    ? Math.min(100, Math.round((item.bookmarkPage / item.totalPages) * 100))
    : undefined;

  return (
    <div className="flex gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm">
      {book ? (
        <BookCover book={book} size="sm" className="w-16 shrink-0" />
      ) : (
        <div className="flex w-16 shrink-0 items-center justify-center rounded-sm bg-navy text-[10px] tracking-widest text-white uppercase">
          PDF
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] tracking-wide text-navy-soft uppercase">{item.kind}</p>
        {removed || !href ? (
          <p className="font-serif text-lg text-muted">Removed from the catalog</p>
        ) : (
          <Link href={href} className="font-serif text-lg text-navy hover:text-navy-mid">
            {book?.title ?? paper?.title}
          </Link>
        )}
        {removed ? null : (
          <p className="mt-1 text-sm text-muted">
            {book?.author ?? paper?.authors.join(", ")}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
          {item.savedAt ? <span>Saved {formatDate(item.savedAt)}</span> : null}
          {item.lastReadAt ? <span>Last read {formatDate(item.lastReadAt)}</span> : null}
          {!removed && item.bookmarkPage != null && item.totalPages && progress != null ? (
            <span className="inline-flex items-center gap-2">
              {progress}%
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full bg-navy"
                  style={{ width: `${progress}%` }}
                />
              </span>
              <span>Page {item.bookmarkPage} of {item.totalPages}</span>
            </span>
          ) : null}
        </div>
      </div>
      {readHref ? (
        <Link
          href={readHref}
          className="inline-flex self-center rounded-full bg-navy px-4 py-2 text-sm text-white hover:bg-navy-mid"
        >
          {item.bookmarkPage ? `Continue · p. ${item.bookmarkPage}` : "Continue"}
        </Link>
      ) : null}
    </div>
  );
}
