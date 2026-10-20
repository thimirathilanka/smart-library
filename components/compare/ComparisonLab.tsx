"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  Lightbulb,
  Loader2,
  MinusCircle,
  Plus,
  Search,
  Sparkles,
  X,
  XCircle,
  Telescope,
} from "lucide-react";
import { compareResourcesAction } from "@/app/actions/compare";
import type { ComparisonResult, CompareResource, ComparisonPair } from "@/lib/ai/compare";
import type { ResourceKind } from "@/lib/types";
import { cn } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchHit = {
  _id: string;
  kind: ResourceKind;
  title: string;
  authors: string[];
  year: number;
  categoryOrField: string;
};

type SelectedItem = {
  id: string;
  kind: ResourceKind;
  title: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ComparisonLab({
  initialBooks = [],
  initialPapers = [],
}: {
  initialBooks?: SearchHit[];
  initialPapers?: SearchHit[];
}) {
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "book" | "paper">("all");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const allItems: SearchHit[] = [
    ...initialBooks.map((b) => ({ ...b, kind: "book" as ResourceKind })),
    ...initialPapers.map((p) => ({ ...p, kind: "paper" as ResourceKind })),
  ];

  const filtered = allItems.filter((item) => {
    if (kindFilter !== "all" && item.kind !== kindFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.authors.some((a) => a.toLowerCase().includes(q)) ||
      item.categoryOrField.toLowerCase().includes(q)
    );
  });

  function toggleItem(hit: SearchHit) {
    const already = selected.find((s) => s.id === hit._id);
    if (already) {
      setSelected(selected.filter((s) => s.id !== hit._id));
    } else {
      if (selected.length >= 4) return;
      setSelected([...selected, { id: hit._id, kind: hit.kind, title: hit.title }]);
    }
  }

  function removeSelected(id: string) {
    setSelected(selected.filter((s) => s.id !== id));
  }

  function runComparison() {
    if (selected.length < 2) return;
    setError("");
    setResult(null);
    startTransition(async () => {
      const res = await compareResourcesAction({
        items: selected.map(({ id, kind }) => ({ id, kind })),
      });
      if (res.ok) {
        setResult(res.data);
      } else {
        setError(res.error);
      }
    });
  }

  const isSelected = (id: string) => selected.some((s) => s.id === id);

  return (
    <div className="min-h-screen bg-paper">
      {/* ── Header ── */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-navy text-white">
              <ArrowLeftRight className="size-5" />
            </span>
            <div>
              <h1 className="font-serif text-2xl text-navy">Comparison Lab</h1>
              <p className="mt-0.5 text-sm text-muted">
                Select 2&ndash;4 books or research papers. AI reads their content and compares
                core ideas, arguments, and what to explore next.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ── Left: catalog picker ── */}
          <section>
            <div className="mb-4 flex flex-wrap gap-3">
              <label className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, or topic…"
                  className="w-full rounded-full border border-line bg-white py-2 pr-4 pl-10 text-sm outline-none transition focus:border-navy-soft focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <div className="flex gap-2">
                {(["all", "book", "paper"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKindFilter(k)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      kindFilter === k
                        ? "bg-navy text-white"
                        : "border border-line bg-white text-navy-mid hover:bg-paper",
                    )}
                  >
                    {k === "all" ? "All" : k === "book" ? "Books" : "Papers"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <p className="py-12 text-center text-sm text-muted">No results found.</p>
              )}
              {filtered.slice(0, 80).map((item) => {
                const sel = isSelected(item._id);
                const maxed = selected.length >= 4 && !sel;
                return (
                  <button
                    key={item._id + item.kind}
                    type="button"
                    disabled={maxed}
                    onClick={() => toggleItem(item)}
                    className={cn(
                      "w-full text-left rounded-2xl border p-4 transition",
                      sel
                        ? "border-navy bg-navy/5 ring-1 ring-navy/20"
                        : maxed
                          ? "border-line bg-white opacity-40 cursor-not-allowed"
                          : "border-line bg-white hover:border-navy/30 hover:shadow-sm",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition",
                          sel ? "border-navy bg-navy text-white" : "border-line",
                        )}
                      >
                        {sel && <CheckCircle2 className="size-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {item.kind === "book" ? (
                            <BookOpen className="size-3.5 shrink-0 text-navy-soft" />
                          ) : (
                            <FileText className="size-3.5 shrink-0 text-navy-soft" />
                          )}
                          <span className="text-[11px] font-semibold tracking-wide text-navy-soft uppercase">
                            {item.kind === "book" ? "Book" : "Paper"} &middot; {item.categoryOrField}
                          </span>
                        </div>
                        <p className="mt-1 font-serif text-base leading-snug text-navy line-clamp-2">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {item.authors.slice(0, 3).join(" · ")} &middot; {item.year}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Right: selection tray ── */}
          <aside className="space-y-5">
            <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-semibold text-navy">
                <Plus className="size-4 text-muted" />
                Selected ({selected.length}/4)
              </h2>
              <p className="mt-1 text-xs text-muted">
                {selected.length < 2
                  ? `Select ${2 - selected.length} more to compare`
                  : "Ready! Hit Compare below."}
              </p>

              <div className="mt-4 space-y-2">
                {selected.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted">Nothing selected yet.</p>
                )}
                {selected.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex items-start gap-2 rounded-xl bg-paper px-3 py-2.5"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <p className="flex-1 text-sm leading-snug text-navy line-clamp-2">{s.title}</p>
                    <button
                      type="button"
                      onClick={() => removeSelected(s.id)}
                      className="text-muted hover:text-navy transition"
                      aria-label="Remove"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={selected.length < 2 || pending}
                onClick={runComparison}
                className={cn(
                  "mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition",
                  selected.length >= 2 && !pending
                    ? "bg-navy text-white hover:bg-navy-mid"
                    : "bg-navy/20 text-navy/40 cursor-not-allowed",
                )}
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analysing content&hellip;
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Compare with AI
                  </>
                )}
              </button>
            </div>

            {!result && !pending && (
              <div className="rounded-3xl border border-line bg-white p-5">
                <h3 className="text-sm font-semibold text-navy">What AI compares</h3>
                <ul className="mt-3 space-y-2 text-xs text-muted">
                  <li className="flex gap-2"><Lightbulb className="size-3.5 shrink-0 mt-0.5 text-amber-500" /> Core idea of each resource</li>
                  <li className="flex gap-2"><CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-emerald-500" /> Shared themes and methods</li>
                  <li className="flex gap-2"><MinusCircle className="size-3.5 shrink-0 mt-0.5 text-red-400" /> Key intellectual differences</li>
                  <li className="flex gap-2"><Telescope className="size-3.5 shrink-0 mt-0.5 text-violet-500" /> Topics to explore further</li>
                </ul>
              </div>
            )}
          </aside>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <XCircle className="size-5 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {pending && (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-muted text-center animate-pulse">
              AI is reading the content and building your comparison&hellip;
            </p>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-white/70 border border-line animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Results ── */}
        {result && !pending && (
          <div className="mt-10 space-y-10">
            {/* Resource overview row */}
            <div>
              <h2 className="font-serif text-xl text-navy mb-4">Resources Compared</h2>
              <div
                className={cn(
                  "grid gap-4",
                  result.resources.length === 2
                    ? "sm:grid-cols-2"
                    : result.resources.length === 3
                      ? "sm:grid-cols-3"
                      : "sm:grid-cols-2 lg:grid-cols-4",
                )}
              >
                {result.resources.map((r, idx) => (
                  <ResourceCard key={r._id} resource={r} label={String.fromCharCode(65 + idx)} />
                ))}
              </div>
            </div>

            {/* Pair comparisons */}
            {result.pairs.map((pair, idx) => (
              <PairComparison
                key={idx}
                pair={pair}
                labelA={String.fromCharCode(
                  65 + result.resources.findIndex((r) => r._id === pair.resourceA._id),
                )}
                labelB={String.fromCharCode(
                  65 + result.resources.findIndex((r) => r._id === pair.resourceB._id),
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Resource overview card ───────────────────────────────────────────────────

function ResourceCard({ resource, label }: { resource: CompareResource; label: string }) {
  const href =
    resource.kind === "book" ? `/books/${resource._id}` : `/research/${resource._id}`;
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex size-7 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
          {label}
        </span>
        <span className="text-[11px] font-semibold tracking-wide text-navy-soft uppercase">
          {resource.kind === "book" ? "Book" : "Paper"}
        </span>
      </div>
      <p className="font-serif text-base leading-snug text-navy line-clamp-3">{resource.title}</p>
      <p className="mt-1.5 text-xs text-muted line-clamp-1">
        {resource.authors.slice(0, 2).join(" · ")} &middot; {resource.year}
      </p>
      <p className="mt-1 text-[11px] font-medium tracking-wide text-navy-soft uppercase">
        {resource.categoryOrField}
      </p>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline"
      >
        View details <ChevronRight className="size-3" />
      </Link>
    </div>
  );
}

// ─── Pair comparison card ─────────────────────────────────────────────────────

function PairComparison({
  pair,
  labelA,
  labelB,
}: {
  pair: ComparisonPair;
  labelA: string;
  labelB: string;
}) {
  const pct = pair.similarityScore;
  const barColor =
    pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-navy/30";

  return (
    <div className="rounded-3xl border border-line bg-white shadow-sm overflow-hidden">

      {/* ── Header: labels + similarity ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-paper/60 px-6 py-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
            {labelA}
          </span>
          <ArrowLeftRight className="size-4 shrink-0 text-muted" />
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
            {labelB}
          </span>
          <span className="text-sm font-semibold text-navy truncate ml-1">
            {pair.resourceA.title.length > 30
              ? pair.resourceA.title.slice(0, 28) + "…"
              : pair.resourceA.title}{" "}
            <span className="font-normal text-muted">vs</span>{" "}
            {pair.resourceB.title.length > 30
              ? pair.resourceB.title.slice(0, 28) + "…"
              : pair.resourceB.title}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted hidden sm:block">Content similarity</span>
          <div className="w-24 h-2 rounded-full bg-line overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold text-navy">{pct}%</span>
        </div>
      </div>

      {/* ── Core ideas ── */}
      <div className="grid sm:grid-cols-2 border-b border-line">
        <div className="border-b sm:border-b-0 sm:border-r border-line p-6">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">
            <Lightbulb className="size-3.5" />
            Core idea of {labelA}
          </h3>
          <p className="text-sm leading-relaxed text-navy-mid">{pair.coreIdeaA}</p>
        </div>
        <div className="p-6">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">
            <Lightbulb className="size-3.5" />
            Core idea of {labelB}
          </h3>
          <p className="text-sm leading-relaxed text-navy-mid">{pair.coreIdeaB}</p>
        </div>
      </div>

      {/* ── Agreements + Differences ── */}
      <div className="grid sm:grid-cols-2 border-b border-line">
        <div className="border-b sm:border-b-0 sm:border-r border-line p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-700 mb-4">
            <CheckCircle2 className="size-4" />
            Shared Themes &amp; Methods
          </h3>
          {pair.agreements.length === 0 ? (
            <p className="text-sm text-muted">No clear shared themes detected.</p>
          ) : (
            <ul className="space-y-3">
              {pair.agreements.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-navy-mid">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-4">
            <MinusCircle className="size-4" />
            Key Differences
          </h3>
          {pair.differences.length === 0 ? (
            <p className="text-sm text-muted">No clear distinctions detected.</p>
          ) : (
            <ul className="space-y-3">
              {pair.differences.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-navy-mid">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Further study ── */}
      {pair.furtherStudy.length > 0 && (
        <div className="border-b border-line px-6 py-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-violet-700 mb-4">
            <Telescope className="size-4" />
            Suggested Further Reading
          </h3>
          <div className="flex flex-wrap gap-2">
            {pair.furtherStudy.map((topic, i) => (
              <span
                key={i}
                className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 ring-1 ring-violet-200"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Overall insight ── */}
      <div className="px-6 py-4 bg-navy/[0.03] flex items-start gap-3">
        <Sparkles className="size-4 shrink-0 text-navy-soft mt-0.5" />
        <p className="text-sm text-navy-mid italic">{pair.overallInsight}</p>
      </div>
    </div>
  );
}
