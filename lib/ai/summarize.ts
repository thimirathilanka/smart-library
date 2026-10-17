import "server-only";

import type { ResourceKind } from "@/lib/types";

const MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 30000;
const SUMMARY_MAX = 1200;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string; thought?: boolean }>;
    };
  }>;
};

export async function summarizeForCatalog(input: {
  kind: ResourceKind;
  title: string;
  source: string;
  excerpt?: boolean;
}): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const source = input.source.trim();
  const title = input.title.trim();
  if (!apiKey || !source || !title) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptFor(input.kind, title, source, Boolean(input.excerpt)) }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 400,
            thinkingConfig: { thinkingLevel: "MINIMAL" },
          },
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`Gemini API returned HTTP ${response.status}.`);
    }
    const payload = (await response.json()) as GeminiResponse;
    const summary = summaryText(payload);
    if (!summary) throw new Error("Gemini returned an empty summary.");
    return summary;
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError"
      ? "The Gemini request timed out."
      : error instanceof Error
        ? error.message
        : "The Gemini request failed.";
    console.error(`[catalog-ai-summary] ${reason}`);
    throw new Error(reason);
  } finally {
    clearTimeout(timeout);
  }
}

function promptFor(kind: ResourceKind, title: string, source: string, excerpt: boolean) {
  const label = excerpt ? "Excerpt" : kind === "book" ? "Book description" : "Paper abstract";
  const lines = [
    "You write catalog notes for a library.",
    `Summarize this ${kind} in 2 to 4 plain sentences a reader can scan.`,
    'Then add one line that starts with "Subjects:" and lists 4 to 8 short alternate phrases a reader might type when searching for this work.',
    "Prefer plainer wording than the source when a simpler phrase exists.",
    "Use only what the source supports. Do not add a title line or markdown.",
  ];
  if (excerpt) lines.push("The source is an excerpt from the PDF, not the whole work.");
  lines.push("", `Title: ${title}`, "", `${label}:`, source);
  return lines.join("\n");
}

function summaryText(payload: GeminiResponse) {
  const text = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => (part.thought ? "" : (part.text ?? "")))
    .join("\n")
    .replace(/\u0000/g, "")
    .trim();
  if (!text) return null;
  return text.length > SUMMARY_MAX ? text.slice(0, SUMMARY_MAX).trim() : text;
}
