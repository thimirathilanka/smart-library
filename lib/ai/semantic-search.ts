import "server-only";

import { listBooks } from "@/lib/data/books";
import { listPapers } from "@/lib/data/papers";
import { collections } from "@/lib/db";
import type { AccessType, Book, ResearchPaper, ResourceKind } from "@/lib/types";

const EMBEDDING_MODEL = "gemini-embedding-001";
const REASONING_MODEL = "gemini-2.5-flash";
const API_URL = "https://generativelanguage.googleapis.com/v1beta";

export type SemanticSearchResult = {
  _id: string;
  kind: ResourceKind;
  title: string;
  authors: string[];
  year: number;
  access: AccessType;
  categoryOrField: string;
  descriptionOrAbstract: string;
  similarityScore: number; // 0 to 100 percentage
  matchReason: string;
  keyMatches: string[];
  reads: number;
  fileId?: string;
  coverId?: string;
  cover?: Book["cover"];
};

export async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const clean = text.trim();
  if (!apiKey || !clean) return null;

  try {
    const response = await fetch(`${API_URL}/models/${EMBEDDING_MODEL}:embedContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        content: {
          parts: [{ text: clean.slice(0, 4000) }],
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[semantic-search] Embedding API returned status ${response.status}`);
      return null;
    }

    const data = (await response.json()) as { embedding?: { values?: number[] } };
    return data.embedding?.values ?? null;
  } catch (error) {
    console.error("[semantic-search] Failed to fetch embedding:", error);
    return null;
  }
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

function resourceText(resource: Book | ResearchPaper, kind: ResourceKind): string {
  if (kind === "book") {
    const book = resource as Book;
    return `Title: ${book.title}. Subtitle: ${book.subtitle ?? ""}. Author: ${book.author}. Category: ${book.category}. Description: ${book.description}. Summary: ${book.aiSummary ?? ""}`;
  }
  const paper = resource as ResearchPaper;
  return `Title: ${paper.title}. Authors: ${paper.authors.join(", ")}. Field: ${paper.field}. Keywords: ${paper.keywords.join(", ")}. Abstract: ${paper.abstract}. Summary: ${paper.aiSummary ?? ""}`;
}

async function ensureEmbedding(
  resource: Book | ResearchPaper,
  kind: ResourceKind,
): Promise<number[] | null> {
  if (resource.embedding && resource.embedding.length > 0) {
    return resource.embedding;
  }

  const text = resourceText(resource, kind);
  const embedding = await getEmbedding(text);
  if (embedding && embedding.length > 0) {
    // Cache embedding asynchronously in database
    collections().then(({ books, papers }) => {
      if (kind === "book") {
        books.updateOne({ _id: resource._id }, { $set: { embedding } }).catch(() => undefined);
      } else {
        papers.updateOne({ _id: resource._id }, { $set: { embedding } }).catch(() => undefined);
      }
    }).catch(() => undefined);
  }
  return embedding;
}

export async function explainMatchWithGemini(
  query: string,
  resource: { title: string; kind: string; summary: string },
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return `Relates to your search on "${query}".`;

  try {
    const response = await fetch(`${API_URL}/models/${REASONING_MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an academic librarian. In exactly ONE concise sentence (max 20 words), explain specifically why this ${resource.kind} is relevant to the user's research query. Do not use buzzwords, quotes, or markdown.

User query: "${query}"
Title: "${resource.title}"
Content overview: "${resource.summary.slice(0, 600)}"`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 80,
        },
      }),
    });

    if (!response.ok) throw new Error("Explanation API failed");
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || `Discusses topics directly related to "${query}".`;
  } catch {
    return `Discusses key concepts relevant to your inquiry regarding ${query}.`;
  }
}

