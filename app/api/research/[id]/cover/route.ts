import { NextResponse } from "next/server";
import { isResourceOwner, previewSession, storedFileResponse, wantsRevision } from "@/lib/data/media";
import { getPaperForStaff } from "@/lib/data/papers";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paper = await getPaperForStaff(id);
  if (!paper) return new NextResponse("Not found", { status: 404 });

  const wantsRev = wantsRevision(request);
  const published = !paper.publicationStatus || paper.publicationStatus === "published";

  // Fast path for published public covers (skips auth/session overhead & DB lookups)
  if (!wantsRev && published) {
    if (!paper.coverId) return new NextResponse("Not found", { status: 404 });
    return storedFileResponse(paper.coverId, `${paper.title}-cover`, "image/jpeg", {
      isPublic: true,
      request,
    });
  }

  const { member, activeAdmin, activeAuthor } = await previewSession(request);
  const owner = isResourceOwner(activeAuthor, member?._id, paper.submittedBy);

  if (wantsRev) {
    if (!paper.revision?.coverId || (!owner && !activeAdmin)) return new NextResponse("Not found", { status: 404 });
    return storedFileResponse(paper.revision.coverId, `${paper.revision.title}-cover`, "image/jpeg", {
      isPublic: false,
      request,
    });
  }

  if (!paper.coverId) return new NextResponse("Not found", { status: 404 });
  if (!published && !owner && !activeAdmin) return new NextResponse("Not found", { status: 404 });
  return storedFileResponse(paper.coverId, `${paper.title}-cover`, "image/jpeg", {
    isPublic: true,
    request,
  });
}
