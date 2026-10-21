import { listBooks } from "@/lib/data/books";
import { listPapers } from "@/lib/data/papers";
import { SemanticFinder } from "@/components/finder/SemanticFinder";
import { STANDARD_TOPICS } from "@/lib/categories";
import type { SemanticSearchResult } from "@/lib/ai/semantic-search";

export const maxDuration = 60;

export const metadata = {
  title: "Semantic Research Finder · Nextgen Digital Library",
  description:
    "Discover books and research papers by meaning, intent, or topic with AI vector similarity.",
};

export default async function FinderPage() {
  const [books, papers] = await Promise.all([listBooks(), listPapers()]);

  const categories = Array.from(new Set([...STANDARD_TOPICS, ...books.map((b) => b.category)])).sort();
  const fields = Array.from(new Set([...STANDARD_TOPICS, ...papers.map((p) => p.field)])).sort();
  const years = Array.from(
    new Set([...books.map((b) => b.year), ...papers.map((p) => p.year)]),
  ).sort((a, b) => b - a);

  // Initial featured/recent items to display before search
  const initialResults: SemanticSearchResult[] = [
    ...papers.slice(0, 5).map((p) => ({
      _id: p._id,
      kind: "paper" as const,
      title: p.title,
      authors: p.authors,
      year: p.year,
      access: p.access,
      categoryOrField: p.field,
      descriptionOrAbstract: p.abstract,
      similarityScore: 98,
      matchReason: p.aiSummary
        ? p.aiSummary.slice(0, 140)
        : `Featured research publication in ${p.field}.`,
      keyMatches: [p.field],
      reads: p.reads,
      fileId: p.fileId,
      coverId: p.coverId,
      cover: undefined,
    })),
    ...books.slice(0, 5).map((b) => ({
      _id: b._id,
      kind: "book" as const,
      title: b.title,
      authors: b.authors && b.authors.length > 0 ? b.authors : [b.author],
      year: b.year,
      access: b.access,
      categoryOrField: b.category,
      descriptionOrAbstract: b.description,
      similarityScore: 95,
      matchReason: b.aiSummary
        ? b.aiSummary.slice(0, 140)
        : `Curated library textbook on ${b.category}.`,
      keyMatches: [b.category],
      reads: b.reads,
      fileId: b.fileId,
      coverId: b.coverId,
      cover: b.cover,
    })),
  ];

  return (
    <div className="min-h-screen bg-[#0e1110] py-8 text-white">
      <SemanticFinder
        initialResults={initialResults}
        categories={categories}
        fields={fields}
        years={years}
      />
    </div>
  );
}
