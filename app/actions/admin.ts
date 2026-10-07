"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { draftFromForm } from "@/lib/catalog-form";
import { createBook, publishBook, rejectBook } from "@/lib/data/books";
import { getMemberById } from "@/lib/data/members";
import { createPaper, publishPaper, rejectPaper } from "@/lib/data/papers";

export type CatalogState = {
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

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/author");
  revalidatePath("/books");
  revalidatePath("/research");
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
    await createPaper(draft.paper);
    revalidatePublic();
    return { success: "Paper added to the catalog." };
  }

  await createBook(draft.book);
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
