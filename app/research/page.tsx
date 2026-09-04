import { Suspense } from "react";
import { PaperCatalog } from "@/components/papers/PaperCatalog";
import { listPapers } from "@/lib/data/papers";

export const metadata = {
  title: "Research Papers",
};

export default async function ResearchPage({
  searchParams,
}: PageProps<"/research">) {
  const params = await searchParams;
  const initialQuery = typeof params.q === "string" ? params.q : "";
  const papers = await listPapers();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">
        Scholarship
      </p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Research papers</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Journal articles and conference papers, indexed for field, author, year,
        and keyword. Read the full text online.
      </p>
      <div className="mt-8">
        <Suspense>
          <PaperCatalog papers={papers} initialQuery={initialQuery} />
        </Suspense>
      </div>
    </div>
  );
}
