import { notFound } from "next/navigation";
import { ReaderView } from "@/components/read/ReaderView";
import { getPaper } from "@/lib/mock-data";

export async function generateMetadata({
  params,
}: PageProps<"/research/[id]/read">) {
  const { id } = await params;
  const paper = getPaper(id);
  return { title: paper ? `Reading · ${paper.title}` : "Reader" };
}

export default async function PaperReaderPage({
  params,
}: PageProps<"/research/[id]/read">) {
  const { id } = await params;
  const paper = getPaper(id);
  if (!paper) notFound();

  return (
    <ReaderView
      backHref={`/research/${paper._id}`}
      kicker={`${paper.venue} · ${paper.year}`}
      title={paper.title}
      byline={paper.authors.join(", ")}
    >
      <p>
        <strong>Abstract.</strong> {paper.abstract}
      </p>
      <p>
        <strong>1. Introduction.</strong> This paper is presented in Nextgen Digital Library’s
        in-browser reader. The typeset column approximates a journal galley so
        readers can open the full text without a file download. Keywords: {paper.keywords.join(", ")}.
      </p>
      <p>
        <strong>2. Contribution.</strong> The authors situate the work in{" "}
        {paper.field.toLowerCase()} and report findings indexed under DOI{" "}
        {paper.doi}. Citation counts in the catalog are mock figures for the
        showcase.
      </p>
      <p>
        <strong>3. Closing.</strong> Return to the paper record for metadata,
        related work, and formatted citations. Reading progress is reflected on
        My Library.
      </p>
    </ReaderView>
  );
}
