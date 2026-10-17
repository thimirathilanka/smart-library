import "server-only";

import { deleteGridFsFile, uploadGridFsFile } from "@/lib/db";

export const MAX_PDF_SIZE = 25 * 1024 * 1024;
export const MAX_COVER_SIZE = 2 * 1024 * 1024;

export async function saveReplacementPdf(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    return { ok: true as const, fileId: undefined };
  }
  return savePdfUpload(value);
}

export async function savePdfUpload(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    return { ok: false as const, error: "Choose a PDF file to upload." };
  }
  if (value.size > MAX_PDF_SIZE) {
    return { ok: false as const, error: "The PDF must be 25 MB or smaller." };
  }
  if (value.type !== "application/pdf" && !value.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false as const, error: "Only PDF files can be uploaded." };
  }
  const signature = new Uint8Array(await value.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(signature) !== "%PDF-") {
    return { ok: false as const, error: "This file does not appear to be a valid PDF." };
  }

  try {
    return { ok: true as const, fileId: await uploadGridFsFile(value) };
  } catch {
    return { ok: false as const, error: "The PDF could not be uploaded. Please try again." };
  }
}

export async function saveReplacementCover(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    return { ok: true as const, coverId: undefined };
  }
  return saveCoverUpload(value);
}

export async function saveCoverUpload(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    return { ok: false as const, error: "Choose a cover image to upload." };
  }
  if (value.size > MAX_COVER_SIZE) {
    return { ok: false as const, error: "The cover image must be 2 MB or smaller." };
  }
  const bytes = new Uint8Array(await value.slice(0, 12).arrayBuffer());
  const contentType = coverContentType(bytes);
  if (!contentType) {
    return { ok: false as const, error: "Cover images must be JPEG, PNG, or WebP." };
  }

  try {
    return { ok: true as const, coverId: await uploadGridFsFile(value, contentType) };
  } catch {
    return { ok: false as const, error: "The cover image could not be uploaded. Please try again." };
  }
}

export async function readCatalogUploads(formData: FormData, pdf: "required" | "optional") {
  const file = pdf === "required" ? await savePdfUpload(formData.get("file")) : await saveReplacementPdf(formData.get("file"));
  if (!file.ok) return file;
  const cover = await saveReplacementCover(formData.get("cover"));
  if (!cover.ok) {
    if (file.fileId) await deleteGridFsFile(file.fileId);
    return cover;
  }
  if (formData.get("keepFile") === "0" && !file.fileId) {
    if (cover.coverId) await deleteGridFsFile(cover.coverId);
    return { ok: false as const, error: "Add a PDF to replace the current one." };
  }
  return {
    ok: true as const,
    fileId: file.fileId,
    coverId: cover.coverId,
    clearCover: formData.get("keepCover") === "0" && !cover.coverId,
  };
}

function coverContentType(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}