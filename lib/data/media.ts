import "server-only";

import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMemberFromRequest } from "@/lib/api/mobile-auth";
import { openGridFsFile } from "@/lib/db";
import { getMemberById } from "@/lib/data/members";
import { getCloudinaryDownloadUrl, isCloudinaryFile } from "@/lib/cloudinary";
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

export type StoredFileOptions = {
  cacheControl?: string;
  isPublic?: boolean;
  request?: Request;
};

export async function storedFileResponse(
  fileId: string,
  downloadName: string,
  fallbackType: string,
  options?: StoredFileOptions,
) {
  if (isCloudinaryFile(fileId)) {
    const url = getCloudinaryDownloadUrl(fileId);
    return NextResponse.redirect(url, 307);
  }

  const etag = `"${fileId}"`;
  const cacheControl =
    options?.cacheControl ??
    (options?.isPublic
      ? "public, max-age=604800, stale-while-revalidate=86400"
      : "private, no-store");

  if (options?.request?.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": cacheControl,
      },
    });
  }

  const file = await openGridFsFile(fileId);
  if (!file) return new Response("Not found", { status: 404 });
  const contentType = file.contentType === "application/octet-stream" ? fallbackType : file.contentType;
  return new Response(Readable.toWeb(file.stream) as ReadableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
      ETag: etag,
    },
  });
}

export function wantsRevision(request: Request) {
  return new URL(request.url).searchParams.get("revision") === "1";
}
