import { NextResponse } from "next/server";
import { hasActiveMembership } from "@/lib/data/members";
import { isResourceOwner, previewSession, storedFileResponse, wantsRevision } from "@/lib/data/media";
import { getPaperForStaff } from "@/lib/data/papers";
import { recordFileOpen } from "@/lib/data/reads";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paper = await getPaperForStaff(id);
  if (!paper) return new NextResponse("Not found", { status: 404 });

  const { session, member, activeAdmin, activeAuthor } = await previewSession(request);
  const owner = isResourceOwner(activeAuthor, member?._id, paper.submittedBy);
  const published = !paper.publicationStatus || paper.publicationStatus === "published";

  if (wantsRevision(request)) {
    if (!paper.revision?.fileId || (!owner && !activeAdmin)) return new NextResponse("Not found", { status: 404 });
    return storedFileResponse(paper.revision.fileId, `${paper.revision.title}.pdf`, "application/pdf");
  }

  if (!paper.fileId) return new NextResponse("Not found", { status: 404 });
  const ownerPreview = !published && owner;
  if (!published && !ownerPreview && !activeAdmin) return new NextResponse("Not found", { status: 404 });
  if (!ownerPreview && paper.access === "members" && !activeAdmin) {
    if (!hasActiveMembership(member)) {
      return new NextResponse("Forbidden", { status: session?.user ? 403 : 401 });
    }
  }

  if (published && !ownerPreview) {
    await recordFileOpen("paper", id, session?.user?.id ?? null, request);
  }

  return storedFileResponse(paper.fileId, `${paper.title}.pdf`, "application/pdf");
}
