import "server-only";

import type { Filter } from "mongodb";

const publishedMatch = {
  $or: [{ publicationStatus: "published" }, { publicationStatus: { $exists: false } }],
};

export function withPublished<T extends { publicationStatus?: string }>(filter: Filter<T>): Filter<T> {
  return { $and: [filter, publishedMatch] } as Filter<T>;
}
