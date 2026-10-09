import "server-only";

import { uploadGridFsFile } from "@/lib/db";

export const MAX_PDF_SIZE = 25 * 1024 * 1024;

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