"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { extractPdfExcerpt } from "@/lib/ai/pdf-excerpt";
import { summarizeForCatalog } from "@/lib/ai/summarize";
import { draftFromForm, editsFromForm } from "@/lib/catalog-form";
import { createBook, deleteBook, getBookForStaff, publishBook, rejectBook, setBookSummary, updateBook } from "@/lib/data/books";
import {
  getMemberById,
  grantMembership,
  setMemberAdmin,
  setMemberAuthor,
  setMemberStatus,
} from "@/lib/data/members";
import { readCatalogUploads } from "@/lib/data/files";
import { createPaper, deletePaper, getPaperForStaff, publishPaper, rejectPaper, setPaperSummary, updatePaper } from "@/lib/data/papers";
import { discardGridFsFiles } from "@/lib/db";
import { recordActivity } from "@/lib/data/activity";
import type { PublicationStatus, ResourceKind } from "@/lib/types";

export type CatalogState = {
  error?: string;
  success?: string;
  warning?: string;
};

export type MemberActionState = {
  error?: string;
  success?: string;
};

async function requireActiveAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const member = await getMemberById(session.user.id);
  if (!member || member.status !== "Active" || !member.isAdmin) return null;
  return member;
}

function revalidatePublic(kind?: ResourceKind, id?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/author");
  revalidatePath("/books");
  revalidatePath("/research");
  if (kind === "book" && id) {
    revalidatePath(`/books/${id}`);
    revalidatePath(`/books/${id}/read`);
  }
  if (kind === "paper" && id) {
    revalidatePath(`/research/${id}`);
    revalidatePath(`/research/${id}/read`);
  }
}

function resourceIdentity(formData: FormData): { id: string; kind: ResourceKind } | null {
  const id = String(formData.get("id") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  if (!id || (kind !== "book" && kind !== "paper")) return null;
  return { id, kind };
}

function publicationStatusOf(value: FormDataEntryValue | null): PublicationStatus | null {
  const status = String(value ?? "");
  return status === "pending" || status === "published" || status === "rejected" || status === "withdrawn"
    ? status
    : null;
}

export async function createResourceAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAdmin();
  if (!member) return { error: "You do not have permission to add resources." };

  const draft = draftFromForm(formData, {
    submittedBy: member._id,
    publicationStatus: "published",
  });
  if (!draft.ok) return { error: draft.error };

  const upload = await readCatalogUploads(formData, "optional");
  if (!upload.ok) return { error: upload.error };
  const stored = {
    ...(upload.fileId ? { fileId: upload.fileId } : {}),
    ...(upload.coverId ? { coverId: upload.coverId } : {}),
  };

  if (draft.kind === "paper") {
    try {
      await createPaper({ ...draft.paper, ...stored });
    } catch {
      await discardGridFsFiles([upload.fileId, upload.coverId]);
      return { error: "The paper could not be added. Please try again." };
    }
    await recordActivity({ actorId: member._id, action: "resource.created", targetKind: "paper", targetId: draft.paper._id, detail: `Added paper: ${draft.paper.title}` });
    const warning = await generateAndSaveSummary(
      "paper",
      draft.paper._id,
      draft.paper.title,
      draft.paper.abstract,
      upload.fileId,
    );
    revalidatePublic();
    return { success: "Paper added to the catalog.", ...(warning ? { warning } : {}) };
  }

  try {
    await createBook({ ...draft.book, ...stored });
  } catch {
    await discardGridFsFiles([upload.fileId, upload.coverId]);
    return { error: "The book could not be added. Please try again." };
  }
  await recordActivity({ actorId: member._id, action: "resource.created", targetKind: "book", targetId: draft.book._id, detail: `Added book: ${draft.book.title}` });
  const warning = await generateAndSaveSummary(
    "book",
    draft.book._id,
    draft.book.title,
    draft.book.description,
    upload.fileId,
  );
  revalidatePublic();
  return { success: "Book added to the catalog.", ...(warning ? { warning } : {}) };
}

