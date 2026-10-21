"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { extractPdfExcerpt, getPdfPageCount } from "@/lib/ai/pdf-excerpt";
import { summarizeForCatalog } from "@/lib/ai/summarize";
import { draftFromForm, editsFromForm } from "@/lib/catalog-form";
import {
  cancelBookRevision,
  createBook,
  deleteAuthorBook,
  getBookForStaff,
  resubmitBook,
  setBookRevisionSummary,
  setBookSummary,
  submitBookRevision,
  withdrawBook,
} from "@/lib/data/books";
import { readCatalogUploads } from "@/lib/data/files";
import { getMemberById } from "@/lib/data/members";
import {
  cancelPaperRevision,
  createPaper,
  deleteAuthorPaper,
  getPaperForStaff,
  resubmitPaper,
  setPaperRevisionSummary,
  setPaperSummary,
  submitPaperRevision,
  withdrawPaper,
} from "@/lib/data/papers";
import { discardGridFsFiles } from "@/lib/db";
import { recordActivity } from "@/lib/data/activity";
import { notifyAdmins } from "@/lib/data/notifications";
import type { ResourceKind } from "@/lib/types";

export type CatalogState = {
  error?: string;
  success?: string;
  warning?: string;
};

async function requireActiveAuthor() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const member = await getMemberById(session.user.id);
  if (!member || member.status !== "Active" || !member.isAuthor) return null;
  return member;
}

function resourceIdentity(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  if (!id || (kind !== "book" && kind !== "paper")) return null;
  return { id, kind: kind as ResourceKind };
}

export async function submitResourceAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAuthor();
  if (!member) return { error: "You do not have permission to submit resources." };

  const draft = draftFromForm(formData, {
    submittedBy: member._id,
    publicationStatus: "pending",
  });
  if (!draft.ok) return { error: draft.error };

  const upload = await readCatalogUploads(formData, "required");
  if (!upload.ok) return { error: upload.error };

  let summaryWarning: string | undefined;
  if (draft.kind === "paper") {
    try {
      await createPaper({
        ...draft.paper,
        fileId: upload.fileId,
        ...(upload.coverId ? { coverId: upload.coverId } : {}),
      });
    } catch {
      await discardGridFsFiles([upload.fileId, upload.coverId]);
      return { error: "The paper could not be submitted. Please try again." };
    }
    await recordActivity({ actorId: member._id, action: "author.resource_submitted", targetKind: "paper", targetId: draft.paper._id, detail: `Submitted paper: ${draft.paper.title}` });
    await notifyAdmins({ title: "New paper to review", message: `${member.name} submitted “${draft.paper.title}”.`, href: "/admin" }, member._id);
    summaryWarning = await storeSummary("paper", draft.paper._id, draft.paper.title, draft.paper.abstract);
  } else {
    try {
      await createBook({
        ...draft.book,
        fileId: upload.fileId!,
        ...(upload.coverId ? { coverId: upload.coverId } : {}),
      });
    } catch {
      await discardGridFsFiles([upload.fileId, upload.coverId]);
      return { error: "The book could not be submitted. Please try again." };
    }
    await recordActivity({ actorId: member._id, action: "author.resource_submitted", targetKind: "book", targetId: draft.book._id, detail: `Submitted book: ${draft.book.title}` });
    await notifyAdmins({ title: "New book to review", message: `${member.name} submitted “${draft.book.title}”.`, href: "/admin" }, member._id);
    summaryWarning = await storeSummary("book", draft.book._id, draft.book.title, draft.book.description);
  }

  revalidatePath("/author");
  revalidatePath("/admin");
  return {
    success: "Submitted for review. It stays hidden until an admin publishes it.",
    ...(summaryWarning ? { warning: summaryWarning } : {}),
  };
}

