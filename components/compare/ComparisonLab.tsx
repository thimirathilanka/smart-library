"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  Lightbulb,
  Loader2,
  MinusCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  Sparkles,
  Trash2,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import {
  generateComparisonReportAction,
  getSavedComparisonAction,
  deleteSavedComparisonAction,
  renameSavedComparisonAction,
} from "@/app/actions/compare";
import { ComparisonReportView } from "@/components/compare/ComparisonReportView";
import type {
  ComparisonPurpose,
  ComparisonReport,
  ResourceKind,
  SavedComparisonSummary,
} from "@/lib/types";
import { cn } from "@/lib/format";

export type SearchHit = {
  _id: string;
  kind: ResourceKind;
  title: string;
  authors: string[];
  year: number;
  categoryOrField: string;
  coverId?: string;
  cover?: {
    from: string;
    to: string;
    accent: string;
  };
  fileId?: string;
};

const PURPOSES: Array<{
  id: ComparisonPurpose;
  title: string;
  description: string;
  icon: typeof Scale;
}> = [
  {
    id: "general",
    title: "General Comparison",
    description: "Broad thematic synthesis and core arguments",
    icon: ArrowLeftRight,
  },
  {
    id: "academic",
    title: "Academic Research",
    description: "Methodologies, empirical evidence, and scholarly rigor",
    icon: GraduationCap,
  },
  {
    id: "learning",
    title: "Learning & Exam Prep",
    description: "Conceptual clarity, fundamentals, and explanations",
    icon: BookOpen,
  },
  {
    id: "technical",
    title: "Technical Comparison",
    description: "Algorithms, architecture, trade-offs, and implementation",
    icon: Wrench,
  },
  {
    id: "literature",
    title: "Literature Review",
    description: "Mapping lineages, consensus, and research gaps",
    icon: Layers,
  },
];

const QUESTION_SUGGESTIONS = [
  "Which approach is most robust to noisy real-world data?",
  "How do their foundational theoretical proofs compare?",
  "Which document explains the concepts with more clarity for beginners?",
  "What are the contrasting trade-offs in their proposed architectures?",
];

