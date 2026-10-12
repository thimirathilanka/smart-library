"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { summarizeForCatalog } from "@/lib/ai/summarize";
import { draftFromForm, editsFromForm } from "@/lib/catalog-form";
import { createBook, resubmitBook, setBookSummary } from "@/lib/data/books";
import { savePdfUpload, saveReplacementPdf } from "@/lib/data/files";
import { getMemberById } from "@/lib/data/members";
import { createPaper, resubmitPaper, setPaperSummary } from "@/lib/data/papers";
import { deleteGridFsFile } from "@/lib/db";
import type { ResourceKind } from "@/lib/types";

export type CatalogState = {
  error?: string;
  success?: string;
};

async function requireActiveAuthor() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const member = await getMemberById(session.user.id);
  if (!member || member.status !== "Active" || !member.isAuthor) return null;
  return member;
}

export async function submitResourceAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAuthor();
  if (!member) return { error: "You do not have permission to submit resources." };

  const draft = draftFromForm(formData, {
    submittedBy: member._id,
    publicationStatus: "pending",
  });
  if (!draft.ok) return { error: draft.error };

  if (draft.kind === "paper") {
    const upload = await savePdfUpload(formData.get("file"));
    if (!upload.ok) return { error: upload.error };
    try {
      await createPaper({ ...draft.paper, fileId: upload.fileId });
    } catch {
      await deleteGridFsFile(upload.fileId);
      return { error: "The paper could not be submitted. Please try again." };
    }
    await storeSummary("paper", draft.paper._id, draft.paper.title, draft.paper.abstract);
  } else {
    const upload = await savePdfUpload(formData.get("file"));
    if (!upload.ok) return { error: upload.error };
    try {
      await createBook({ ...draft.book, fileId: upload.fileId });
    } catch {
      await deleteGridFsFile(upload.fileId);
      return { error: "The book could not be submitted. Please try again." };
    }
    await storeSummary("book", draft.book._id, draft.book.title, draft.book.description);
  }

  revalidatePath("/author");
  revalidatePath("/admin");
  return { success: "Submitted for review. It stays hidden until an admin publishes it." };
}

export async function resubmitResourceAction(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const member = await requireActiveAuthor();
  if (!member) return { error: "You do not have permission to submit resources." };

  const id = String(formData.get("id") ?? "").trim();
  const parsed = editsFromForm(formData);
  if (!id) return { error: "This submission cannot be edited." };
  if (!parsed.ok) return { error: parsed.error };

  const upload = await saveReplacementPdf(formData.get("file"));
  if (!upload.ok) return { error: upload.error };

  let updated = false;
  try {
    updated =
      parsed.kind === "book"
        ? await resubmitBook(id, member._id, parsed.edits, upload.fileId)
        : await resubmitPaper(id, member._id, parsed.edits, upload.fileId);
  } catch {
    if (upload.fileId) await deleteGridFsFile(upload.fileId);
    return { error: "This submission could not be sent back for review." };
  }
  if (!updated) {
    if (upload.fileId) await deleteGridFsFile(upload.fileId);
    return { error: "Only a rejected submission can be edited and sent back for review." };
  }

  await storeSummary(
    parsed.kind,
    id,
    parsed.edits.title,
    parsed.kind === "book" ? parsed.edits.description : parsed.edits.abstract,
  );

  revalidatePath("/author");
  revalidatePath("/admin");
  return { success: "Sent back for review." };
}

async function storeSummary(kind: ResourceKind, id: string, title: string, source: string) {
  try {
    const summary = await summarizeForCatalog({ kind, title, source });
    if (!summary) return;
    if (kind === "book") await setBookSummary(id, summary);
    else await setPaperSummary(id, summary);
  } catch {
    // The submission is already saved. A missing summary does not undo it.
  }
}
