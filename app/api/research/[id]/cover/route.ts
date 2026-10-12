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

  const { member, activeAdmin, activeAuthor } = await previewSession();
  const owner = isResourceOwner(activeAuthor, member?._id, paper.submittedBy);
  const published = !paper.publicationStatus || paper.publicationStatus === "published";

  if (wantsRevision(request)) {
    if (!paper.revision?.coverId || (!owner && !activeAdmin)) return new NextResponse("Not found", { status: 404 });
    return storedFileResponse(paper.revision.coverId, `${paper.revision.title}-cover`, "image/jpeg");
  }

  if (!paper.coverId) return new NextResponse("Not found", { status: 404 });
  if (!published && !owner && !activeAdmin) return new NextResponse("Not found", { status: 404 });
  return storedFileResponse(paper.coverId, `${paper.title}-cover`, "image/jpeg");
}
