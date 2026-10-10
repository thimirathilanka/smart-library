"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { BookCard } from "@/components/books/BookCard";
import type { AccessType, Book } from "@/lib/types";
import { cn } from "@/lib/format";

export function BookCatalog({
  books,
  initialQuery = "",
}: {
  books: Book[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  const [category, setCategory] = useState("all");
  const [author, setAuthor] = useState("all");
  const [year, setYear] = useState("all");
  const [access, setAccess] = useState<"all" | AccessType>("all");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const authors = useMemo(
    () => Array.from(new Set(books.map((book) => book.author))).sort(),
    [books],
  );
  const categories = useMemo(
    () => Array.from(new Set(books.map((book) => book.category))).sort(),
    [books],
  );
  const years = useMemo(
    () => Array.from(new Set(books.map((book) => book.year))).sort((a, b) => b - a),
    [books],
  );

  const filtered = books.filter((book) => {
    const haystack = `${book.title} ${book.subtitle ?? ""} ${book.author} ${book.category}`.toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
    return (
      matchesQuery &&
      (category === "all" || book.category === category) &&
      (author === "all" || book.author === author) &&
      (year === "all" || book.year === Number(year)) &&
      (access === "all" || book.access === access)
    );
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-navy">Filters</h2>
        <label className="mt-4 block text-xs font-semibold tracking-wide text-muted uppercase">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title or author"
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none focus:border-navy-soft"
          />
        </label>
        <FilterSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={categories.map((item) => ({ value: item, label: item }))}
        />
        <FilterSelect
          label="Author"
          value={author}
          onChange={setAuthor}
          options={authors.map((item) => ({ value: item, label: item }))}
        />
        <FilterSelect
          label="Publication year"
          value={year}
          onChange={setYear}
          options={years.map((item) => ({ value: String(item), label: String(item) }))}
        />
        <FilterSelect
          label="Access"
          value={access}
          onChange={(value) => setAccess(value as "all" | AccessType)}
          options={[
            { value: "open", label: "Open Access" },
            { value: "members", label: "Members only" },
          ]}
        />
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setCategory("all");
            setAuthor("all");
            setYear("all");
            setAccess("all");
          }}
          className="mt-5 text-sm text-navy-mid hover:underline"
        >
          Clear filters
        </button>
      </aside>

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {filtered.length} {filtered.length === 1 ? "book" : "books"}
          </p>
          <div className="flex rounded-full border border-line bg-white p-1">
            <button
              type="button"
              onClick={() => setLayout("grid")}
              className={cn(
                "rounded-full p-2",
                layout === "grid" ? "bg-navy text-white" : "text-muted",
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setLayout("list")}
              className={cn(
                "rounded-full p-2",
                layout === "list" ? "bg-navy text-white" : "text-muted",
              )}
              aria-label="List view"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-muted">
            No books match these filters.
          </div>
        ) : layout === "grid" ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((book) => (
              <BookCard key={book._id} book={book} layout="list" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="mt-4 block text-xs font-semibold tracking-wide text-muted uppercase">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal text-ink outline-none focus:border-navy-soft"
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
