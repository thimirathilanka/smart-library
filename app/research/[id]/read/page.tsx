import { notFound, redirect } from "next/navigation";
import { ReaderView } from "@/components/read/ReaderView";
import { TrackRead } from "@/components/read/TrackRead";
import { getPaper } from "@/lib/data/papers";
import { getMemberById, hasActiveMembership } from "@/lib/data/members";
import { auth } from "@/auth";

export async function generateMetadata({
  params,
}: PageProps<"/research/[id]/read">) {
  const { id } = await params;
  const paper = await getPaper(id);
  return { title: paper ? `Reading · ${paper.title}` : "Reader" };
}

export default async function PaperReaderPage({
  params,
}: PageProps<"/research/[id]/read">) {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper) notFound();
  const session = await auth();
  const member = session?.user?.id ? await getMemberById(session.user.id) : null;
  if (paper.access === "members") {
    if (!member) {
      redirect(`/login?callbackUrl=/research/${paper._id}/read`);
    }
    const isAdmin = member.status === "Active" && member.isAdmin;
    if (!isAdmin && !hasActiveMembership(member)) {
      redirect(`/research/${paper._id}?locked=1`);
    }
  }

  return (
    <>
      <TrackRead kind="paper" id={paper._id} />
      <ReaderView
        backHref={`/research/${paper._id}`}
        kicker={`${paper.venue} · ${paper.year}`}
        title={paper.title}
        byline={paper.authors.join(", ")}
      >
        {paper.fileId ? (
          <iframe
            src={`/api/research/${paper._id}/file`}
            title={`Read ${paper.title}`}
            className="h-[78dvh] min-h-[32rem] w-full rounded-lg border border-line bg-white"
          />
        ) : (
          <>
            <p>
              <strong>Abstract.</strong> {paper.abstract}
            </p>
            <p>
              <strong>1. Introduction.</strong> The authors situate the problem in{" "}
              {paper.field.toLowerCase()} and outline the contribution that follows.
              Keywords: {paper.keywords.join(", ")}.
            </p>
            <p>
              <strong>2. Contribution.</strong>{" "}
              {paper.doi
                ? `Findings are reported under DOI ${paper.doi} and indexed with the venue record for ${paper.venue}.`
                : `Findings are indexed with the venue record for ${paper.venue}.`}
            </p>
            <p>
              <strong>3. Closing.</strong> Related work, metadata, and formatted
              citations are available from the paper record. Reading progress is kept
              on My Library.
            </p>
          </>
        )}
      </ReaderView>
    </>
  );
}
