"use server";

import { compareResources } from "@/lib/ai/compare";
import type { ComparisonResult } from "@/lib/ai/compare";
import type { ResourceKind } from "@/lib/types";

export type CompareActionPayload = {
  items: Array<{ id: string; kind: ResourceKind }>;
};

export type CompareActionResponse =
  | { ok: true; data: ComparisonResult }
  | { ok: false; error: string };

export async function compareResourcesAction(
  payload: CompareActionPayload,
): Promise<CompareActionResponse> {
  try {
    const data = await compareResources(payload.items);
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Comparison failed.";
    return { ok: false, error: message };
  }
}
