import "server-only";

import { Readable } from "node:stream";
import { auth } from "@/auth";
import { getMemberFromRequest } from "@/lib/api/mobile-auth";
import { openGridFsFile } from "@/lib/db";
import { getMemberById } from "@/lib/data/members";
import type { MemberRecord } from "@/lib/types";

type PreviewSession = {
  session: { user?: { id?: string | null } | null } | null;
  member: MemberRecord | null;
  activeAdmin: boolean;
  activeAuthor: boolean;
};

export async function previewSession(request?: Request): Promise<PreviewSession> {
  if (request) {
    const bearerMember = await getMemberFromRequest(request);
    if (bearerMember) {
      return {
        session: { user: { id: bearerMember._id } },
        member: bearerMember,
        activeAdmin: Boolean(bearerMember.status === "Active" && bearerMember.isAdmin),
        activeAuthor: Boolean(bearerMember.status === "Active" && bearerMember.isAuthor),
      };
    }
  }

  const session = await auth();
  const member = session?.user?.id ? await getMemberById(session.user.id) : null;
  return {
    session: session ? { user: { id: session.user?.id } } : null,
    member,
    activeAdmin: Boolean(member?.status === "Active" && member.isAdmin),
    activeAuthor: Boolean(member?.status === "Active" && member.isAuthor),
  };
}

export function isResourceOwner(activeAuthor: boolean, memberId: string | undefined, submittedBy?: string) {
  return Boolean(activeAuthor && memberId && submittedBy && submittedBy === memberId);
}

export async function storedFileResponse(fileId: string, downloadName: string, fallbackType: string) {
  const file = await openGridFsFile(fileId);
  if (!file) return new Response("Not found", { status: 404 });
  const contentType = file.contentType === "application/octet-stream" ? fallbackType : file.contentType;
  return new Response(Readable.toWeb(file.stream) as ReadableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function wantsRevision(request: Request) {
  return new URL(request.url).searchParams.get("revision") === "1";
}