export async function searchCatalogSemantically({
  query,
  kind = "all",
  categoryOrField = "all",
  year = "all",
  access = "all",
  limit = 20,
}: {
  query: string;
  kind?: "all" | "book" | "paper";
  categoryOrField?: string;
  year?: string;
  access?: "all" | AccessType;
  limit?: number;
}): Promise<SemanticSearchResult[]> {
  const cleanQuery = query.trim();

  // Load published books & papers in parallel
  const [books, papers] = await Promise.all([
    kind === "paper" ? Promise.resolve([]) : listBooks(),
    kind === "book" ? Promise.resolve([]) : listPapers(),
  ]);

  // Combine into normalized candidate list
  type Candidate = {
    item: Book | ResearchPaper;
    kind: ResourceKind;
    title: string;
    authors: string[];
    year: number;
    access: AccessType;
    categoryOrField: string;
    descriptionOrAbstract: string;
    reads: number;
    fileId?: string;
    coverId?: string;
    cover?: Book["cover"];
    summary: string;
  };

  const candidates: Candidate[] = [];

  for (const b of books) {
    if (categoryOrField !== "all" && b.category !== categoryOrField) continue;
    if (year !== "all" && b.year !== Number(year)) continue;
    if (access !== "all" && b.access !== access) continue;

    candidates.push({
      item: b,
      kind: "book",
      title: b.title,
      authors: b.authors && b.authors.length > 0 ? b.authors : [b.author],
      year: b.year,
      access: b.access,
      categoryOrField: b.category,
      descriptionOrAbstract: b.description,
      reads: b.reads,
      fileId: b.fileId,
      coverId: b.coverId,
      cover: b.cover,
      summary: b.aiSummary || b.description || b.title,
    });
  }

  for (const p of papers) {
    if (categoryOrField !== "all" && p.field !== categoryOrField) continue;
    if (year !== "all" && p.year !== Number(year)) continue;
    if (access !== "all" && p.access !== access) continue;

    candidates.push({
      item: p,
      kind: "paper",
      title: p.title,
      authors: p.authors,
      year: p.year,
      access: p.access,
      categoryOrField: p.field,
      descriptionOrAbstract: p.abstract,
      reads: p.reads,
      fileId: p.fileId,
      coverId: p.coverId,
      cover: undefined,
      summary: p.aiSummary || p.abstract || p.title,
    });
  }

  if (candidates.length === 0) return [];

  // If query is empty, return popular/recent resources
  if (!cleanQuery) {
    return candidates.slice(0, limit).map((c) => ({
      _id: c.item._id,
      kind: c.kind,
      title: c.title,
      authors: c.authors,
      year: c.year,
      access: c.access,
      categoryOrField: c.categoryOrField,
      descriptionOrAbstract: c.descriptionOrAbstract,
      similarityScore: 100,
      matchReason: "Featured resource in catalog",
      keyMatches: [c.categoryOrField],
      reads: c.reads,
      fileId: c.fileId,
      coverId: c.coverId,
      cover: c.cover,
    }));
  }

  // 1. Compute query vector
  const queryEmbedding = await getEmbedding(cleanQuery);

  // Fallback if embedding is unavailable (e.g. offline/no key)
  if (!queryEmbedding) {
    const queryTokens = cleanQuery.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    return candidates
      .map((c) => {
        const text = `${c.title} ${c.authors.join(" ")} ${c.categoryOrField} ${c.summary}`.toLowerCase();
        let matches = 0;
        for (const token of queryTokens) {
          if (text.includes(token)) matches++;
        }
        const score = queryTokens.length > 0 ? Math.round((matches / queryTokens.length) * 100) : 50;
        return {
          _id: c.item._id,
          kind: c.kind,
          title: c.title,
          authors: c.authors,
          year: c.year,
          access: c.access,
          categoryOrField: c.categoryOrField,
          descriptionOrAbstract: c.descriptionOrAbstract,
          similarityScore: score,
          matchReason: `Matches topics in ${c.categoryOrField}`,
          keyMatches: [c.categoryOrField],
          reads: c.reads,
          fileId: c.fileId,
          coverId: c.coverId,
          cover: c.cover,
        };
      })
      .filter((c) => c.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  // 2. Compute similarity for each candidate
  const scoredCandidates = await Promise.all(
    candidates.map(async (c) => {
      const itemEmbedding = await ensureEmbedding(c.item, c.kind);
      let similarity = 0;
      if (itemEmbedding) {
        const rawSim = cosineSimilarity(queryEmbedding, itemEmbedding);
        // Normalize cosine score (typically 0.35-0.90) to intuitive 50-99% score
        similarity = Math.max(0, Math.min(99, Math.round(((rawSim - 0.3) / 0.55) * 50 + 50)));
      } else {
        // Fallback text check
        const text = `${c.title} ${c.summary}`.toLowerCase();
        similarity = text.includes(cleanQuery.toLowerCase()) ? 75 : 40;
      }

      return {
        candidate: c,
        score: similarity,
      };
    }),
  );

  // 3. Sort by similarity score descending
  const topMatches = scoredCandidates
    .filter((entry) => entry.score >= 50)
    .sort((a, b) => b.score - a.score || b.candidate.reads - a.candidate.reads)
    .slice(0, limit);

  // 4. Generate AI explanations for top 5 matches in parallel
  const results: SemanticSearchResult[] = await Promise.all(
    topMatches.map(async (entry, index) => {
      const c = entry.candidate;
      let matchReason = `Semantically relevant to "${cleanQuery}"`;

      // Only call explanation for top 5 to conserve speed and tokens
      if (index < 5) {
        matchReason = await explainMatchWithGemini(cleanQuery, {
          title: c.title,
          kind: c.kind === "book" ? "book" : "research paper",
          summary: c.summary,
        });
      }

      return {
        _id: c.item._id,
        kind: c.kind,
        title: c.title,
        authors: c.authors,
        year: c.year,
        access: c.access,
        categoryOrField: c.categoryOrField,
        descriptionOrAbstract: c.descriptionOrAbstract,
        similarityScore: entry.score,
        matchReason,
        keyMatches: [c.categoryOrField],
        reads: c.reads,
        fileId: c.fileId,
        coverId: c.coverId,
        cover: c.cover,
      };
    }),
  );

  return results;
}
