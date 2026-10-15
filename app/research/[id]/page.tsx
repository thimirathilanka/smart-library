import { notFound } from "next/navigation";
import { PaperDetail } from "@/components/details/ResourceDetail";
import { getPaper, relatedPapers } from "@/lib/data/papers";
import { auth } from "@/auth";
import { getMemberById, hasActiveMembership } from "@/lib/data/members";
import { getUserResourceRating } from "@/lib/data/ratings";

export async function generateMetadata({ params }: PageProps<"/research/[id]">) {
  const { id } = await params;
  const paper = await getPaper(id);
  return { title: paper?.title ?? "Paper" };
}

export default async function ResearchPaperPage({
  params,
  searchParams,
}: PageProps<"/research/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const paper = await getPaper(id);
  if (!paper) notFound();
  const session = await auth();
  const [member, related, userRating] = await Promise.all([
    session?.user?.id ? getMemberById(session.user.id) : Promise.resolve(null),
    relatedPapers(paper),
    session?.user?.id ? getUserResourceRating(session.user.id, "paper", paper._id) : Promise.resolve(0),
  ]);
  const library = member?.library;
  const hasMembership = hasActiveMembership(member);

  return (
    <PaperDetail
      paper={paper}
      related={related}
      signedIn={Boolean(session?.user)}
      hasMembership={hasMembership}
      promptLocked={query.locked === "1"}
      saved={library?.saved.some((item) => item.resourceId === paper._id) ?? false}
      favorited={library?.favorites.some((item) => item.resourceId === paper._id) ?? false}
      userRating={userRating}
    />
  );
}
