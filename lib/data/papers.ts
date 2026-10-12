import "server-only";

import { collections, deleteGridFsFile, discardGridFsFiles } from "@/lib/db";
import { toPlain } from "@/lib/data/serialize";
import { withPublished } from "@/lib/data/publication";
import type { PaperEdits } from "@/lib/catalog-form";
import type { PaperRevision, ResearchPaper } from "@/lib/types";

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
  coverId?: string,
) {
  const { papers } = await collections();
  const existing = await papers.findOne({ _id: id });
  if (!existing) return false;
  const result = await papers.updateOne(
    { _id: id },
    {
      $set: {
        ...edits,
        publicationStatus,
        ...(fileId ? { fileId } : {}),
        ...(coverId ? { coverId } : {}),
      },
      $unset: { reviewNote: "" },
    },
  );
  if (result.matchedCount === 0) return false;
  await removeReplacedFile(existing.fileId, fileId);
  await removeReplacedFile(existing.coverId, coverId);
  return true;
}

export async function deletePaper(id: string) {
  const { papers } = await collections();
  const paper = await papers.findOne({ _id: id });
  if (!paper) return false;
  const result = await papers.deleteOne({ _id: id });
  if (result.deletedCount === 0) return false;
  await discardGridFsFiles([paper.fileId, paper.coverId, paper.revision?.fileId, paper.revision?.coverId]);
  return true;
}

export async function publishPaper(id: string) {
  const { papers } = await collections();
  const paper = await papers.findOne({ _id: id });
  if (!paper) return false;
  if (paper.publicationStatus === "pending") {
    const result = await papers.updateOne(
      { _id: id, publicationStatus: "pending" },
      { $set: { publicationStatus: "published" }, $unset: { reviewNote: "" } },
    );
    return result.matchedCount > 0;
  }
  if (paper.revision?.status !== "pending") return false;
  return applyPaperRevision(paper);
}

export async function rejectPaper(id: string, reviewNote: string) {
  const { papers } = await collections();
  const paper = await papers.findOne({ _id: id });
  if (!paper) return false;
  if (paper.publicationStatus === "pending") {
    const result = await papers.updateOne(
      { _id: id, publicationStatus: "pending" },
      { $set: { publicationStatus: "rejected", reviewNote } },
    );
    return result.matchedCount > 0;
  }
  if (paper.revision?.status !== "pending") return false;
  const result = await papers.updateOne(
    { _id: id, "revision.status": "pending" },
    { $set: { "revision.status": "rejected", "revision.reviewNote": reviewNote } },
  );
  return result.matchedCount > 0;
}

export async function resubmitPaper(
  id: string,
  submittedBy: string,
  edits: PaperEdits,
  fileId?: string,
  coverId?: string,
  clearCover = false,
) {
  const { papers } = await collections();
  const existing = await papers.findOne({
    _id: id,
    submittedBy,
    publicationStatus: { $in: ["pending", "rejected", "withdrawn"] },
  });
  if (!existing) return false;
  const result = await papers.updateOne(
    { _id: id, submittedBy, publicationStatus: existing.publicationStatus },
    {
      $set: {
        ...edits,
        publicationStatus: "pending",
        ...(fileId ? { fileId } : {}),
        ...(coverId ? { coverId } : {}),
      },
      $unset: { reviewNote: "", aiSummary: "", ...(clearCover && !coverId ? { coverId: "" } : {}) },
    },
  );
  if (result.matchedCount === 0) return false;
  await removeReplacedFile(existing.fileId, fileId);
  if (coverId) await removeReplacedFile(existing.coverId, coverId);
  else if (clearCover) await discardGridFsFiles([existing.coverId]);
  return true;
}

export async function withdrawPaper(id: string, submittedBy: string) {
  const { papers } = await collections();
  const result = await papers.updateOne(
    { _id: id, submittedBy, publicationStatus: "pending" },
    { $set: { publicationStatus: "withdrawn" } },
  );
  return result.matchedCount > 0;
}

export async function deleteAuthorPaper(id: string, submittedBy: string) {
  const { papers } = await collections();
  const paper = await papers.findOne({
    _id: id,
    submittedBy,
    publicationStatus: { $in: ["pending", "rejected", "withdrawn"] },
  });
  if (!paper) return false;
  const result = await papers.deleteOne({ _id: id, submittedBy, publicationStatus: paper.publicationStatus });
  if (result.deletedCount === 0) return false;
  await discardGridFsFiles([paper.fileId, paper.coverId]);
  return true;
}

