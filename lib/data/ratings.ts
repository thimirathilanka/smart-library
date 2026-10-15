import "server-only";

import { collections } from "@/lib/db";
import type { ResourceKind } from "@/lib/types";

export async function getUserResourceRating(userId: string, kind: ResourceKind, resourceId: string) {
  const { ratings } = await collections();
  const rating = await ratings.findOne({ userId, kind, resourceId });
  return rating?.score ?? 0;
}
