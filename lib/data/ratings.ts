import "server-only";

import { collections } from "@/lib/db";
import { toPlain } from "@/lib/data/serialize";
import type { ResourceKind, ResourceRating } from "@/lib/types";

export async function getUserResourceRating(userId: string, kind: ResourceKind, resourceId: string) {
  const { ratings } = await collections();
  const rating = await ratings.findOne({ userId, kind, resourceId });
  return rating?.score ?? 0;
}

export async function listUserRatings(userId: string, kind?: ResourceKind) {
  const { ratings } = await collections();
  const filter = kind ? { userId, kind } : { userId };
  return toPlain(await ratings.find(filter).toArray()) as ResourceRating[];
}