export async function resubmitResourceAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAuthor();
  if (!member) return { error: "You do not have permission to submit resources." };

  const id = String(formData.get("id") ?? "").trim();
  const parsed = editsFromForm(formData);
  if (!id) return { error: "This submission cannot be edited." };
  if (!parsed.ok) return { error: parsed.error };

  const upload = await readCatalogUploads(formData, "optional");
  if (!upload.ok) return { error: upload.error };

  let updated = false;
  try {
    updated =
      parsed.kind === "book"
        ? await resubmitBook(id, member._id, parsed.edits, upload.fileId, upload.coverId, upload.clearCover)
        : await resubmitPaper(id, member._id, parsed.edits, upload.fileId, upload.coverId, upload.clearCover);
  } catch {
    await discardGridFsFiles([upload.fileId, upload.coverId]);
    return { error: "This submission could not be sent back for review." };
  }
  if (!updated) {
    await discardGridFsFiles([upload.fileId, upload.coverId]);
    return { error: "Only your unpublished submission can be edited and sent for review." };
  }
  await recordActivity({ actorId: member._id, action: "author.resource_resubmitted", targetKind: parsed.kind, targetId: id, detail: `Resubmitted ${parsed.kind}: ${parsed.edits.title}` });
  await notifyAdmins({ title: "Submission resubmitted", message: `${member.name} updated “${parsed.edits.title}” for review.`, href: "/admin" }, member._id);

  const summaryWarning = await storeSummary(
    parsed.kind,
    id,
    parsed.edits.title,
    parsed.kind === "book" ? parsed.edits.description : parsed.edits.abstract,
  );

  revalidatePath("/author");
  revalidatePath("/admin");
  return { success: "Sent for review.", ...(summaryWarning ? { warning: summaryWarning } : {}) };
}

export async function submitRevisionAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAuthor();
  if (!member) return { error: "You do not have permission to submit resources." };

  const id = String(formData.get("id") ?? "").trim();
  const parsed = editsFromForm(formData);
  if (!id) return { error: "This title cannot be updated." };
  if (!parsed.ok) return { error: parsed.error };

  const upload = await readCatalogUploads(formData, "optional");
  if (!upload.ok) return { error: upload.error };

  let updated = false;
  try {
    updated =
      parsed.kind === "book"
        ? await submitBookRevision(id, member._id, parsed.edits, upload.fileId, upload.coverId, upload.clearCover)
        : await submitPaperRevision(id, member._id, parsed.edits, upload.fileId, upload.coverId, upload.clearCover);
  } catch {
    await discardGridFsFiles([upload.fileId, upload.coverId]);
    return { error: "The new version could not be sent for review." };
  }
  if (!updated) {
    await discardGridFsFiles([upload.fileId, upload.coverId]);
    return { error: "Only a published title you submitted can get a new version." };
  }
  await recordActivity({ actorId: member._id, action: "author.revision_submitted", targetKind: parsed.kind, targetId: id, detail: `Submitted a new version of ${parsed.kind}: ${parsed.edits.title}` });
  await notifyAdmins({ title: "New version to review", message: `${member.name} submitted a new version of “${parsed.edits.title}”.`, href: "/admin" }, member._id);

  const summaryWarning = await storeRevisionSummary(
    parsed.kind,
    id,
    parsed.edits.title,
    parsed.kind === "book" ? parsed.edits.description : parsed.edits.abstract,
  );

  revalidatePath("/author");
  revalidatePath("/admin");
  return {
    success: "New version sent for review. The published copy stays online.",
    ...(summaryWarning ? { warning: summaryWarning } : {}),
  };
}

export async function cancelRevisionAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAuthor();
  if (!member) return { error: "You do not have permission to submit resources." };
  const resource = resourceIdentity(formData);
  if (!resource) return { error: "That version could not be cancelled." };

  const cancelled =
    resource.kind === "book"
      ? await cancelBookRevision(resource.id, member._id)
      : await cancelPaperRevision(resource.id, member._id);
  if (!cancelled) return { error: "There is no version to cancel." };
  await recordActivity({ actorId: member._id, action: "author.revision_cancelled", targetKind: resource.kind, targetId: resource.id, detail: `Cancelled ${resource.kind} revision` });

  revalidatePath("/author");
  revalidatePath("/admin");
  return { success: "The new version was cancelled. The published copy is unchanged." };
}

