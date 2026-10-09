import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMemberById } from "@/lib/data/members";
import { getPaper } from "@/lib/data/papers";
import { openGridFsDownload } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper?.fileId) return new NextResponse("Not found", { status: 404 });

  const session = await auth();
  const member = session?.user?.id ? await getMemberById(session.user.id) : null;
  const activeAdmin = Boolean(member?.status === "Active" && member.isAdmin);
  if (paper.access === "members" && !activeAdmin) {
    const today = new Date().toISOString().slice(0, 10);
    const activeMember = Boolean(
      member?.status === "Active" &&
      member.isMember &&
      member.membershipExpiresAt &&
      member.membershipExpiresAt >= today,
    );
    if (!activeMember) {
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