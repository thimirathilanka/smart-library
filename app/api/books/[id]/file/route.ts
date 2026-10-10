import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBookForStaff } from "@/lib/data/books";
import { getMemberById, hasActiveMembership } from "@/lib/data/members";
import { openGridFsDownload } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const book = await getBookForStaff(id);
  if (!book?.fileId) return new NextResponse("Not found", { status: 404 });

  const session = await auth();
  const member = session?.user?.id ? await getMemberById(session.user.id) : null;
  const published = !book.publicationStatus || book.publicationStatus === "published";
  const activeAdmin = Boolean(member?.status === "Active" && member.isAdmin);
  const ownerPreview = Boolean(
    !published &&
    member?.status === "Active" &&
    member.isAuthor &&
    book.submittedBy &&
    book.submittedBy === member._id,
  );
  if (!published && !ownerPreview && !activeAdmin) return new NextResponse("Not found", { status: 404 });
  if (!ownerPreview && book.access === "members" && !activeAdmin) {
    if (!hasActiveMembership(member)) {
      return new NextResponse("Forbidden", { status: session?.user ? 403 : 401 });
    }
  }

  const stream = await openGridFsDownload(book.fileId);
  if (!stream) return new NextResponse("Not found", { status: 404 });

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(`${book.title}.pdf`)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}