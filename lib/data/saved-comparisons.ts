import "server-only";

import { collections } from "@/lib/db";
import { toPlain } from "@/lib/data/serialize";
import type {
  ComparisonPurpose,
  ComparisonReport,
  DocumentSnapshot,
  SavedComparisonRecord,
  SavedComparisonSummary,
} from "@/lib/types";

export async function saveComparisonRecord(params: {
  userId: string;
  title: string;
  purpose: ComparisonPurpose;
  customQuestion?: string;
  resourceIds: string[];
  resourceSnapshots: DocumentSnapshot[];
  report: ComparisonReport;
}): Promise<SavedComparisonRecord> {
  const { savedComparisons } = await collections();

  const id = `cmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const record: SavedComparisonRecord = {
    _id: id,
    userId: params.userId,
    title: params.title.trim() || `Comparison: ${params.resourceSnapshots.map((r) => r.title).slice(0, 2).join(" vs ")}`,
    purpose: params.purpose,
    customQuestion: params.customQuestion?.trim() || undefined,
    resourceIds: params.resourceIds,
    resourceSnapshots: params.resourceSnapshots,
    report: params.report,
    createdAt: now,
    updatedAt: now,
  };

  await savedComparisons.insertOne(record);
  return toPlain(record);
}

export async function listUserSavedComparisons(userId: string): Promise<SavedComparisonSummary[]> {
  const { savedComparisons } = await collections();

  const records = await savedComparisons
    .find({ userId })
    .sort({ updatedAt: -1 })
    .project<SavedComparisonRecord>({
      _id: 1,
      title: 1,
      purpose: 1,
      resourceIds: 1,
      resourceSnapshots: 1,
      createdAt: 1,
      updatedAt: 1,
    })
    .toArray();

  return toPlain(
    records.map((r) => ({
      _id: r._id,
      title: r.title,
      purpose: r.purpose,
      resourceCount: r.resourceIds?.length || r.resourceSnapshots?.length || 0,
      resourceTitles: r.resourceSnapshots?.map((s) => s.title) || [],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  );
}

export async function getSavedComparison(id: string, userId: string): Promise<SavedComparisonRecord | null> {
  const { savedComparisons } = await collections();
  const record = await savedComparisons.findOne({ _id: id, userId });
  return record ? toPlain(record) : null;
}

export async function renameSavedComparison(
  id: string,
  userId: string,
  newTitle: string,
): Promise<boolean> {
  const { savedComparisons } = await collections();
  const cleanTitle = newTitle.trim();
  if (!cleanTitle) return false;

  const result = await savedComparisons.updateOne(
    { _id: id, userId },
    {
      $set: {
        title: cleanTitle,
        updatedAt: new Date().toISOString(),
      },
    },
  );

  return result.modifiedCount > 0;
}

export async function deleteSavedComparison(id: string, userId: string): Promise<boolean> {
  const { savedComparisons } = await collections();
  const result = await savedComparisons.deleteOne({ _id: id, userId });
  return result.deletedCount > 0;
}

