import "server-only";

import { Readable } from "node:stream";
import { auth } from "@/auth";
import { openGridFsFile } from "@/lib/db";
import { getMemberById } from "@/lib/data/members";

export async function previewSession() {
  const session = await auth();
  const member = session?.user?.id ? await getMemberById(session.user.id) : null;
  return {
    session,
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
