import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReaderView } from "@/components/read/ReaderView";
import { TrackRead } from "@/components/read/TrackRead";
import { PdfPageViewer } from "@/components/read/PdfPageViewer";
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
  searchParams,
}: PageProps<"/research/[id]/read">) {
  const { id } = await params;
  const query = await searchParams;
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

  const savedPage = member?.library?.history?.find((item) => item.kind === "paper" && item.resourceId === paper._id)?.bookmarkPage;
  const requestedPage = Number(query.page);
  const initialPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : savedPage ?? 1;

  return (
    <>
      <TrackRead kind="paper" id={paper._id} />
      <ReaderView
        backHref={`/research/${paper._id}`}
        kicker={`${paper.venue} · ${paper.year}`}
        title={paper.title}
        byline={paper.authors.join(", ")}
        showBackLink={!paper.fileId}
      >
        {paper.fileId ? (
          <PdfPageViewer
            src={`/api/research/${paper._id}/file`}
            title={paper.title}
            kind="paper"
            resourceId={paper._id}
            backHref={`/research/${paper._id}`}
            initialPage={initialPage}
            initialBookmarkPage={savedPage}
            isSignedIn={Boolean(session?.user?.id && member?.status === "Active")}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
            <p className="text-muted">No PDF is available for this title yet.</p>
            <Link
              href={`/research/${paper._id}`}
              className="mt-4 inline-flex rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-mid"
            >
              Back to details
            </Link>
          </div>
        )}
      </ReaderView>
    </>
  );
}
