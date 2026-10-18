import "server-only";

import { getEmbedding, cosineSimilarity } from "@/lib/ai/semantic-search";
import { collections } from "@/lib/db";
import { toPlain } from "@/lib/data/serialize";
import { withPublished } from "@/lib/data/publication";
import type { Book, ResearchPaper, ResourceKind } from "@/lib/types";

const REASONING_MODEL = "gemini-2.5-flash";
const API_URL = "https://generativelanguage.googleapis.com/v1beta";

export type CompareResource = {
  _id: string;
  kind: ResourceKind;
  title: string;
  authors: string[];
  year: number;
  access: string;
  categoryOrField: string;
  descriptionOrAbstract: string;
  aiSummary?: string;
  keywords?: string[];
  reads: number;
  fileId?: string;
  coverId?: string;
  cover?: Book["cover"];
  venue?: string;
  venueType?: string;
  citations?: number;
  publisher?: string;
  pages?: number | string;
  isbn?: string;
};

export type ComparisonPair = {
  resourceA: CompareResource;
  resourceB: CompareResource;
  /** 0–100 cosine-based content similarity */
  similarityScore: number;
  /** One-sentence distillation of what each resource is really about */
  coreIdeaA: string;
  coreIdeaB: string;
  /** Shared themes / methods / arguments found in the actual content */
  agreements: string[];
  /** Meaningful intellectual distinctions — approach, scope, findings, conclusions */
  differences: string[];
  /** AI-generated titles / topics the reader should explore next */
  furtherStudy: string[];
  /** One sentence summarising the combined value of reading both */
  overallInsight: string;
};

export type ComparisonResult = {
  resources: CompareResource[];
  pairs: ComparisonPair[];
};

// ─── Fetch resource ───────────────────────────────────────────────────────────

export async function fetchResource(
  id: string,
  kind: ResourceKind,
): Promise<CompareResource | null> {
  const { books, papers } = await collections();

  if (kind === "book") {
    const book = await books.findOne(withPublished<Book>({ _id: id }));
    if (!book) return null;
    const plain = toPlain(book) as Book;
    return {
      _id: plain._id,
      kind: "book",
      title: plain.title,
      authors: plain.authors && plain.authors.length > 0 ? plain.authors : [plain.author],
      year: plain.year,
      access: plain.access,
      categoryOrField: plain.category,
      descriptionOrAbstract: plain.description,
      aiSummary: plain.aiSummary,
      reads: plain.reads,
      fileId: plain.fileId,
      coverId: plain.coverId,
      cover: plain.cover,
      publisher: plain.publisher,
      pages: plain.pages,
      isbn: plain.isbn,
    };
  }

  const paper = await papers.findOne(withPublished<ResearchPaper>({ _id: id }));
  if (!paper) return null;
  const plain = toPlain(paper) as ResearchPaper;
  return {
    _id: plain._id,
    kind: "paper",
    title: plain.title,
    authors: plain.authors,
    year: plain.year,
    access: plain.access,
    categoryOrField: plain.field,
    descriptionOrAbstract: plain.abstract,
    aiSummary: plain.aiSummary,
    keywords: plain.keywords,
    reads: plain.reads,
    fileId: plain.fileId,
    coverId: plain.coverId,
    venue: plain.venue,
    venueType: plain.venueType,
    citations: plain.citations,
    pages: plain.pages,
  };
}

// ─── Build a rich content string for embedding / prompting ───────────────────

function buildContentText(r: CompareResource): string {
  const parts: string[] = [];
  parts.push(`Title: ${r.title}`);
  parts.push(`Authors: ${r.authors.join(", ")}`);
  parts.push(`Year: ${r.year}`);

  if (r.kind === "paper") {
    parts.push(`Field: ${r.categoryOrField}`);
    if (r.keywords?.length) parts.push(`Keywords: ${r.keywords.join(", ")}`);
    if (r.venue) parts.push(`Published in: ${r.venue}`);
    if (r.citations !== undefined) parts.push(`Citations: ${r.citations}`);
    parts.push(`Abstract: ${r.descriptionOrAbstract}`);
  } else {
    parts.push(`Category: ${r.categoryOrField}`);
    if (r.publisher) parts.push(`Publisher: ${r.publisher}`);
    parts.push(`Description: ${r.descriptionOrAbstract}`);
  }

  if (r.aiSummary) parts.push(`Detailed Summary: ${r.aiSummary}`);
  return parts.join("\n");
}

// ─── Cosine similarity via embeddings ────────────────────────────────────────

async function getContentSimilarity(a: CompareResource, b: CompareResource): Promise<number> {
  try {
    const [embA, embB] = await Promise.all([
      getEmbedding(buildContentText(a).slice(0, 4000)),
      getEmbedding(buildContentText(b).slice(0, 4000)),
    ]);
    if (embA && embB) {
      const raw = cosineSimilarity(embA, embB);
      // Normalise from typical [0.3–0.85] cosine range → 0–99%
      return Math.max(0, Math.min(99, Math.round(((raw - 0.3) / 0.55) * 50 + 50)));
    }
  } catch {
    // fall through
  }
  // Keyword-overlap fallback
  const tokensA = new Set(
    buildContentText(a)
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 3),
  );
  const tokensB = buildContentText(b)
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 3);
  const overlap = tokensB.filter((t) => tokensA.has(t)).length;
  return Math.min(75, Math.round((overlap / Math.max(tokensA.size, 1)) * 100));
}

// ─── Gemini deep-content comparison ──────────────────────────────────────────

