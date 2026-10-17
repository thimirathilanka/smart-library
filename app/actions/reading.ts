"use server";

import { auth } from "@/auth";
import { getMemberById, removeReadingBookmark, saveReadingBookmark } from "@/lib/data/members";
import { revalidatePath } from "next/cache";
import type { ResourceKind } from "@/lib/types";

export async function saveReadingBookmarkAction(
  resourceId: string,
  kind: ResourceKind,
  page: number,
  totalPages: number,
) {
  if ((kind !== "book" && kind !== "paper") || typeof resourceId !== "string" || !resourceId.length || resourceId.length > 80 || resourceId.includes("\0")) {
    return { error: "This reading position could not be saved." };
  }
  if (!Number.isInteger(page) || !Number.isInteger(totalPages) || page < 1 || totalPages < 1 || page > totalPages || totalPages > 100_000) {
    return { error: "This page number is not valid." };
  }

  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to save your place." };
  const member = await getMemberById(session.user.id);
  if (!member || member.status !== "Active") return { error: "Your account cannot save reading progress right now." };
  const result = await saveReadingBookmark(session.user.id, resourceId, kind, page, totalPages);
  if (!result) return { error: "Your reading position could not be saved." };

  revalidatePath("/library");
  return { saved: true, ...result };
}

export async function removeReadingBookmarkAction(resourceId: string, kind: ResourceKind) {
  if ((kind !== "book" && kind !== "paper") || typeof resourceId !== "string" || !resourceId.length || resourceId.length > 80 || resourceId.includes("\0")) {
    return { error: "This bookmark could not be removed." };
  }
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to manage your bookmarks." };
  const member = await getMemberById(session.user.id);
  if (!member || member.status !== "Active") return { error: "Your account cannot manage reading bookmarks right now." };
  const removed = await removeReadingBookmark(session.user.id, resourceId, kind);
  if (!removed) return { error: "This bookmark could not be removed." };
  revalidatePath("/library");
  return { removed: true };
}
