"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { draftFromForm, editsFromForm } from "@/lib/catalog-form";
import { createBook, deleteBook, publishBook, rejectBook, updateBook } from "@/lib/data/books";
import {
  getMemberById,
  grantMembership,
  setMemberAdmin,
  setMemberAuthor,
  setMemberStatus,
} from "@/lib/data/members";
import { savePdfUpload } from "@/lib/data/files";
import { createPaper, deletePaper, publishPaper, rejectPaper, updatePaper } from "@/lib/data/papers";
import { deleteGridFsFile } from "@/lib/db";
import type { PublicationStatus, ResourceKind } from "@/lib/types";

export type CatalogState = {
  error?: string;
  success?: string;
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
  return status === "pending" || status === "published" || status === "rejected" ? status : null;
}

export async function createResourceAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAdmin();
  if (!member) return { error: "You do not have permission to add resources." };

  const draft = draftFromForm(formData, {
    submittedBy: member._id,
    publicationStatus: "published",
  });
  if (!draft.ok) return { error: draft.error };

  if (draft.kind === "paper") {
    const fileValue = formData.get("file");
    let fileId: string | undefined;
    if (fileValue instanceof File && fileValue.size > 0) {
      const upload = await savePdfUpload(fileValue);
      if (!upload.ok) return { error: upload.error };
      fileId = upload.fileId;
    }
    try {
      await createPaper({ ...draft.paper, ...(fileId ? { fileId } : {}) });
    } catch {
      if (fileId) await deleteGridFsFile(fileId);
      return { error: "The paper could not be added. Please try again." };
    }
    revalidatePublic();
    return { success: "Paper added to the catalog." };
  }

  const fileValue = formData.get("file");
  let fileId: string | undefined;
  if (fileValue instanceof File && fileValue.size > 0) {
    const upload = await savePdfUpload(fileValue);
    if (!upload.ok) return { error: upload.error };
    fileId = upload.fileId;
  }
  try {
    await createBook({ ...draft.book, ...(fileId ? { fileId } : {}) });
  } catch {
    if (fileId) await deleteGridFsFile(fileId);
    return { error: "The book could not be added. Please try again." };
  }
  revalidatePublic();
  return { success: "Book added to the catalog." };
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

  const updated = parsed.kind === "book"
    ? await updateBook(resource.id, parsed.edits, status)
    : await updatePaper(resource.id, parsed.edits, status);
  if (!updated) return { error: "That resource could not be found." };

  revalidatePublic(resource.kind, resource.id);
  return { success: "Resource updated." };
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
    revalidatePath("/admin");
    revalidatePath("/membership");
    return { success: `Membership active through ${membershipExpiresAt}.` };
  }

  if (operation === "make-author" || operation === "remove-author") {
    const enabled = operation === "make-author";
    const updated = await setMemberAuthor(memberId, enabled);
    if (!updated) return { error: "That member could not be found." };
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
    revalidatePath("/admin");
    return { success: status === "Active" ? "Member unsuspended." : "Member suspended." };
  }

  return { error: "Choose a valid member action." };
}
