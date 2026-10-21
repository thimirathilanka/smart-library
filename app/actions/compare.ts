"use server";

import { auth } from "@/auth";
import { fetchResource } from "@/lib/ai/compare";
import { prepareDocumentInfo, runAiDocumentComparison, askComparisonFollowUp } from "@/lib/ai/compare-engine";
import {
  saveComparisonRecord,
  listUserSavedComparisons,
  getSavedComparison,
  renameSavedComparison,
  deleteSavedComparison,
} from "@/lib/data/saved-comparisons";
import type {
  ComparisonPurpose,
  ComparisonReport,
  ResourceKind,
  SavedComparisonRecord,
  SavedComparisonSummary,
} from "@/lib/types";

export type GenerateComparisonPayload = {
  items: Array<{ id: string; kind: ResourceKind }>;
  purpose: ComparisonPurpose;
  customQuestion?: string;
};

export type GenerateComparisonResponse =
  | { ok: true; data: ComparisonReport }
  | { ok: false; error: string };

export async function generateComparisonReportAction(
  payload: GenerateComparisonPayload,
): Promise<GenerateComparisonResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Please log in to compare documents." };
  }

  const { items, purpose, customQuestion } = payload;
  if (!items || items.length < 2 || items.length > 4) {
    return { ok: false, error: "Please select between 2 and 4 documents to compare." };
  }

  try {
    // 1. Fetch resources
    const fetched = await Promise.all(items.map((it) => fetchResource(it.id, it.kind)));
    const valid = fetched.filter((f): f is NonNullable<typeof f> => f !== null);

    if (valid.length < 2) {
      return { ok: false, error: "Could not load enough accessible documents to compare." };
    }

    // 2. Prepare document info with real page excerpts
    const rawDocs = await Promise.all(
      valid.map((doc) =>
        prepareDocumentInfo({
          _id: doc._id,
          kind: doc.kind,
          title: doc.title,
          authors: doc.authors,
          year: doc.year,
          categoryOrField: doc.categoryOrField,
          coverId: doc.coverId,
          cover: doc.cover,
          fileId: doc.fileId,
          descriptionOrAbstract: doc.descriptionOrAbstract,
          aiSummary: doc.aiSummary,
          keywords: doc.keywords,
          publisherOrVenue: doc.publisher || doc.venue,
        }),
      ),
    );

    // 3. Run AI comparison engine
    const report = await runAiDocumentComparison({
      documents: rawDocs,
      purpose,
      customQuestion,
    });

    return { ok: true, data: report };
  } catch (err) {
    console.error("[compareAction] Generation failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to generate comparison report.",
    };
  }
}

export async function askComparisonQuestionAction(payload: {
  report: ComparisonReport;
  question: string;
}): Promise<{ ok: true; answer: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Please log in to ask questions." };
  }

  const q = payload.question?.trim();
  if (!q) return { ok: false, error: "Please enter a valid question." };

  try {
    const answer = await askComparisonFollowUp({
      report: payload.report,
      question: q,
    });
    return { ok: true, answer };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to answer question.",
    };
  }
}

export async function saveComparisonReportAction(payload: {
  title?: string;
  report: ComparisonReport;
}): Promise<{ ok: true; record: SavedComparisonRecord } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Please log in to save comparisons." };
  }

  try {
    const record = await saveComparisonRecord({
      userId: session.user.id,
      title: payload.title || `Comparison of ${payload.report.resources.map((r) => r.title).slice(0, 2).join(" vs ")}`,
      purpose: payload.report.purpose,
      customQuestion: payload.report.customQuestion,
      resourceIds: payload.report.resources.map((r) => r._id),
      resourceSnapshots: payload.report.resources,
      report: payload.report,
    });
    return { ok: true, record };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save comparison report.",
    };
  }
}

export async function listSavedComparisonsAction(): Promise<
  { ok: true; data: SavedComparisonSummary[] } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Please log in to view saved reports." };
  }

  try {
    const list = await listUserSavedComparisons(session.user.id);
    return { ok: true, data: list };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load saved reports.",
    };
  }
}

export async function getSavedComparisonAction(
  id: string,
): Promise<{ ok: true; data: SavedComparisonRecord } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Please log in to view this report." };
  }

  try {
    const report = await getSavedComparison(id, session.user.id);
    if (!report) return { ok: false, error: "Saved report not found." };
    return { ok: true, data: report };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load saved report.",
    };
  }
}

export async function renameSavedComparisonAction(
  id: string,
  newTitle: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Please log in." };
  }

  try {
    const ok = await renameSavedComparison(id, session.user.id, newTitle);
    if (!ok) return { ok: false, error: "Report not found or not modified." };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to rename report.",
    };
  }
}

export async function deleteSavedComparisonAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Please log in." };
  }

  try {
    const ok = await deleteSavedComparison(id, session.user.id);
    if (!ok) return { ok: false, error: "Report not found or already deleted." };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete report.",
    };
  }
}
