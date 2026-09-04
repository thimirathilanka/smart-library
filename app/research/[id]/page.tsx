import { notFound } from "next/navigation";
import { PaperDetail } from "@/components/details/ResourceDetail";
import { getPaper, relatedPapers } from "@/lib/data/papers";
import { auth } from "@/auth";
import { getMemberLibrary } from "@/lib/data/members";

export async function generateMetadata({ params }: PageProps<"/research/[id]">) {
  const { id } = await params;
  const paper = await getPaper(id);
  return { title: paper?.title ?? "Paper" };
}

export default async function ResearchPaperPage({
  params,
}: PageProps<"/research/[id]">) {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper) notFound();
  const session = await auth();
  const library = session?.user?.id ? await getMemberLibrary(session.user.id) : null;

  return (
    <PaperDetail
      paper={paper}
      related={await relatedPapers(paper)}
      signedIn={Boolean(session?.user)}
      saved={library?.saved.some((item) => item.resourceId === paper._id) ?? false}
      favorited={library?.favorites.some((item) => item.resourceId === paper._id) ?? false}
    />
  );
}
