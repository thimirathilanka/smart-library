"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Filter,
  Flame,
  Lightbulb,
  Loader2,
  Lock,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { executeSemanticSearchAction } from "@/app/actions/semantic-search";
import type { SemanticSearchResult } from "@/lib/ai/semantic-search";
import type { AccessType } from "@/lib/types";

const EXAMPLE_QUERIES = [
  "how AI detects plant diseases using leaf images",
  "zero-shot image classification and vision-language models",
  "quantum algorithms for cryptography and security",
  "attention mechanisms in deep learning architectures",
  "reinforcement learning for autonomous decision making",
];

export function SemanticFinder({
  initialResults = [],
  categories = [],
  fields = [],
  years = [],
}: {
  initialResults?: SemanticSearchResult[];
  categories: string[];
  fields: string[];
  years: number[];
}) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [results, setResults] = useState<SemanticSearchResult[]>(initialResults);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Filters
  const [kindFilter, setKindFilter] = useState<"all" | "book" | "paper">("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState<"all" | AccessType>("all");

  const combinedTopics = Array.from(new Set([...categories, ...fields])).sort();

  function runSearch(searchQuery: string) {
    const q = searchQuery.trim();
    if (!q) return;

    setError("");
    setActiveQuery(q);

    startTransition(async () => {
      const response = await executeSemanticSearchAction(q, {
        kind: kindFilter,
        categoryOrField: topicFilter,
        year: yearFilter,
        access: accessFilter,
      });

      if (!response.success) {
        setError(response.error ?? "Failed to perform search.");
        return;
      }

      setResults(response.results ?? []);
    });
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  function handleChipClick(example: string) {
    setQuery(example);
    runSearch(example);
  }

  function clearSearch() {
    setQuery("");
    setActiveQuery("");
    setResults(initialResults);
    setError("");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <Sparkles className="size-3.5 text-emerald-400" />
          <span>Vector Similarity & AI Embeddings</span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-normal tracking-tight text-white sm:text-4xl">
          Discover your thoughts 
        </h1>
        <p className="mt-3 text-sm text-white/60 sm:text-base">
          Search by <em>meaning, concept, or real-world problem</em> not just exact keywords.
          Find relevant books and research papers even when the exact terms don&apos;t match the title.
        </p>
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleFormSubmit} className="mx-auto mt-8 max-w-3xl">
        <div className="relative flex items-center rounded-2xl border border-white/15 bg-white/5 p-2 shadow-2xl backdrop-blur-md transition-all focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20">
          <Search className="ml-3 size-5 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. how AI detects plant diseases using leaf images…"
            className="w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none sm:text-base"
          />
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="mr-2 rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : null}
          <button
            type="submit"
            disabled={pending || !query.trim()}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Searching…</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Example Prompt Chips */}
      <div className="mx-auto mt-4 max-w-3xl">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1 text-xs text-white/40">
            <Lightbulb className="size-3" />
            Try searching:
          </span>
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleChipClick(example)}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
            >
              &ldquo;{example}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mt-10 rounded-xl border border-white/10 bg-[#161a18] p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Document Type Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => {
                setKindFilter("all");
                if (activeQuery) runSearch(activeQuery);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                kindFilter === "all"
                  ? "bg-emerald-600 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => {
                setKindFilter("book");
                if (activeQuery) runSearch(activeQuery);
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                kindFilter === "book"
                  ? "bg-emerald-600 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <BookOpen className="size-3.5" />
              Books
            </button>
            <button
              type="button"
              onClick={() => {
                setKindFilter("paper");
                if (activeQuery) runSearch(activeQuery);
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                kindFilter === "paper"
                  ? "bg-emerald-600 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <FileText className="size-3.5" />
              Research Papers
            </button>
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Filter className="size-3.5" />
              <span>Filters:</span>
            </div>

            {/* Topic Filter */}
            <select
              value={topicFilter}
              onChange={(e) => {
                setTopicFilter(e.target.value);
                if (activeQuery) runSearch(activeQuery);
              }}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            >
              <option value="all">All Topics & Categories</option>
              {combinedTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                if (activeQuery) runSearch(activeQuery);
              }}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            >
              <option value="all">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* Access Filter */}
            <select
              value={accessFilter}
              onChange={(e) => {
                setAccessFilter(e.target.value as "all" | AccessType);
                if (activeQuery) runSearch(activeQuery);
              }}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            >
              <option value="all">All Access</option>
              <option value="open">Open Access</option>
              <option value="members">Members Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {/* Search results status */}
      <div className="mt-8 flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-base font-semibold text-white">
          {activeQuery ? (
            <span>
              Results for <span className="text-emerald-400">&ldquo;{activeQuery}&rdquo;</span>
            </span>
          ) : (
            "Recommended Library Resources"
          )}
        </h2>
        <span className="text-xs text-white/50">
          {results.length} {results.length === 1 ? "resource" : "resources"} found
        </span>
      </div>

      {/* Loading state skeleton */}
      {pending ? (
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <div className="h-5 w-1/3 rounded bg-white/10" />
              <div className="mt-3 h-4 w-1/4 rounded bg-white/5" />
              <div className="mt-4 h-16 rounded bg-emerald-500/5" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        /* Empty State */
        <div className="mt-12 rounded-2xl border border-white/10 bg-[#161a18] p-12 text-center">
          <Sparkles className="mx-auto size-12 text-emerald-400/40" />
          <h3 className="mt-4 font-serif text-lg text-white">No semantic matches found</h3>
          <p className="mt-1 text-sm text-white/50">
            Try phrasing your research query differently or remove some filters.
          </p>
        </div>
      ) : (
        /* Results List */
        <div className="mt-6 space-y-5">
          {results.map((item) => (
            <article
              key={`${item.kind}-${item._id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#151917] p-5 shadow-sm hover:border-emerald-500/40 hover:bg-[#1a201c] transition-all"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-2">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Kind badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${
                        item.kind === "book"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}
                    >
                      {item.kind === "book" ? (
                        <>
                          <BookOpen className="size-3" />
                          Book
                        </>
                      ) : (
                        <>
                          <FileText className="size-3" />
                          Research Paper
                        </>
                      )}
                    </span>

                    {/* Topic badge */}
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-white/70">
                      {item.categoryOrField}
                    </span>

                    {/* Year badge */}
                    <span className="text-white/40">• {item.year}</span>

                    {/* Access badge */}
                    {item.access === "members" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-400 border border-amber-500/20">
                        <Lock className="size-3" />
                        Members Only
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-400 border border-emerald-500/20">
                        <Check className="size-3" />
                        Open Access
                      </span>
                    )}

                    {/* Semantic Match Percentage Badge */}
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 shadow-sm">
                      <Flame className="size-3 text-emerald-400" />
                      {item.similarityScore}% Match
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-xl font-medium text-white group-hover:text-emerald-300 transition-colors">
                    <Link
                      href={item.kind === "book" ? `/books/${item._id}` : `/research/${item._id}`}
                    >
                      {item.title}
                    </Link>
                  </h3>

                  {/* Authors */}
                  <p className="text-xs text-white/60">
                    By {item.authors.join(", ")}
                  </p>

                  {/* "Why this matches" Callout */}
                  <div className="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3 text-xs text-emerald-200 backdrop-blur-sm">
                    <div className="flex items-start gap-2">
                      <Sparkles className="size-3.5 shrink-0 text-emerald-400 mt-0.5" />
                      <div>
                        <span className="font-semibold text-emerald-300">Why this matches: </span>
                        <span>{item.matchReason}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description / Abstract Snippet */}
                  <p className="mt-2 text-xs leading-relaxed text-white/60 line-clamp-2">
                    {item.descriptionOrAbstract}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[11px] text-white/40">
                  {item.reads} {item.reads === 1 ? "reader" : "readers"}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={item.kind === "book" ? `/books/${item._id}` : `/research/${item._id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-colors"
                  >
                    <span>Read Details</span>
                    <ChevronRight className="size-3.5" />
                  </Link>

                  {item.fileId ? (
                    <Link
                      href={item.kind === "book" ? `/books/${item._id}/read` : `/research/${item._id}/read`}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
                    >
                      <span>Read Online</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