export async function submitPaperRevision(
  id: string,
  submittedBy: string,
  edits: PaperEdits,
  fileId?: string,
  coverId?: string,
  clearCover = false,
) {
  const { papers } = await collections();
  const existing = await papers.findOne({ _id: id, submittedBy });
  if (!existing || (existing.publicationStatus && existing.publicationStatus !== "published")) return false;
  const previous = existing.revision;
  const nextFileId = fileId ?? previous?.fileId;
  const nextCoverId = coverId ?? (clearCover ? undefined : previous?.coverId);
  const dropCover = clearCover && !nextCoverId;
  const revision: PaperRevision = {
    status: "pending",
    submittedAt: new Date().toISOString().slice(0, 10),
    ...edits,
    ...(nextFileId ? { fileId: nextFileId } : {}),
    ...(nextCoverId ? { coverId: nextCoverId } : {}),
    ...(dropCover ? { clearCover: true } : {}),
  };
  const result = await papers.updateOne({ _id: id, submittedBy }, { $set: { revision } });
  if (result.matchedCount === 0) return false;
  if (fileId) await removeReplacedFile(distinctFrom(previous?.fileId, existing.fileId), fileId);
  if (coverId) await removeReplacedFile(distinctFrom(previous?.coverId, existing.coverId), coverId);
  else if (dropCover) await discardGridFsFiles([distinctFrom(previous?.coverId, existing.coverId)]);
  return true;
}

export async function cancelPaperRevision(id: string, submittedBy: string) {
  const { papers } = await collections();
  const existing = await papers.findOne({ _id: id, submittedBy });
  if (!existing?.revision) return false;
  const result = await papers.updateOne({ _id: id, submittedBy }, { $unset: { revision: "" } });
  if (result.matchedCount === 0) return false;
  await discardGridFsFiles([
    distinctFrom(existing.revision.fileId, existing.fileId),
    distinctFrom(existing.revision.coverId, existing.coverId),
  ]);
  return true;
}

export async function setPaperRevisionSummary(id: string, aiSummary: string) {
  const { papers } = await collections();
  await papers.updateOne({ _id: id, "revision.status": "pending" }, { $set: { "revision.aiSummary": aiSummary } });
}

async function applyPaperRevision(paper: ResearchPaper) {
  const revision = paper.revision;
  if (!revision) return false;
  const { papers } = await collections();
  const nextFileId = revision.fileId ?? paper.fileId;
  const nextCoverId = revision.clearCover && !revision.coverId ? undefined : (revision.coverId ?? paper.coverId);
  const result = await papers.updateOne(
    { _id: paper._id, "revision.status": "pending" },
    {
      $set: {
        title: revision.title,
        authors: revision.authors,
        abstract: revision.abstract,
        field: revision.field,
        year: revision.year,
        doi: revision.doi,
        access: revision.access,
        publicationStatus: "published",
        ...(nextFileId ? { fileId: nextFileId } : {}),
        ...(nextCoverId ? { coverId: nextCoverId } : {}),
        ...(revision.aiSummary ? { aiSummary: revision.aiSummary } : {}),
      },
      $unset: {
        revision: "",
        reviewNote: "",
        ...(!nextFileId ? { fileId: "" } : {}),
        ...(!nextCoverId ? { coverId: "" } : {}),
        ...(!revision.aiSummary ? { aiSummary: "" } : {}),
      },
    },
  );
  if (result.matchedCount === 0) return false;
  if (revision.fileId) await removeReplacedFile(paper.fileId, revision.fileId);
  if (revision.coverId) await removeReplacedFile(paper.coverId, revision.coverId);
  else if (revision.clearCover) await discardGridFsFiles([paper.coverId]);
  return true;
}

function distinctFrom(candidate: string | undefined, liveId: string | undefined) {
  if (!candidate || candidate === liveId) return undefined;
  return candidate;
}

async function removeReplacedFile(previousId?: string, nextId?: string) {
  if (!nextId || !previousId || previousId === nextId) return;
  try {
    await deleteGridFsFile(previousId);
  } catch {
    // The resource already points at the replacement.
  }
}

export async function setPaperSummary(id: string, aiSummary: string) {
  const { papers } = await collections();
  await papers.updateOne({ _id: id }, { $set: { aiSummary } });
}

export async function incrementPaperReads(id: string) {
  const { papers } = await collections();
  await papers.updateOne({ _id: id }, { $inc: { reads: 1 } });
}
