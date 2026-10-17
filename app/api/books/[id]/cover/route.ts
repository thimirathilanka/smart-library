import { NextResponse } from "next/server";
import { getBookForStaff } from "@/lib/data/books";
import { isResourceOwner, previewSession, storedFileResponse, wantsRevision } from "@/lib/data/media";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const book = await getBookForStaff(id);
  if (!book) return new NextResponse("Not found", { status: 404 });

  const { member, activeAdmin, activeAuthor } = await previewSession(request);
  const owner = isResourceOwner(activeAuthor, member?._id, book.submittedBy);
  const published = !book.publicationStatus || book.publicationStatus === "published";

  if (wantsRevision(request)) {
    if (!book.revision?.coverId || (!owner && !activeAdmin)) return new NextResponse("Not found", { status: 404 });
    return storedFileResponse(book.revision.coverId, `${book.revision.title}-cover`, "image/jpeg");
  }

  if (!book.coverId) return new NextResponse("Not found", { status: 404 });
  if (!published && !owner && !activeAdmin) return new NextResponse("Not found", { status: 404 });
  return storedFileResponse(book.coverId, `${book.title}-cover`, "image/jpeg");
}