export async function withdrawResourceAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAuthor();
  if (!member) return { error: "You do not have permission to submit resources." };
  const resource = resourceIdentity(formData);
  if (!resource) return { error: "That submission could not be withdrawn." };

  const withdrawn =
    resource.kind === "book"
      ? await withdrawBook(resource.id, member._id)
      : await withdrawPaper(resource.id, member._id);
  if (!withdrawn) return { error: "Only a submission waiting for review can be withdrawn." };
  await recordActivity({ actorId: member._id, action: "author.resource_withdrawn", targetKind: resource.kind, targetId: resource.id, detail: `Withdrew ${resource.kind} from review` });

  revalidatePath("/author");
  revalidatePath("/admin");
  return { success: "Withdrawn from review. You can edit it and send it again." };
}

export async function deleteAuthorResourceAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAuthor();
  if (!member) return { error: "You do not have permission to submit resources." };
  const resource = resourceIdentity(formData);
  if (!resource) return { error: "That submission could not be deleted." };

  const deleted =
    resource.kind === "book"
      ? await deleteAuthorBook(resource.id, member._id)
      : await deleteAuthorPaper(resource.id, member._id);
  if (!deleted) return { error: "Only your unpublished submission can be deleted." };
  await recordActivity({ actorId: member._id, action: "author.resource_deleted", targetKind: resource.kind, targetId: resource.id, detail: `Deleted own ${resource.kind} submission` });

  revalidatePath("/author");
  revalidatePath("/admin");
  return { success: "Submission deleted." };
}

async function storeSummary(kind: ResourceKind, id: string, title: string, fallback: string): Promise<string | undefined> {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return "The submission was saved, but its AI summary was skipped because GEMINI_API_KEY is missing.";
  }
  try {
    const summary = await summarizeSavedPdf(kind, id, title, fallback, false);
    if (!summary) return "The submission was saved, but Gemini returned no summary. Check the server terminal for details.";
    if (kind === "book") await setBookSummary(id, summary);
    else await setPaperSummary(id, summary);
    return undefined;
  } catch {
    return "The submission was saved, but AI summary generation failed. Check the server terminal and Gemini API key.";
  }
}

async function storeRevisionSummary(kind: ResourceKind, id: string, title: string, fallback: string): Promise<string | undefined> {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return "The version was saved, but its AI summary was skipped because GEMINI_API_KEY is missing.";
  }
  try {
    const summary = await summarizeSavedPdf(kind, id, title, fallback, true);
    if (!summary) return "The version was saved, but Gemini returned no summary. Check the server terminal for details.";
    if (kind === "book") await setBookRevisionSummary(id, summary);
    else await setPaperRevisionSummary(id, summary);
    return undefined;
  } catch {
    return "The version was saved, but AI summary generation failed. Check the server terminal and Gemini API key.";
  }
}

async function summarizeSavedPdf(
  kind: ResourceKind,
  id: string,
  title: string,
  fallback: string,
  revision: boolean,
) {
  const fileId = await savedPdfId(kind, id, revision);
  const excerpt = await extractPdfExcerpt(fileId);
  return summarizeForCatalog({
    kind,
    title,
    source: excerpt ?? fallback,
    excerpt: Boolean(excerpt),
  });
}

async function savedPdfId(kind: ResourceKind, id: string, revision: boolean) {
  if (kind === "book") {
    const book = await getBookForStaff(id);
    if (!book) return undefined;
    return revision ? book.revision?.fileId || book.fileId : book.fileId;
  }
  const paper = await getPaperForStaff(id);
  if (!paper) return undefined;
  return revision ? paper.revision?.fileId || paper.fileId : paper.fileId;
}
