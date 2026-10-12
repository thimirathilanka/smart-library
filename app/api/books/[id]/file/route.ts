import { NextResponse } from "next/server";
import { getBookForStaff } from "@/lib/data/books";
import { hasActiveMembership } from "@/lib/data/members";
import { isResourceOwner, previewSession, storedFileResponse, wantsRevision } from "@/lib/data/media";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const book = await getBookForStaff(id);
  if (!book) return new NextResponse("Not found", { status: 404 });

  const { session, member, activeAdmin, activeAuthor } = await previewSession();
  const owner = isResourceOwner(activeAuthor, member?._id, book.submittedBy);
  const published = !book.publicationStatus || book.publicationStatus === "published";

  if (wantsRevision(request)) {
    if (!book.revision?.fileId || (!owner && !activeAdmin)) return new NextResponse("Not found", { status: 404 });
    return storedFileResponse(book.revision.fileId, `${book.revision.title}.pdf`, "application/pdf");
  }

  if (!book.fileId) return new NextResponse("Not found", { status: 404 });
  const ownerPreview = !published && owner;
  if (!published && !ownerPreview && !activeAdmin) return new NextResponse("Not found", { status: 404 });
  if (!ownerPreview && book.access === "members" && !activeAdmin) {
    if (!hasActiveMembership(member)) {
      return new NextResponse("Forbidden", { status: session?.user ? 403 : 401 });
    }
  }

  return storedFileResponse(book.fileId, `${book.title}.pdf`, "application/pdf");
}
