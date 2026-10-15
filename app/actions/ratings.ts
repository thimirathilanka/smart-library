"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { recordActivity } from "@/lib/data/activity";
import { getMemberById } from "@/lib/data/members";
import { withPublished } from "@/lib/data/publication";
import { collections } from "@/lib/db";
import type { ResourceKind } from "@/lib/types";

export type RatingActionState = {
  error?: string;
  success?: string;
  average?: number;
  count?: number;
  userRating?: number;
};

let ratingIndexPromise: Promise<string> | undefined;

async function ensureRatingIndex(ratings: Awaited<ReturnType<typeof collections>>["ratings"]) {
  ratingIndexPromise ??= ratings.createIndex({ userId: 1, kind: 1, resourceId: 1 }, { unique: true });
  try {
    await ratingIndexPromise;
  } catch (error) {
    ratingIndexPromise = undefined;
    throw error;
  }
}

export async function rateResourceAction(
  _previous: RatingActionState,
  formData: FormData,
): Promise<RatingActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Sign in to rate this resource." };
  const member = await getMemberById(userId);
  if (!member || member.status !== "Active") return { error: "Your account cannot rate resources right now." };

  const kindValue = String(formData.get("kind") ?? "");
  const kind: ResourceKind | null = kindValue === "book" || kindValue === "paper" ? kindValue : null;
  const resourceId = String(formData.get("resourceId") ?? "").trim();
  const score = Number(formData.get("score"));
  if (!kind || !resourceId || resourceId.length > 80 || !Number.isInteger(score) || score < 1 || score > 5) {
    return { error: "Choose a rating from 1 to 5 stars." };
  }

  const { books, papers, ratings } = await collections();
  const resource = kind === "book"
    ? await books.findOne(withPublished({ _id: resourceId }))
    : await papers.findOne(withPublished({ _id: resourceId }));
  if (!resource) return { error: "Only published resources can be rated." };

  await ensureRatingIndex(ratings);
  await ratings.updateOne(
    { userId, kind, resourceId },
    { $set: { score, updatedAt: new Date() } },
    { upsert: true },
  );

  const [summary] = await ratings.aggregate<{ average: number; count: number }>([
    { $match: { kind, resourceId } },
    { $group: { _id: null, average: { $avg: "$score" }, count: { $sum: 1 } } },
  ]).toArray();
  const average = Math.round((summary?.average ?? 0) * 10) / 10;
  const count = summary?.count ?? 0;

  if (kind === "book") {
    await books.updateOne(withPublished({ _id: resourceId }), { $set: { rating: average, ratingsCount: count } });
  } else {
    await papers.updateOne(withPublished({ _id: resourceId }), { $set: { rating: average, ratingsCount: count } });
  }

  await recordActivity({
    actorId: userId,
    action: "resource.rated",
    targetKind: kind,
    targetId: resourceId,
    detail: `Rated ${kind} ${score} out of 5`,
  });
  revalidatePath(kind === "book" ? `/books/${resourceId}` : `/research/${resourceId}`);
  revalidatePath(kind === "book" ? "/books" : "/research");

  return { success: "Your rating was saved.", average, count, userRating: score };
}
