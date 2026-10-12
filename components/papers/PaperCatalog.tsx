"use client";

import { useEffect, useMemo, useState } from "react";
import { PaperCard } from "@/components/papers/PaperCard";
import type { ResearchPaper } from "@/lib/types";

export function PaperCatalog({
  papers,
  initialQuery = "",
}: {
  papers: ResearchPaper[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  const [field, setField] = useState("all");
  const [author, setAuthor] = useState("all");
  const [year, setYear] = useState("all");
  const [keyword, setKeyword] = useState("all");

  const authors = useMemo(
    () => Array.from(new Set(papers.flatMap((paper) => paper.authors))).sort(),
    [papers],
  );
  const fields = useMemo(
    () => Array.from(new Set(papers.map((paper) => paper.field))).sort(),
    [papers],
  );
  const years = useMemo(
    () => Array.from(new Set(papers.map((paper) => paper.year))).sort((a, b) => b - a),
    [papers],
  );
  const keywords = useMemo(
    () => Array.from(new Set(papers.flatMap((paper) => paper.keywords))).sort(),
    [papers],
  );

  const filtered = papers.filter((paper) => {
    const haystack = `${paper.title} ${paper.authors.join(" ")} ${paper.keywords.join(" ")} ${paper.abstract} ${paper.aiSummary ?? ""}`.toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
    return (
      matchesQuery &&
      (field === "all" || paper.field === field) &&
      (author === "all" || paper.authors.includes(author)) &&
      (year === "all" || paper.year === Number(year)) &&
      (keyword === "all" || paper.keywords.includes(keyword))
    );
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-navy">Advanced search</h2>
        <label className="mt-4 block text-xs font-semibold tracking-wide text-muted uppercase">
          Keywords &amp; title
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search papers"
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none focus:border-navy-soft"
          />
        </label>
        <Select
          label="Research field"
          value={field}
          onChange={setField}
          options={fields.map((item) => ({ value: item, label: item }))}
        />
        <Select
          label="Author"
          value={author}
          onChange={setAuthor}
          options={authors.map((item) => ({ value: item, label: item }))}
        />
        <Select
          label="Year"
          value={year}
          onChange={setYear}
          options={years.map((item) => ({ value: String(item), label: String(item) }))}
        />
        <Select
          label="Keyword"
          value={keyword}
          onChange={setKeyword}
          options={keywords.map((item) => ({ value: item, label: item }))}
        />
        <button
          type="button"
          className="mt-5 text-sm text-navy-mid hover:underline"
          onClick={() => {
            setQuery("");
            setField("all");
            setAuthor("all");
            setYear("all");
            setKeyword("all");
          }}
        >
          Clear search
        </button>
      </aside>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? "paper" : "papers"}
        </p>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-muted">
            {papers.length === 0 ? "No papers in the catalog yet." : "No papers match this search."}
          </div>
        ) : (
          filtered.map((paper) => <PaperCard key={paper._id} paper={paper} />)
        )}
      </div>
    </div>
  );
}

function Select({
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
