import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMemberById, hasActiveMembership } from "@/lib/data/members";
import { getPaperForStaff } from "@/lib/data/papers";
import { openGridFsDownload } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paper = await getPaperForStaff(id);
  if (!paper?.fileId) return new NextResponse("Not found", { status: 404 });

  const session = await auth();
  const member = session?.user?.id ? await getMemberById(session.user.id) : null;
  const published = !paper.publicationStatus || paper.publicationStatus === "published";
  const activeAdmin = Boolean(member?.status === "Active" && member.isAdmin);
  const ownerPreview = Boolean(
    !published &&
    member?.status === "Active" &&
    member.isAuthor &&
    paper.submittedBy &&
    paper.submittedBy === member._id,
  );
  if (!published && !ownerPreview && !activeAdmin) return new NextResponse("Not found", { status: 404 });
  if (!ownerPreview && paper.access === "members" && !activeAdmin) {
    if (!hasActiveMembership(member)) {
      return new NextResponse("Forbidden", { status: session?.user ? 403 : 401 });
    }
  }

  const stream = await openGridFsDownload(paper.fileId);
  if (!stream) return new NextResponse("Not found", { status: 404 });

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(`${paper.title}.pdf`)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}