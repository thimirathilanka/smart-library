import { notFound } from "next/navigation";
import { PaperDetail } from "@/components/details/ResourceDetail";
import { getPaper, relatedPapers } from "@/lib/data/papers";
import { auth } from "@/auth";
import { getMemberById } from "@/lib/data/members";

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
  const member = session?.user?.id ? await getMemberById(session.user.id) : null;
  const library = member?.library;
  const today = new Date().toISOString().slice(0, 10);
  const hasMembership = Boolean(
    member?.isMember && member.membershipExpiresAt && member.membershipExpiresAt >= today,
  );

  return (
    <PaperDetail
      paper={paper}
      related={await relatedPapers(paper)}
      signedIn={Boolean(session?.user)}
      hasMembership={hasMembership}
      saved={library?.saved.some((item) => item.resourceId === paper._id) ?? false}
      favorited={library?.favorites.some((item) => item.resourceId === paper._id) ?? false}
    />
  );
}
