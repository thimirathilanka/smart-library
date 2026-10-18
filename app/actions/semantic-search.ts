"use server";

import { searchCatalogSemantically, type SemanticSearchResult } from "@/lib/ai/semantic-search";
import type { AccessType } from "@/lib/types";

export type SemanticSearchResponse = {
  success: boolean;
  results?: SemanticSearchResult[];
  error?: string;
};

export async function executeSemanticSearchAction(
  query: string,
  filters?: {
    kind?: "all" | "book" | "paper";
    categoryOrField?: string;
    year?: string;
    access?: "all" | AccessType;
  },
): Promise<SemanticSearchResponse> {
  const clean = query.trim();
  if (clean.length < 2) {
    return { success: false, error: "Please enter at least 2 characters to search." };
  }

  try {
    const results = await searchCatalogSemantically({
      query: clean,
      kind: filters?.kind ?? "all",
      categoryOrField: filters?.categoryOrField ?? "all",
      year: filters?.year ?? "all",
      access: filters?.access ?? "all",
      limit: 24,
    });

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error("Failed to execute semantic search:", error);
    return {
      success: false,
      error: "An error occurred while performing semantic search. Please try again.",
    };
  }
}