export function ComparisonLab({
  initialBooks = [],
  initialPapers = [],
  initialSavedReports = [],
}: {
  initialBooks?: SearchHit[];
  initialPapers?: SearchHit[];
  initialSavedReports?: SavedComparisonSummary[];
}) {
  const [selected, setSelected] = useState<SearchHit[]>([]);
  const [purpose, setPurpose] = useState<ComparisonPurpose>("general");
  const [customQuestion, setCustomQuestion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "book" | "paper">("all");
  const [topicFilter, setTopicFilter] = useState("all");

  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [activeSavedId, setActiveSavedId] = useState<string | undefined>();
  const [savedReports, setSavedReports] = useState<SavedComparisonSummary[]>(initialSavedReports);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [loadingSavedId, setLoadingSavedId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const allItems: SearchHit[] = [
    ...initialBooks.map((b) => ({ ...b, kind: "book" as ResourceKind })),
    ...initialPapers.map((p) => ({ ...p, kind: "paper" as ResourceKind })),
  ];

  const allTopics = Array.from(new Set(allItems.map((i) => i.categoryOrField))).sort();

  const filteredItems = allItems.filter((item) => {
    if (kindFilter !== "all" && item.kind !== kindFilter) return false;
    if (topicFilter !== "all" && item.categoryOrField !== topicFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.authors.some((a) => a.toLowerCase().includes(q)) ||
      item.categoryOrField.toLowerCase().includes(q)
    );
  });

  function toggleSelect(item: SearchHit) {
    const isAlready = selected.some((s) => s._id === item._id);
    if (isAlready) {
      setSelected(selected.filter((s) => s._id !== item._id));
    } else {
      if (selected.length >= 4) return;
      setSelected([...selected, item]);
    }
  }

  function removeSelected(id: string) {
    setSelected(selected.filter((s) => s._id !== id));
  }

  function handleStartComparison() {
    if (selected.length < 2) return;
    setError("");

    startTransition(async () => {
      const res = await generateComparisonReportAction({
        items: selected.map((s) => ({ id: s._id, kind: s.kind })),
        purpose,
        customQuestion: customQuestion.trim() || undefined,
      });

      if (res.ok) {
        setReport(res.data);
        setActiveSavedId(undefined);
      } else {
        setError(res.error);
      }
    });
  }

  async function handleLoadSaved(id: string) {
    setLoadingSavedId(id);
    const res = await getSavedComparisonAction(id);
    setLoadingSavedId(null);
    if (res.ok) {
      setReport(res.data.report);
      setActiveSavedId(res.data._id);
      setIsSavedModalOpen(false);
    } else {
      setError(res.error);
    }
  }

  async function handleDeleteSaved(id: string) {
    const res = await deleteSavedComparisonAction(id);
    if (res.ok) {
      setSavedReports(savedReports.filter((r) => r._id !== id));
    }
  }

  // If a report is active, render the full Results Dashboard
  if (report) {
    return (
      <ComparisonReportView
        report={report}
        savedId={activeSavedId}
        onReset={() => setReport(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <Sparkles className="size-3.5 text-emerald-400" />
            <span>AI Multi-Document Intelligence</span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-normal tracking-tight text-white sm:text-4xl">
            AI Comparison Lab
          </h1>
          <p className="mt-2 text-sm text-white/60 max-w-2xl">
            Select 2 to 4 books or research papers. The AI deeply analyzes their actual contents,
            methodologies, and findings to generate an evidence-backed comparative report.
          </p>
        </div>

        {/* Saved Reports Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSavedModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
          >
            <Clock className="size-4 text-emerald-400" />
            <span>Saved Reports</span>
            {savedReports.length > 0 ? (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                {savedReports.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* STEP 1: COMPARISON PURPOSE SELECTOR */}
      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70">
            1. Select Comparison Objective
          </h2>
          <span className="text-[11px] text-white/40">Customizes report emphasis & evaluations</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PURPOSES.map((p) => {
            const Icon = p.icon;
            const isSelected = purpose === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPurpose(p.id)}
                className={cn(
                  "flex flex-col text-left rounded-xl p-3.5 border transition-all",
                  isSelected
                    ? "border-emerald-500 bg-emerald-950/25 ring-1 ring-emerald-500/50 shadow-sm"
                    : "border-white/10 bg-[#161a18] hover:border-white/20 hover:bg-[#1a201c]",
                )}
              >
                <div className="flex items-center justify-between">
                  <Icon
                    className={cn(
                      "size-4",
                      isSelected ? "text-emerald-400" : "text-white/40",
                    )}
                  />
                  {isSelected ? <Check className="size-3 text-emerald-400" /> : null}
                </div>
                <h3
                  className={cn(
                    "mt-2.5 text-xs font-semibold",
                    isSelected ? "text-white" : "text-white/80",
                  )}
                >
                  {p.title}
                </h3>
                <p className="mt-1 text-[11px] text-white/50 leading-relaxed">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* STEP 2: OPTIONAL CUSTOM INQUIRY */}
      <section className="mt-6 rounded-xl border border-white/10 bg-[#161a18] p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <label
              htmlFor="custom-question-input"
              className="text-xs font-semibold uppercase tracking-wider text-white/70"
            >
              2. Custom Focus Question (Optional)
            </label>
            <p className="text-[11px] text-white/50 mt-0.5">
              Ask a specific question you want the comparison report to investigate across the documents.
            </p>
          </div>
        </div>

        <input
          id="custom-question-input"
          type="text"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="e.g. Which method handles edge cases and data drift better? How do their computational costs compare?"
          className="mt-3 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-emerald-500 sm:text-sm"
        />

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-white/40 flex items-center gap-1">
            <Lightbulb className="size-3" />
            Try:
          </span>
          {QUESTION_SUGGESTIONS.map((qs) => (
            <button
              key={qs}
              type="button"
              onClick={() => setCustomQuestion(qs)}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/60 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
            >
              &ldquo;{qs}&rdquo;
            </button>
          ))}
        </div>
      </section>

      {/* STEP 3: DOCUMENT SELECTOR */}
      <section className="mt-8 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70">
            3. Choose Documents to Compare (Select 2 to 4)
          </h2>
          <span className="text-xs font-medium text-emerald-400">
            {selected.length} of 4 selected
          </span>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-xl border border-white/10 bg-[#161a18] p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Document Type Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setKindFilter("all")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                kindFilter === "all" ? "bg-emerald-600 text-white" : "text-white/60 hover:text-white",
              )}
            >
              All ({allItems.length})
            </button>
            <button
              type="button"
              onClick={() => setKindFilter("book")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                kindFilter === "book" ? "bg-emerald-600 text-white" : "text-white/60 hover:text-white",
              )}
            >
              <BookOpen className="size-3" />
              Books ({initialBooks.length})
            </button>
            <button
              type="button"
              onClick={() => setKindFilter("paper")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                kindFilter === "paper" ? "bg-emerald-600 text-white" : "text-white/60 hover:text-white",
              )}
            >
              <FileText className="size-3" />
              Papers ({initialPapers.length})
            </button>
          </div>

          {/* Search Input & Topic Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 focus-within:border-emerald-500">
              <Search className="size-3.5 text-white/40 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author..."
                className="bg-transparent text-xs text-white placeholder-white/40 outline-none w-44"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-white/40 hover:text-white"
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </div>

            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            >
              <option value="all">All Topics</option>
              {allTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => {
            const isSelected = selected.some((s) => s._id === item._id);
            const canSelect = isSelected || selected.length < 4;

            return (
              <div
                key={item._id}
                onClick={() => canSelect && toggleSelect(item)}
                className={cn(
                  "group relative flex flex-col justify-between rounded-xl border p-4 transition-all cursor-pointer select-none",
                  isSelected
                    ? "border-emerald-500 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/50"
                    : canSelect
                    ? "border-white/10 bg-[#151917] hover:border-white/20 hover:bg-[#1a201c]"
                    : "border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed",
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        item.kind === "book"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20",
                      )}
                    >
                      {item.kind}
                    </span>

                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full text-xs transition-colors",
                        isSelected
                          ? "bg-emerald-500 text-black font-bold"
                          : "border border-white/20 text-white/30 group-hover:border-white/50",
                      )}
                    >
                      {isSelected ? <Check className="size-3 stroke-[3]" /> : <Plus className="size-3" />}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-serif text-sm font-semibold text-white line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-white/60 line-clamp-1">
                    {item.authors.join(", ")}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-white/50">
                  <span className="truncate max-w-[140px]">{item.categoryOrField}</span>
                  <span>{item.year}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ERROR MESSAGE */}
      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {/* FLOATING COMPARISON TRAY (STICKY BOTTOM) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0c0f0e]/95 p-4 shadow-2xl backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Selected slots preview */}
          <div className="flex items-center gap-3 overflow-x-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 shrink-0">
              Selected ({selected.length}/4):
            </span>

            {selected.length === 0 ? (
              <span className="text-xs text-white/40 italic">
                Click any document cards above to add to comparison (min 2, max 4).
              </span>
            ) : (
              <div className="flex items-center gap-2">
                {selected.map((item, i) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-xs text-white"
                  >
                    <span className="size-4 flex items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
                      {i + 1}
                    </span>
                    <span className="max-w-[120px] truncate sm:max-w-[180px] font-medium">
                      {item.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSelected(item._id)}
                      className="ml-1 text-white/40 hover:text-white"
                      title="Remove from comparison"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2 shrink-0">
            {selected.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="rounded-lg px-3 py-2 text-xs text-white/50 hover:text-white transition-colors"
              >
                Clear All
              </button>
            ) : null}

            <button
              type="button"
              disabled={selected.length < 2 || pending}
              onClick={handleStartComparison}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Synthesizing Deep Report…</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>
                    {selected.length < 2
                      ? "Select at least 2 to compare"
                      : `Compare ${selected.length} Documents`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SAVED REPORTS MODAL */}
      {isSavedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#161a18] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-emerald-400" />
                <h3 className="font-serif text-lg text-white">Saved Comparison Reports</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSavedModalOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
              {savedReports.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/40">
                  No saved comparison reports yet. Generate a comparison report and click &ldquo;Save Report&rdquo; to store it here.
                </div>
              ) : (
                savedReports.map((saved) => (
                  <div
                    key={saved._id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-white/5 p-3.5 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">
                          {saved.purpose}
                        </span>
                        <span className="text-[11px] text-white/40">
                          {new Date(saved.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-medium text-xs text-white truncate">{saved.title}</h4>
                      <p className="text-[11px] text-white/50 truncate">
                        {saved.resourceTitles.join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={loadingSavedId === saved._id}
                        onClick={() => handleLoadSaved(saved._id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
                      >
                        {loadingSavedId === saved._id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <ChevronRight className="size-3" />
                        )}
                        <span>Open</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(saved._id)}
                        className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                        title="Delete report"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsSavedModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs text-white/60 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Spacer so floating tray doesn't overlap grid bottom */}
      <div className="h-24" />
    </div>
  );
}
