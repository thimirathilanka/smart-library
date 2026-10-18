import "server-only";

import { createCipheriv, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { openGridFsFile } from "@/lib/db";
import { getBook } from "@/lib/data/books";
import { getPaper } from "@/lib/data/papers";
import type { ResourceKind } from "@/lib/types";

const GRANT_TTL = "5m";
const GRANT_TYP = "mobile-download";

export type DownloadGrantPayload = {
  sub: string;
  kind: ResourceKind;
  resourceId: string;
  fileId: string;
  title: string;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function resolveDownloadableResource(kind: ResourceKind, resourceId: string) {
  if (kind === "book") {
    const book = await getBook(resourceId);
    if (!book?.fileId) return null;
    return { fileId: book.fileId, title: book.title, kind, resourceId };
  }
  const paper = await getPaper(resourceId);
  if (!paper?.fileId) return null;
  return { fileId: paper.fileId, title: paper.title, kind, resourceId };
}

export async function signDownloadGrant(input: DownloadGrantPayload) {
  return new SignJWT({
    typ: GRANT_TYP,
    kind: input.kind,
    resourceId: input.resourceId,
    fileId: input.fileId,
    title: input.title,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.sub)
    .setIssuedAt()
    .setExpirationTime(GRANT_TTL)
    .sign(secretKey());
}

export async function verifyDownloadGrant(token: string): Promise<DownloadGrantPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== GRANT_TYP) return null;
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const kind = payload.kind === "book" || payload.kind === "paper" ? payload.kind : null;
    const resourceId = typeof payload.resourceId === "string" ? payload.resourceId : null;
    const fileId = typeof payload.fileId === "string" ? payload.fileId : null;
    const title = typeof payload.title === "string" ? payload.title : null;
    if (!sub || !kind || !resourceId || !fileId || !title) return null;
    return { sub, kind, resourceId, fileId, title };
  } catch {
    return null;
  }
}

async function readGridFsBuffer(fileId: string) {
  const file = await openGridFsFile(fileId);
  if (!file) return null;
  const chunks: Buffer[] = [];
  for await (const chunk of file.stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function encryptPdfForMobile(fileId: string) {
  const plaintext = await readGridFsBuffer(fileId);
  if (!plaintext) return null;

  const contentKey = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", contentKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Key is delivered only with a validated short-lived grant over TLS (X-Wrapped-Key).
  return {
    ciphertext,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    wrappedKey: contentKey.toString("base64"),
  };
}
