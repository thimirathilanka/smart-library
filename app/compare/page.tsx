import { auth } from "@/auth";
import { listBooks } from "@/lib/data/books";
import { listPapers } from "@/lib/data/papers";
import { listUserSavedComparisons } from "@/lib/data/saved-comparisons";
import { ComparisonLab } from "@/components/compare/ComparisonLab";

export const maxDuration = 60;

export const metadata = {
  title: "AI Comparison Lab — Nextgen Digital Library",
  description:
    "Intelligently compare 2 to 4 books and research papers with evidence-backed AI analysis, matrix benchmarks, and citations.",
};

export default async function ComparePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-white/10 bg-[#161a18] p-8 shadow-xl">
          <h2 className="font-serif text-2xl text-white">AI Comparison Lab</h2>
          <p className="mt-2 text-sm text-white/60">
            Sign in to compare multiple books and research papers side by side with AI-powered evidence synthesis.
          </p>
          <a
            href="/login?callbackUrl=/compare"
            className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Log in to Access Comparison Lab
          </a>
        </div>
      </div>
    );
  }

  const [books, papers, savedReports] = await Promise.all([
    listBooks(),
    listPapers(),
    listUserSavedComparisons(session.user.id),
  ]);

  const bookHits = books.map((b) => ({
    _id: b._id,
    kind: "book" as const,
    title: b.title,
    authors: b.authors && b.authors.length > 0 ? b.authors : [b.author],
    year: b.year,
    categoryOrField: b.category,
    coverId: b.coverId,
    cover: b.cover,
    fileId: b.fileId,
  }));

  const paperHits = papers.map((p) => ({
    _id: p._id,
    kind: "paper" as const,
    title: p.title,
    authors: p.authors,
    year: p.year,
    categoryOrField: p.field,
    coverId: p.coverId,
    fileId: p.fileId,
  }));

  return (
    <ComparisonLab
      initialBooks={bookHits}
      initialPapers={paperHits}
      initialSavedReports={savedReports}
    />
  );
}
