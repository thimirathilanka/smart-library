import "server-only";

import { collections, deleteGridFsFile } from "@/lib/db";
import { toPlain } from "@/lib/data/serialize";
import { withPublished } from "@/lib/data/publication";
import type { PaperEdits } from "@/lib/catalog-form";
import type { ResearchPaper } from "@/lib/types";

export async function listPapers() {
  const { papers } = await collections();
  return toPlain(await papers.find(withPublished<ResearchPaper>({})).sort({ publishedAt: -1 }).toArray());
}

export async function listAllPapers() {
  const { papers } = await collections();
  return toPlain(await papers.find().sort({ publishedAt: -1 }).toArray());
}

export async function listPapersByAuthor(memberId: string) {
  const { papers } = await collections();
  return toPlain(await papers.find({ submittedBy: memberId }).sort({ addedAt: -1 }).toArray());
}

export async function getPaper(id: string) {
  const { papers } = await collections();
  const paper = await papers.findOne(withPublished<ResearchPaper>({ _id: id }));
  return paper ? toPlain(paper) : null;
}

export async function getPaperForStaff(id: string) {
  const { papers } = await collections();
  const paper = await papers.findOne({ _id: id });
  return paper ? toPlain(paper) : null;
}

export async function latestPapers(limit = 4) {
  const { papers } = await collections();
  return toPlain(
    await papers.find(withPublished<ResearchPaper>({})).sort({ publishedAt: -1 }).limit(limit).toArray(),
  );
}

export async function relatedPapers(paper: ResearchPaper, limit = 3) {
  const { papers } = await collections();
  const sameField = await papers
    .find(withPublished<ResearchPaper>({ _id: { $ne: paper._id }, field: paper.field }))
    .limit(limit)
    .toArray();
  if (sameField.length >= limit) return toPlain(sameField);
  const byKeyword = await papers
    .find(
      withPublished<ResearchPaper>({
        _id: { $nin: [paper._id, ...sameField.map((item) => item._id)] },
        keywords: { $in: paper.keywords },
      }),
    )
    .limit(limit - sameField.length)
    .toArray();
  return toPlain([...sameField, ...byKeyword]);
}

export async function createPaper(paper: ResearchPaper) {
  const { papers } = await collections();
  await papers.insertOne(paper);
}

export async function updatePaper(
  id: string,
  edits: PaperEdits,
  publicationStatus: NonNullable<ResearchPaper["publicationStatus"]>,
  fileId?: string,
) {
  const { papers } = await collections();
  const existing = await papers.findOne({ _id: id });
  if (!existing) return false;
  const result = await papers.updateOne(
    { _id: id },
    { $set: { ...edits, publicationStatus, ...(fileId ? { fileId } : {}) }, $unset: { reviewNote: "" } },
  );
  if (result.matchedCount === 0) return false;
  await removeReplacedFile(existing.fileId, fileId);
  return true;
}

export async function deletePaper(id: string) {
  const { papers } = await collections();
  const paper = await papers.findOne({ _id: id });
  if (!paper) return false;
  if (paper.fileId) await deleteGridFsFile(paper.fileId);
  const result = await papers.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

export async function publishPaper(id: string) {
  const { papers } = await collections();
  const result = await papers.updateOne(
    { _id: id, publicationStatus: "pending" },
    { $set: { publicationStatus: "published" }, $unset: { reviewNote: "" } },
  );
  return result.matchedCount > 0;
}

export async function rejectPaper(id: string, reviewNote: string) {
  const { papers } = await collections();
  const result = await papers.updateOne(
    { _id: id, publicationStatus: "pending" },
    { $set: { publicationStatus: "rejected", reviewNote } },
  );
  return result.matchedCount > 0;
}

export async function resubmitPaper(id: string, submittedBy: string, edits: PaperEdits, fileId?: string) {
  const { papers } = await collections();
  const existing = await papers.findOne({ _id: id, submittedBy, publicationStatus: "rejected" });
  if (!existing) return false;
  const result = await papers.updateOne(
    { _id: id, submittedBy, publicationStatus: "rejected" },
    { $set: { ...edits, publicationStatus: "pending", ...(fileId ? { fileId } : {}) }, $unset: { reviewNote: "" } },
  );
  if (result.matchedCount === 0) return false;
  await removeReplacedFile(existing.fileId, fileId);
  return true;
}

async function removeReplacedFile(previousId?: string, nextId?: string) {
  if (!nextId || !previousId || previousId === nextId) return;
  try {
    await deleteGridFsFile(previousId);
  } catch {
    // The resource already points at the replacement.
  }
}

export async function incrementPaperReads(id: string) {
  const { papers } = await collections();
  await papers.updateOne({ _id: id }, { $inc: { reads: 1 } });
}
