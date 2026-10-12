import "server-only";

import { getDocumentProxy } from "unpdf";
import { openGridFsFile } from "@/lib/db";

const PAGE_LIMIT = 8;
const CHAR_LIMIT = 12_000;
const MIN_WORDS = 8;

export async function extractPdfExcerpt(fileId: string | undefined): Promise<string | null> {
  if (!fileId) return null;
  try {
    const opened = await openGridFsFile(fileId);
    if (!opened) return null;
    return excerptFromPdf(new Uint8Array(await readToBuffer(opened.stream)));
  } catch {
    return null;
  }
}

export async function excerptFromPdf(bytes: Uint8Array): Promise<string | null> {
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | undefined;
  try {
    pdf = await getDocumentProxy(bytes);
    const pageCount = Math.min(pdf.numPages, PAGE_LIMIT);
    let text = "";

    for (let number = 1; number <= pageCount; number += 1) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (!pageText) continue;
      text = text ? `${text}\n\n${pageText}` : pageText;
      if (text.length >= CHAR_LIMIT) break;
    }

    return usableExcerpt(text);
  } catch {
    return null;
  } finally {
    if (pdf) await pdf.loadingTask.destroy().catch(() => undefined);
  }
}

function usableExcerpt(text: string) {
  const cleaned = text.replace(/\u0000/g, "").trim();
  const capped = cleaned.length > CHAR_LIMIT ? cleaned.slice(0, CHAR_LIMIT).trim() : cleaned;
  const words = capped.split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORDS) return null;
  return capped;
}

async function readToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