export async function publishResourceAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAdmin();
  if (!member) return { error: "You do not have permission to publish resources." };

  const id = String(formData.get("id") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  if (!id || (kind !== "book" && kind !== "paper")) {
    return { error: "That submission could not be published." };
  }

  const published = kind === "book" ? await publishBook(id) : await publishPaper(id);
  if (!published) return { error: "That submission is no longer waiting for review." };
  await recordActivity({ actorId: member._id, action: "resource.published", targetKind: kind, targetId: id, detail: `Published ${kind}` });

  revalidatePublic();
  return { success: "Published." };
}

export async function rejectResourceAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAdmin();
  if (!member) return { error: "You do not have permission to reject resources." };

  const id = String(formData.get("id") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "").trim();
  if (!id || (kind !== "book" && kind !== "paper")) {
    return { error: "That submission could not be rejected." };
  }
  if (!reviewNote) return { error: "Add a short note for the author." };
  if (reviewNote.length > 280) return { error: "Keep the note under 280 characters." };

  const rejected = kind === "book" ? await rejectBook(id, reviewNote) : await rejectPaper(id, reviewNote);
  if (!rejected) return { error: "That submission is no longer waiting for review." };
  await recordActivity({ actorId: member._id, action: "resource.rejected", targetKind: kind, targetId: id, detail: `Rejected ${kind}` });

  revalidatePublic();
  return { success: "Rejected." };
}

export async function updateResourceAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAdmin();
  if (!member) return { error: "You do not have permission to edit resources." };

  const resource = resourceIdentity(formData);
  const status = publicationStatusOf(formData.get("publicationStatus"));
  const parsed = editsFromForm(formData);
  if (!resource || !status || !parsed.ok || parsed.kind !== resource.kind) {
    return { error: parsed.ok ? "That resource could not be updated." : parsed.error };
  }

  const upload = await readCatalogUploads(formData, "optional");
  if (!upload.ok) return { error: upload.error };

  try {
    const updated = parsed.kind === "book"
      ? await updateBook(resource.id, parsed.edits, status, upload.fileId, upload.coverId)
      : await updatePaper(resource.id, parsed.edits, status, upload.fileId, upload.coverId);
    if (!updated) {
      await discardGridFsFiles([upload.fileId, upload.coverId]);
      return { error: "That resource could not be found." };
    }
  } catch {
    await discardGridFsFiles([upload.fileId, upload.coverId]);
    return { error: "That resource could not be updated." };
  }
  await recordActivity({ actorId: member._id, action: "resource.updated", targetKind: resource.kind, targetId: resource.id, detail: `Updated ${resource.kind}` });

  let summaryWarning: string | undefined;
  try {
    if (parsed.kind === "book") {
      const book = await getBookForStaff(resource.id);
      if (book && !book.aiSummary) {
        summaryWarning = await generateAndSaveSummary(
          "book",
          resource.id,
          parsed.edits.title,
          parsed.edits.description,
          book.fileId,
        );
      }
    } else {
      const paper = await getPaperForStaff(resource.id);
      if (paper && !paper.aiSummary) {
        summaryWarning = await generateAndSaveSummary(
          "paper",
          resource.id,
          parsed.edits.title,
          parsed.edits.abstract,
          paper.fileId,
        );
      }
    }
  } catch {
    summaryWarning = "The resource was updated, but its AI summary could not be generated. Check the server terminal.";
  }

  revalidatePublic(resource.kind, resource.id);
  return { success: "Resource updated.", ...(summaryWarning ? { warning: summaryWarning } : {}) };
}

