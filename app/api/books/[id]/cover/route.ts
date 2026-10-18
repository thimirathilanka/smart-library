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

  const wantsRev = wantsRevision(request);
  const published = !book.publicationStatus || book.publicationStatus === "published";

  // Fast path for published public covers (skips auth/session overhead & DB lookups)
  if (!wantsRev && published) {
    if (!book.coverId) return new NextResponse("Not found", { status: 404 });
    return storedFileResponse(book.coverId, `${book.title}-cover`, "image/jpeg", {
      isPublic: true,
      request,
    });
  }

  const { member, activeAdmin, activeAuthor } = await previewSession(request);
  const owner = isResourceOwner(activeAuthor, member?._id, book.submittedBy);

  if (wantsRev) {
    if (!book.revision?.coverId || (!owner && !activeAdmin)) return new NextResponse("Not found", { status: 404 });
    return storedFileResponse(book.revision.coverId, `${book.revision.title}-cover`, "image/jpeg", {
      isPublic: false,
      request,
    });
  }

  if (!book.coverId) return new NextResponse("Not found", { status: 404 });
  if (!published && !owner && !activeAdmin) return new NextResponse("Not found", { status: 404 });
  return storedFileResponse(book.coverId, `${book.title}-cover`, "image/jpeg", {
    isPublic: true,
    request,
  });
}
