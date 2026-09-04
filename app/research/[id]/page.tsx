import { notFound } from "next/navigation";
import { PaperDetail } from "@/components/details/ResourceDetail";
import { getPaper, relatedPapers } from "@/lib/mock-data";

export async function generateMetadata({ params }: PageProps<"/research/[id]">) {
  const { id } = await params;
  const paper = getPaper(id);
  return { title: paper?.title ?? "Paper" };
}

export default async function ResearchPaperPage({
  params,
}: PageProps<"/research/[id]">) {
  const { id } = await params;
  const paper = getPaper(id);
  if (!paper) notFound();

  return <PaperDetail paper={paper} related={relatedPapers(paper)} />;
}
