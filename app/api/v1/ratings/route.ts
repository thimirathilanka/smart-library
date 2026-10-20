import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http";
import { requireMobileMember } from "@/lib/api/mobile-auth";
import { recordActivity } from "@/lib/data/activity";
import { withPublished } from "@/lib/data/publication";
import { collections } from "@/lib/db";
import type { ResourceKind } from "@/lib/types";

export const runtime = "nodejs";

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

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const access = await requireMobileMember(request);
  if (!access.ok) return jsonError(request, access.error, access.status);
  const member = access.member;

  const body = await readJsonBody<{ kind?: string; resourceId?: string; score?: number }>(request);
  if (!body) return jsonError(request, "Invalid JSON body.");

  const kind: ResourceKind | null = body.kind === "book" || body.kind === "paper" ? body.kind : null;
  const resourceId = String(body.resourceId ?? "").trim();
  const score = Number(body.score);
  if (!kind || !resourceId || resourceId.length > 80 || !Number.isInteger(score) || score < 1 || score > 5) {
    return jsonError(request, "Choose a rating from 1 to 5 stars.");
  }

  const { books, papers, ratings } = await collections();
  const resource =
    kind === "book"
      ? await books.findOne(withPublished({ _id: resourceId }))
      : await papers.findOne(withPublished({ _id: resourceId }));
  if (!resource) return jsonError(request, "Only published resources can be rated.", 404);

  await ensureRatingIndex(ratings);
  await ratings.updateOne(
    { userId: member._id, kind, resourceId },
    { $set: { score, updatedAt: new Date() } },
    { upsert: true },
  );

  const [summary] = await ratings
    .aggregate<{ average: number; count: number }>([
      { $match: { kind, resourceId } },
      { $group: { _id: null, average: { $avg: "$score" }, count: { $sum: 1 } } },
    ])
    .toArray();
  const average = Math.round((summary?.average ?? 0) * 10) / 10;
  const count = summary?.count ?? 0;

  if (kind === "book") {
    await books.updateOne(withPublished({ _id: resourceId }), { $set: { rating: average, ratingsCount: count } });
  } else {
    await papers.updateOne(withPublished({ _id: resourceId }), { $set: { rating: average, ratingsCount: count } });
  }

  await recordActivity({
    actorId: member._id,
    action: "resource.rated",
    targetKind: kind,
    targetId: resourceId,
    detail: `Rated ${kind} ${score} out of 5 (mobile)`,
  });

  return jsonOk(request, { success: true, average, count, userRating: score });
}
