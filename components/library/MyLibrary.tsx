"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Heart } from "lucide-react";
import { books, papers, userLibrary } from "@/lib/mock-data";
import { BookCover } from "@/components/ui/BookCover";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/format";
import type { LibraryItem } from "@/lib/types";

const tabs = [
  { id: "saved", label: "Saved papers", icon: BookOpen },
  { id: "history", label: "Reading history", icon: Clock },
  { id: "favorites", label: "Favorites", icon: Heart },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function MyLibrary() {
  const [tab, setTab] = useState<TabId>("saved");

  const items = useMemo(() => {
    if (tab === "saved") return userLibrary.saved;
    if (tab === "history") return userLibrary.history;
    return userLibrary.favorites;
  }, [tab]);

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
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-muted">
            Nothing here yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <LibraryRow key={`${item.kind}-${item.resourceId}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryRow({ item }: { item: LibraryItem }) {
  const book = item.kind === "book" ? books.find((entry) => entry._id === item.resourceId) : undefined;
  const paper = item.kind === "paper" ? papers.find((entry) => entry._id === item.resourceId) : undefined;
  const href = book ? `/books/${book._id}` : paper ? `/research/${paper._id}` : "#";
  const readHref = book ? `/books/${book._id}/read` : paper ? `/research/${paper._id}/read` : "#";

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
        <Link href={href} className="font-serif text-lg text-navy hover:text-navy-mid">
          {book?.title ?? paper?.title}
        </Link>
        <p className="mt-1 text-sm text-muted">
          {book?.author ?? paper?.authors.join(", ")}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
          {item.savedAt ? <span>Saved {formatDate(item.savedAt)}</span> : null}
          {item.lastReadAt ? <span>Last read {formatDate(item.lastReadAt)}</span> : null}
          {item.progress != null ? (
            <span className="inline-flex items-center gap-2">
              {item.progress}%
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full bg-navy"
                  style={{ width: `${item.progress}%` }}
                />
              </span>
            </span>
          ) : null}
        </div>
      </div>
      <Link
        href={readHref}
        className="hidden self-center rounded-full bg-navy px-4 py-2 text-sm text-white hover:bg-navy-mid sm:inline-flex"
      >
        Continue
      </Link>
    </div>
  );
}