async function callGeminiDeepComparison(a: CompareResource, b: CompareResource): Promise<{
  coreIdeaA: string;
  coreIdeaB: string;
  agreements: string[];
  differences: string[];
  furtherStudy: string[];
  overallInsight: string;
}> {
  const fallback = {
    coreIdeaA: `${a.title} explores ${a.categoryOrField}.`,
    coreIdeaB: `${b.title} explores ${b.categoryOrField}.`,
    agreements: ["Both resources address related academic topics."],
    differences: [
      `${a.title} is a ${a.kind}; ${b.title} is a ${b.kind}.`,
      `Published ${Math.abs(a.year - b.year)} year(s) apart.`,
    ],
    furtherStudy: ["Explore recent surveys in " + a.categoryOrField],
    overallInsight: "Reading both provides a broader perspective on the subject.",
  };

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return fallback;

  // Build a rich content block for each resource
  const contentA = buildContentText(a).slice(0, 1200);
  const contentB = buildContentText(b).slice(0, 1200);

  // NOTE: responseMimeType intentionally omitted — it causes silent failures
  // with flash models. We extract JSON from raw text with regex instead.
  const prompt = `You are a senior academic librarian and subject-matter expert with deep knowledge across all research fields.

Perform a thorough CONTENT-level comparison of these two resources.

IMPORTANT: If the stored content below is sparse (short abstract or no summary), USE YOUR OWN KNOWLEDGE about the research topics inferred from the title, field, and keywords. You know what these papers are about — reason about their methods, contributions, and intellectual scope even when our database records are minimal.

=== Resource A (${a.kind}) ===
${contentA}

=== Resource B (${b.kind}) ===
${contentB}

Respond with ONLY a valid JSON object — no markdown fences, no extra text before or after.

{
  "coreIdeaA": "<One sentence capturing the central argument or technical contribution of Resource A — be specific about the method/topic, max 25 words>",
  "coreIdeaB": "<One sentence capturing the central argument or technical contribution of Resource B — be specific, max 25 words>",
  "agreements": [
    "<Specific shared intellectual theme, method, problem domain, or conceptual framework — not generic, max 25 words>",
    "<up to 4 items total>"
  ],
  "differences": [
    "<Meaningful distinction: different problem, method, scale, assumption, application domain, or conclusion — be specific, max 25 words>",
    "<up to 4 items total>"
  ],
  "furtherStudy": [
    "<Concrete paper title, survey, or research direction to explore next — e.g. Efficient Transformers A Survey — max 12 words>",
    "<3 to 5 items>"
  ],
  "overallInsight": "<One sentence on the complementary intellectual value of reading BOTH resources together, max 35 words>"
}`;

  try {
    const response = await fetch(`${API_URL}/models/${REASONING_MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 700,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[compare] Gemini returned ${response.status}:`, errText.slice(0, 300));
      return fallback;
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    if (!raw) {
      console.error("[compare] Empty Gemini response");
      return fallback;
    }

    // Strip markdown fences if the model wraps the JSON anyway
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    // Extract the first JSON object — handles any leading/trailing prose
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[compare] No JSON found in response:", raw.slice(0, 300));
      return fallback;
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      coreIdeaA?: string;
      coreIdeaB?: string;
      agreements?: string[];
      differences?: string[];
      furtherStudy?: string[];
      overallInsight?: string;
    };

    return {
      coreIdeaA: parsed.coreIdeaA ?? fallback.coreIdeaA,
      coreIdeaB: parsed.coreIdeaB ?? fallback.coreIdeaB,
      agreements: Array.isArray(parsed.agreements) ? parsed.agreements.slice(0, 4) : fallback.agreements,
      differences: Array.isArray(parsed.differences) ? parsed.differences.slice(0, 4) : fallback.differences,
      furtherStudy: Array.isArray(parsed.furtherStudy) ? parsed.furtherStudy.slice(0, 5) : fallback.furtherStudy,
      overallInsight: parsed.overallInsight ?? fallback.overallInsight,
    };
  } catch (err) {
    console.error("[compare] Gemini deep comparison failed:", err);
    return fallback;
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function compareResources(
  items: Array<{ id: string; kind: ResourceKind }>,
): Promise<ComparisonResult> {
  if (items.length < 2 || items.length > 4) {
    throw new Error("Please select between 2 and 4 resources to compare.");
  }

  // Fetch all resources in parallel
  const resources = (
    await Promise.all(items.map(({ id, kind }) => fetchResource(id, kind)))
  ).filter((r): r is CompareResource => r !== null);

  if (resources.length < 2) {
    throw new Error("Could not load enough resources to compare.");
  }

  // Build all unique pairs and run similarity + Gemini concurrently per pair
  const pairs: ComparisonPair[] = [];

  for (let i = 0; i < resources.length; i++) {
    for (let j = i + 1; j < resources.length; j++) {
      const a = resources[i];
      const b = resources[j];

      const [similarityScore, aiResult] = await Promise.all([
        getContentSimilarity(a, b),
        callGeminiDeepComparison(a, b),
      ]);

      pairs.push({
        resourceA: a,
        resourceB: b,
        similarityScore,
        coreIdeaA: aiResult.coreIdeaA,
        coreIdeaB: aiResult.coreIdeaB,
        agreements: aiResult.agreements,
        differences: aiResult.differences,
        furtherStudy: aiResult.furtherStudy,
        overallInsight: aiResult.overallInsight,
      });
    }
  }

  return { resources, pairs };
}