async function generateAndSaveSummary(
  kind: ResourceKind,
  id: string,
  title: string,
  fallback: string,
  fileId?: string,
): Promise<string | undefined> {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return "The resource was saved, but its AI summary was skipped because GEMINI_API_KEY is missing.";
  }
  try {
    const excerpt = await extractPdfExcerpt(fileId);
    const summary = await summarizeForCatalog({
      kind,
      title,
      source: excerpt ?? fallback,
      excerpt: Boolean(excerpt),
    });
    if (!summary) return "The resource was saved, but Gemini returned no summary. Check the server terminal for details.";
    if (kind === "book") await setBookSummary(id, summary);
    else await setPaperSummary(id, summary);
    return undefined;
  } catch {
    return "The resource was saved, but AI summary generation failed. Check the server terminal and Gemini API key.";
  }
}

export async function deleteResourceAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAdmin();
  if (!member) return { error: "You do not have permission to delete resources." };

  const resource = resourceIdentity(formData);
  if (!resource) return { error: "That resource could not be deleted." };

  const deleted = resource.kind === "book"
    ? await deleteBook(resource.id)
    : await deletePaper(resource.id);
  if (!deleted) return { error: "That resource could not be found." };
  await recordActivity({ actorId: member._id, action: "resource.deleted", targetKind: resource.kind, targetId: resource.id, detail: `Deleted ${resource.kind}` });

  revalidatePublic(resource.kind, resource.id);
  return { success: "Resource deleted." };
}

export async function manageMemberAction(
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const admin = await requireActiveAdmin();
  if (!admin) return { error: "You do not have permission to manage members." };

  const memberId = String(formData.get("memberId") ?? "").trim();
  const operation = String(formData.get("operation") ?? "");
  if (!memberId) return { error: "Select a member first." };

  if (operation === "membership") {
    const membershipExpiresAt = await grantMembership(memberId);
    if (!membershipExpiresAt) return { error: "Membership could not be updated." };
    await recordActivity({ actorId: admin._id, action: "member.membership_granted", targetKind: "member", targetId: memberId, detail: "Granted or renewed membership" });
    revalidatePath("/admin");
    revalidatePath("/membership");
    return { success: `Membership active through ${membershipExpiresAt}.` };
  }

  if (operation === "make-author" || operation === "remove-author") {
    const enabled = operation === "make-author";
    const updated = await setMemberAuthor(memberId, enabled);
    if (!updated) return { error: "That member could not be found." };
    await recordActivity({ actorId: admin._id, action: enabled ? "member.author_granted" : "member.author_removed", targetKind: "member", targetId: memberId, detail: enabled ? "Granted author access" : "Removed author access" });
    revalidatePath("/admin");
    revalidatePath("/author");
    return { success: enabled ? "Author access granted." : "Author access removed." };
  }

  if (operation === "promote-admin" || operation === "demote-admin") {
    const enabled = operation === "promote-admin";
    if (!enabled && memberId === admin._id) return { error: "You cannot remove your own admin access." };
    const result = await setMemberAdmin(memberId, enabled);
    if (result === "not-found") return { error: "That member could not be found." };
    if (result === "last-admin") return { error: "The last active admin cannot be demoted." };
    await recordActivity({ actorId: admin._id, action: enabled ? "member.admin_granted" : "member.admin_removed", targetKind: "member", targetId: memberId, detail: enabled ? "Granted admin access" : "Removed admin access" });
    revalidatePath("/admin");
    return { success: enabled ? "Admin access granted." : "Admin access removed." };
  }

  if (operation === "suspend" || operation === "unsuspend") {
    const status = operation === "unsuspend" ? "Active" : "Suspended";
    if (status === "Suspended" && memberId === admin._id) {
      return { error: "You cannot suspend your own account." };
    }
    const result = await setMemberStatus(memberId, status);
    if (result === "not-found") return { error: "That member could not be found." };
    if (result === "last-admin") return { error: "The last active admin cannot be suspended." };
    await recordActivity({ actorId: admin._id, action: status === "Active" ? "member.unsuspended" : "member.suspended", targetKind: "member", targetId: memberId, detail: status === "Active" ? "Restored member access" : "Suspended member" });
    revalidatePath("/admin");
    return { success: status === "Active" ? "Member unsuspended." : "Member suspended." };
  }

  return { error: "Choose a valid member action." };
}
