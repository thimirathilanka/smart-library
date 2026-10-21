"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageSquare,
  Printer,
  Save,
  Scale,
  Sparkles,
  Target,
  Telescope,
} from "lucide-react";
import {
  askComparisonQuestionAction,
  saveComparisonReportAction,
} from "@/app/actions/compare";
import type { ComparisonReport, DocumentSnapshot } from "@/lib/types";
import { cn } from "@/lib/format";

export function ComparisonReportView({
  report,
  onReset,
  savedId,
}: {
  report: ComparisonReport;
  onReset: () => void;
  savedId?: string;
}) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(Boolean(savedId));
  const [saveTitle, setSaveTitle] = useState(
    `Comparison: ${report.resources.map((r) => r.title).slice(0, 2).join(" vs ")}`,
  );
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Ask AI state
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAnswering, startAnswerTransition] = useTransition();
  const [answerError, setAnswerError] = useState("");

  const promptSuggestions = [
    "Why do these sources reach different conclusions?",
    "Which document is best for someone new to this subject?",
    "What are the major shared limitations across these sources?",
    "Which source provides the most practical implementation details?",
    "What research gaps should future studies investigate?",
  ];

  async function handleSave() {
    setIsSaving(true);
    const res = await saveComparisonReportAction({
      title: saveTitle,
      report,
    });
    setIsSaving(false);
    if (res.ok) {
      setSaveSuccess(true);
      setShowSaveModal(false);
    }
  }

  function handleAskAi(q: string) {
    const cleanQ = q.trim();
    if (!cleanQ) return;
    setAnswerError("");
    setAiQuestion(cleanQ);

    startAnswerTransition(async () => {
      const res = await askComparisonQuestionAction({
        report,
        question: cleanQ,
      });
      if (res.ok) {
        setAiAnswer(res.answer);
      } else {
        setAnswerError(res.error);
      }
    });
  }

  function exportCsv() {
    const headers = [
      "Comparison Dimension",
      ...report.resources.map((r) => `"${r.title.replace(/"/g, '""')} (${r.kind})"`),
    ];

    const rows = report.comparisonMatrix.map((row) => {
      const cells = [
        `"${row.dimension.replace(/"/g, '""')}"`,
        ...report.resources.map((r) => `"${(row.values[r._id] || "Not specified").replace(/"/g, '""')}"`),
      ];
      return cells.join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `comparison_matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Select Different Documents</span>
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 capitalize">
            <Scale className="size-3.5" />
            <span>{report.purpose} Comparison</span>
          </span>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {saveSuccess ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400">
              <BookmarkCheck className="size-3.5" />
              <span>Report Saved</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors"
            >
              <Save className="size-3.5 text-emerald-400" />
              <span>Save Report</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors"
            title="Download Comparison Matrix as CSV"
          >
            <FileSpreadsheet className="size-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            <Printer className="size-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#171b19] p-6 shadow-2xl">
            <h3 className="font-serif text-lg text-white">Save Comparison Report</h3>
            <p className="mt-1 text-xs text-white/60">
              Save this report to reopen, review, or share whenever you need it.
            </p>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              className="mt-4 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              placeholder="Report title..."
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="rounded-lg px-4 py-2 text-xs text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Header Document Badges */}
      <div className="mt-6">
        <h1 className="font-serif text-2xl font-normal text-white sm:text-3xl">
          Multi-Document Comparative Report
        </h1>
        <p className="mt-1 text-xs text-white/50">
          Generated on {new Date(report.generatedAt).toLocaleDateString(undefined, { dateStyle: "long" })} · {report.resources.length} documents analyzed
        </p>

        {/* Selected Document Row */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {report.resources.map((doc, i) => (
            <div
              key={doc._id}
              className="relative flex items-start gap-3 rounded-xl border border-white/10 bg-[#161a18] p-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded px-1.5 py-0.2 text-[10px] font-medium uppercase tracking-wider text-white/50 bg-white/5">
                  {doc.kind}
                </span>
                <h4 className="mt-0.5 truncate text-xs font-semibold text-white" title={doc.title}>
                  {doc.title}
                </h4>
                <p className="truncate text-[11px] text-white/60">
                  {doc.authors.join(", ")} · {doc.year}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Link
                    href={doc.kind === "book" ? `/books/${doc._id}` : `/research/${doc._id}`}
                    target="_blank"
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    View Details
                  </Link>
                  {doc.fileId ? (
                    <Link
                      href={doc.kind === "book" ? `/books/${doc._id}/read` : `/research/${doc._id}/read`}
                      target="_blank"
                      className="text-[11px] text-white/50 hover:text-white"
                    >
                      Read Online ↗
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Focus Question Highlight (if provided) */}
        {report.customQuestion ? (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Sparkles className="size-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Custom Comparison Focus
                </p>
                <p className="font-serif text-sm font-medium text-white">
                  &ldquo;{report.customQuestion}&rdquo;
                </p>
                {report.customQuestionAnswer ? (
                  <p className="mt-2 text-xs leading-relaxed text-emerald-100/90 border-t border-emerald-500/20 pt-2">
                    {report.customQuestionAnswer}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Navigation Tabs (Sticky) */}
      <div className="sticky top-0 z-30 mt-8 border-b border-white/10 bg-[#0e1110]/95 backdrop-blur-md pt-2 print:hidden">
        <div className="flex overflow-x-auto space-x-1 pb-2 scrollbar-none">
          {[
            { id: "overview", label: "Executive Summary" },
            { id: "matrix", label: "Comparison Matrix" },
            { id: "thematic", label: "Thematic Analysis" },
            { id: "methodology", label: "Methodology & Rigor" },
            { id: "similarities", label: "Similarities & Divergence" },
            { id: "strengths", label: "Strengths & Gaps" },
            { id: "recommendations", label: "Best Source & Goal" },
            { id: "evidence", label: "Evidence Citations" },
            { id: "ask-ai", label: "Ask AI" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-emerald-600 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-6 space-y-8">
        {/* 1. EXECUTIVE SUMMARY */}
        {(activeTab === "overview" || activeTab === "all") && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#161a18] p-6 shadow-sm">
              <h2 className="flex items-center gap-2 font-serif text-xl font-medium text-white">
                <Sparkles className="size-4 text-emerald-400" />
                Combined Synthesis
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80 whitespace-pre-line">
                {report.executiveSummary.combinedSynthesis}
              </p>

              <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Key Takeaway
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {report.executiveSummary.overallConclusion}
                </p>
              </div>
            </div>

            {/* Individual Source Summaries */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {report.executiveSummary.individualSummaries.map((s, idx) => (
                <div
                  key={s.resourceId || idx}
                  className="rounded-xl border border-white/10 bg-[#151917] p-5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Source #{idx + 1} Overview
                    </span>
                    <h3 className="font-serif text-base font-semibold text-white">
                      {s.title}
                    </h3>
                    <p className="text-xs text-white/60">
                      <span className="font-medium text-white/80">Subject: </span>
                      {s.mainSubject}
                    </p>
                    <p className="text-xs text-white/70 leading-relaxed">
                      <span className="font-medium text-white/80">Core Thesis: </span>
                      {s.coreContribution}
                    </p>
                  </div>
                  <div className="mt-4 border-t border-white/5 pt-3">
                    <span className="text-[11px] text-white/50">
                      Audience: {s.targetAudience}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. COMPARISON MATRIX */}
        {(activeTab === "matrix" || activeTab === "all") && (
          <section className="rounded-2xl border border-white/10 bg-[#161a18] p-6 shadow-sm overflow-hidden">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl font-medium text-white">
                  Side-by-Side Comparison Matrix
                </h2>
                <p className="text-xs text-white/50">
                  Comprehensive comparative evaluation across {report.comparisonMatrix.length} core dimensions.
                </p>
              </div>
              <button
                type="button"
                onClick={exportCsv}
                className="self-start text-xs text-emerald-400 hover:underline"
              >
                Download as CSV
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40">
                    <th className="p-3.5 font-semibold text-white w-48 shrink-0">
                      Dimension
                    </th>
                    {report.resources.map((doc, idx) => (
                      <th key={doc._id} className="p-3.5 font-semibold text-emerald-300 min-w-[220px]">
                        <span className="block text-[10px] uppercase tracking-wider text-white/40">
                          Doc {idx + 1} ({doc.kind})
                        </span>
                        {doc.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {report.comparisonMatrix.map((row, i) => (
                    <tr
                      key={row.dimension || i}
                      className={i % 2 === 0 ? "bg-white/[0.01]" : "bg-white/[0.03]"}
                    >
                      <td className="p-3.5 font-medium text-white/90 align-top">
                        <span className="block font-semibold text-white">{row.dimension}</span>
                        {row.description ? (
                          <span className="text-[10px] text-white/40 block mt-0.5">{row.description}</span>
                        ) : null}
                      </td>
                      {report.resources.map((doc) => {
                        const val = row.values[doc._id] || "Not specified";
                        const isNotSpecified =
                          val.toLowerCase().includes("not specified") ||
                          val.toLowerCase().includes("insufficient evidence");
                        return (
                          <td
                            key={doc._id}
                            className={cn(
                              "p-3.5 leading-relaxed align-top",
                              isNotSpecified ? "text-white/30 italic" : "text-white/80",
                            )}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 3. THEMATIC ANALYSIS */}
        {(activeTab === "thematic" || activeTab === "all") && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#161a18] p-6">
              <h2 className="font-serif text-xl font-medium text-white">Thematic Coverage & Concepts</h2>
              <p className="mt-1 text-xs text-white/50">
                Analysis of overlapping concepts, unique thematic contributions, and gaps.
              </p>

              {/* Shared Topics */}
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Shared Concepts Across Sources
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {report.thematicComparison.sharedTopics.map((st, i) => (
                    <div
                      key={st.topic || i}
                      className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2"
                    >
                      <h4 className="font-semibold text-white text-sm">{st.topic}</h4>
                      <div className="space-y-1.5 text-xs text-white/70">
                        {report.resources.map((doc) => (
                          <div key={doc._id} className="border-l-2 border-emerald-500/40 pl-2">
                            <span className="font-medium text-white/90">{doc.title}: </span>
                            <span>{st.howHandled[doc._id] || "Not directly addressed"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unique Topics per document */}
              <div className="mt-6 border-t border-white/10 pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
                  Unique Topics per Document
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {report.resources.map((doc) => {
                    const unique = report.thematicComparison.uniqueTopics[doc._id] || [];
                    return (
                      <div key={doc._id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <span className="text-[10px] font-bold text-white/40 uppercase">Only in:</span>
                        <h4 className="font-medium text-white text-xs mt-0.5 truncate">{doc.title}</h4>
                        <ul className="mt-2 space-y-1 text-xs text-white/70">
                          {unique.length > 0 ? (
                            unique.map((u, ui) => (
                              <li key={ui} className="flex items-center gap-1.5">
                                <span className="size-1 rounded-full bg-emerald-400" />
                                <span>{u}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-white/30 italic">No exclusively unique topics noted</li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Missing Topics Across All */}
              {report.thematicComparison.missingTopics.length > 0 ? (
                <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Topics Missing Across All Selected Documents
                  </h4>
                  <ul className="mt-2 space-y-1 text-xs text-amber-200/80">
                    {report.thematicComparison.missingTopics.map((m, mi) => (
                      <li key={mi}>• {m}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {/* 4. METHODOLOGY & RIGOR */}
        {(activeTab === "methodology" || activeTab === "all") && (
          <section className="rounded-2xl border border-white/10 bg-[#161a18] p-6 space-y-6">
            <div>
              <h2 className="font-serif text-xl font-medium text-white">Methodology, Frameworks & Evidence Rigor</h2>
              <p className="mt-1 text-xs text-white/50">
                Comparison of research designs, empirical datasets, and analytical strength.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {report.resources.map((doc) => {
                const strength = report.methodologyComparison.evidenceStrength[doc._id] || "Moderate";
                return (
                  <div key={doc._id} className="rounded-xl border border-white/10 bg-[#151917] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/40 uppercase">{doc.kind}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          strength === "High"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                        )}
                      >
                        {strength} Evidence
                      </span>
                    </div>

                    <h4 className="font-serif text-sm font-semibold text-white">{doc.title}</h4>

                    <div className="space-y-2 text-xs text-white/70">
                      <div>
                        <span className="font-semibold text-white/90">Design/Approach: </span>
                        <span>{report.methodologyComparison.researchDesign[doc._id] || "Theoretical & conceptual framework"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-white/90">Data / Framework: </span>
                        <span>{report.methodologyComparison.datasetsOrFrameworks[doc._id] || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-white/90">Evaluation: </span>
                        <span>{report.methodologyComparison.evaluationAndMetrics[doc._id] || "Qualitative analysis"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Comparative Rigor Assessment
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-white/80">
                {report.methodologyComparison.overallRigorVerdict}
              </p>
            </div>
          </section>
        )}

        {/* 5. SIMILARITIES & DIVERGENCE */}
        {(activeTab === "similarities" || activeTab === "all") && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#161a18] p-6 space-y-6">
              <div>
                <h2 className="font-serif text-xl font-medium text-white">Agreements & Conflicting Stances</h2>
                <p className="mt-1 text-xs text-white/50">
                  Points of intellectual consensus vs diverging claims and underlying assumptions.
                </p>
              </div>

              {/* Common claims */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                  Key Claims & Conceptual Agreements
                </h3>
                <ul className="space-y-2">
                  {report.similaritiesAndDifferences.agreedArguments.map((ag, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/80">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                      <span>{ag}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Divergence */}
              <div className="border-t border-white/10 pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
                  Contrasting Perspectives & Disagreements
                </h3>
                <div className="space-y-4">
                  {report.similaritiesAndDifferences.divergentClaims.map((div, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <h4 className="font-semibold text-sm text-white">{div.topic}</h4>
                      <div className="space-y-1.5 text-xs text-white/70">
                        {report.resources.map((doc) => (
                          <div key={doc._id} className="border-l-2 border-amber-500/40 pl-2">
                            <span className="font-medium text-white/90">{doc.title}: </span>
                            <span>{div.perspectives[doc._id] || "Neutral / unstated"}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-lg bg-black/40 p-2 text-xs text-white/60">
                        <span className="font-semibold text-emerald-300">Why they differ: </span>
                        <span>{div.whyTheyDiverge}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6. STRENGTHS, LIMITATIONS & GAPS */}
        {(activeTab === "strengths" || activeTab === "all") && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#161a18] p-6 space-y-6">
              <div>
                <h2 className="font-serif text-xl font-medium text-white">Strengths, Limitations & Research Gaps</h2>
                <p className="mt-1 text-xs text-white/50">
                  Differentiating author-acknowledged limitations from AI-observed boundaries.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {report.strengthsAndLimitations.map((item, idx) => (
                  <div key={item.resourceId || idx} className="rounded-xl border border-white/10 bg-[#151917] p-5 space-y-4">
                    <h3 className="font-serif text-base font-semibold text-white">
                      {item.title}
                    </h3>

                    {/* Strengths */}
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block mb-1.5">
                        Core Strengths
                      </span>
                      <ul className="space-y-1 text-xs text-white/80">
                        {item.strengths.map((str, si) => (
                          <li key={si} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Author Limitations */}
                    <div className="border-t border-white/5 pt-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block mb-1.5">
                        Author-Stated Limitations
                      </span>
                      <ul className="space-y-1 text-xs text-white/70">
                        {item.authorStatedLimitations.map((lim, li) => (
                          <li key={li} className="flex items-start gap-1.5">
                            <span className="text-amber-400 mt-0.5">•</span>
                            <span>{lim}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* AI Observed Limitations */}
                    <div className="border-t border-white/5 pt-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 block mb-1.5">
                        AI-Observed Observations & Boundaries
                      </span>
                      <ul className="space-y-1 text-xs text-white/70">
                        {item.aiObservedLimitations.map((obs, oi) => (
                          <li key={oi} className="flex items-start gap-1.5">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Research Gaps */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                  Unanswered Questions & Research Frontiers
                </h4>
                <ul className="space-y-2 text-xs text-white/80">
                  {report.researchGaps.map((rg, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Telescope className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                      <span>{rg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 7. BEST SOURCE & GOAL RECOMMENDATIONS */}
        {(activeTab === "recommendations" || activeTab === "all") && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#161a18] p-6 space-y-6">
              <div>
                <h2 className="font-serif text-xl font-medium text-white">Recommendations for Your Goal</h2>
                <p className="mt-1 text-xs text-white/50">
                  Tailored guidance for &ldquo;{report.purpose}&rdquo; research, learning, and practical execution.
                </p>
              </div>

              {/* Overall Verdict Banner */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
                <div className="flex items-start gap-3">
                  <Target className="size-5 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-emerald-300 text-sm">
                      Comparative Verdict
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/90">
                      {report.purposeRecommendation.verdict}
                    </p>
                  </div>
                </div>
              </div>

              {/* Suitability Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="text-[10px] font-semibold uppercase text-emerald-400">Best for Beginners</span>
                  <p className="mt-2 text-xs font-semibold text-white">
                    {report.purposeRecommendation.bestForBeginners}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="text-[10px] font-semibold uppercase text-blue-400">Best for In-Depth Research</span>
                  <p className="mt-2 text-xs font-semibold text-white">
                    {report.purposeRecommendation.bestForInDepthResearch}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="text-[10px] font-semibold uppercase text-purple-400">Best for Practical Implementation</span>
                  <p className="mt-2 text-xs font-semibold text-white">
                    {report.purposeRecommendation.bestForPracticalImplementation}
                  </p>
                </div>
              </div>

              {/* Recommended Reading Order */}
              <div className="border-t border-white/10 pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
                  Recommended Sequential Reading Order
                </h3>
                <div className="space-y-3">
                  {report.purposeRecommendation.readingOrder.map((step) => (
                    <div
                      key={step.step}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                        {step.step}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-serif text-sm font-semibold text-white">{step.title}</h4>
                        <p className="mt-1 text-xs text-white/60 leading-relaxed">{step.rationale}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 8. EVIDENCE CITATIONS */}
        {(activeTab === "evidence" || activeTab === "all") && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#161a18] p-6 space-y-4">
              <div>
                <h2 className="font-serif text-xl font-medium text-white">Evidence & Citation Explorer</h2>
                <p className="mt-1 text-xs text-white/50">
                  Verifiable textual excerpts, section references, and findings extracted from the analyzed documents.
                </p>
              </div>

              <div className="space-y-3">
                {report.evidenceCitations.length > 0 ? (
                  report.evidenceCitations.map((cit, i) => (
                    <div
                      key={cit.id || i}
                      className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-emerald-400">
                          {cit.resourceTitle}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-white/50">
                          {cit.pageNumber ? (
                            <span className="rounded bg-black/40 px-2 py-0.5 border border-white/10">
                              Page {cit.pageNumber}
                            </span>
                          ) : (
                            <span className="rounded bg-black/40 px-2 py-0.5 border border-white/10">
                              Catalog Record
                            </span>
                          )}
                          {cit.sectionTitle ? <span>§ {cit.sectionTitle}</span> : null}
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-white/60">
                            {cit.citationType.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      <blockquote className="border-l-2 border-emerald-500/60 pl-3 italic text-xs leading-relaxed text-white/90">
                        &ldquo;{cit.quoteOrExcerpt}&rdquo;
                      </blockquote>

                      <p className="text-[11px] text-white/50 pt-1">
                        <span className="font-medium text-white/70">Claim Supported: </span>
                        {cit.claimSupported}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/40 italic">
                    Analysis grounded on catalog records and abstracts. Uploaded PDF page excerpts were not available for page-level citations.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 9. INTERACTIVE ASK AI */}
        {(activeTab === "ask-ai" || activeTab === "all") && (
          <section className="rounded-2xl border border-emerald-500/30 bg-[#141916] p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-serif text-xl font-medium text-white">Ask AI About These Documents</h2>
                <p className="text-xs text-white/50">
                  Ask follow-up questions grounded directly in the analyzed documents.
                </p>
              </div>
            </div>

            {/* Prompt Chips */}
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleAskAi(suggestion)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAi(aiQuestion);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask anything about these compared documents..."
                className="flex-1 rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-colors sm:text-sm"
              />
              <button
                type="submit"
                disabled={isAnswering || !aiQuestion.trim()}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {isAnswering ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                <span>Ask AI</span>
              </button>
            </form>

            {answerError ? (
              <p className="text-xs text-red-400">{answerError}</p>
            ) : null}

            {/* Answer Display */}
            {aiAnswer ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-5 backdrop-blur-sm space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  AI Answer (Grounded in Compared Documents)
                </span>
                <p className="text-xs leading-relaxed text-white/90 whitespace-pre-line sm:text-sm">
                  {aiAnswer}
                </p>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}

