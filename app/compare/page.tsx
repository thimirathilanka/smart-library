import { auth } from "@/auth";
import { getMemberById, hasActiveMembership } from "@/lib/data/members";
import { listBooks } from "@/lib/data/books";
import { listPapers } from "@/lib/data/papers";
import { ComparisonLab } from "@/components/compare/ComparisonLab";

export const metadata = {
  title: "Comparison Lab — Smart Library",
  description: "Compare books and research papers side by side with AI-powered insights.",
};

export default async function ComparePage() {
  const session = await auth();

  // Must be logged in – otherwise show login prompt
  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="mb-4 text-lg text-muted">You need to be logged in to use the Comparison Lab.</p>
        <a href="/login?callbackUrl=/compare" className="inline-block rounded-full bg-navy px-6 py-2 text-white hover:bg-navy/80">Log in</a>
      </div>
    );
  }

  const member = await getMemberById(session.user.id);
  const hasAccess = session.user.isAdmin || hasActiveMembership(member);

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="mb-4 text-lg text-muted">The Comparison Lab is a member‑only feature.</p>
        <a href="/membership?feature=compare" className="inline-block rounded-full bg-navy px-6 py-2 text-white hover:bg-navy/80">Upgrade Membership</a>
      </div>
    );
  }

  const [books, papers] = await Promise.all([listBooks(), listPapers()]);

  const bookHits = books.map((b) => ({
    _id: b._id,
    kind: "book" as const,
    title: b.title,
    authors: b.authors && b.authors.length > 0 ? b.authors : [b.author],
    year: b.year,
    categoryOrField: b.category,
  }));

  const paperHits = papers.map((p) => ({
    _id: p._id,
    kind: "paper" as const,
    title: p.title,
    authors: p.authors,
    year: p.year,
    categoryOrField: p.field,
  }));

  return <ComparisonLab initialBooks={bookHits} initialPapers={paperHits} />;
}
