import "server-only";

import { parseAiSubjects, subjectTokens } from "@/lib/ai/subjects";
import { featuredBooks, listBooks } from "@/lib/data/books";
import { getMemberLibrary } from "@/lib/data/members";
import { listUserRatings } from "@/lib/data/ratings";
import type { Book, LibraryItem } from "@/lib/types";

const DEFAULT_LIMIT = 10;
const HISTORY_WINDOW = 12;

type PreferenceProfile = {
  categories: Map<string, number>;
  authors: Map<string, number>;
  subjects: Map<string, number>;
  excludeIds: Set<string>;
  hasSignals: boolean;
};

export type RecommendedShelf = {
  books: Book[];
  personalized: boolean;
};

export async function getRecommendedBooks(memberId: string, limit = DEFAULT_LIMIT): Promise<RecommendedShelf> {
  const [library, ratings, catalog] = await Promise.all([
    getMemberLibrary(memberId),
    listUserRatings(memberId, "book"),
    listBooks(),
  ]);

  const byId = new Map(catalog.map((book) => [book._id, book]));
  const profile = buildProfile(library.history, library.favorites, library.saved, ratings, byId);

  if (!profile.hasSignals) {
    return { books: await featuredBooks(), personalized: false };
  }

  const scored = catalog
    .filter((book) => !profile.excludeIds.has(book._id))
    .map((book) => ({ book, score: scoreBook(book, profile) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.book.reads - a.book.reads);

  if (scored.length === 0) {
    return { books: await featuredBooks(), personalized: false };
  }

  return {
    books: scored.slice(0, limit).map((entry) => entry.book),
    personalized: true,
  };
}

function buildProfile(
  history: LibraryItem[],
  favorites: LibraryItem[],
  saved: LibraryItem[],
  ratings: Array<{ resourceId: string; score: number }>,
  byId: Map<string, Book>,
): PreferenceProfile {
  const categories = new Map<string, number>();
  const authors = new Map<string, number>();
  const subjects = new Map<string, number>();
  const excludeIds = new Set<string>();

  const bookHistory = history.filter((item) => item.kind === "book");
  for (const item of bookHistory) excludeIds.add(item.resourceId);

  let signalCount = 0;

  bookHistory.slice(0, HISTORY_WINDOW).forEach((item, index) => {
    const book = byId.get(item.resourceId);
    if (!book) return;
    const recency = 1 + (HISTORY_WINDOW - index) / HISTORY_WINDOW;
    const progressBoost = 1 + Math.min(1, (item.progress ?? 0) / 100) * 0.5;
    const weight = recency * progressBoost;
    addBookSignals(book, weight, categories, authors, subjects);
    signalCount += 1;
  });

  for (const item of [...favorites, ...saved]) {
    if (item.kind !== "book") continue;
    const book = byId.get(item.resourceId);
    if (!book) continue;
    addBookSignals(book, 1.75, categories, authors, subjects);
    signalCount += 1;
  }

  for (const rating of ratings) {
    const book = byId.get(rating.resourceId);
    if (!book) continue;
    if (rating.score >= 4) {
      addBookSignals(book, 0.5 + rating.score * 0.35, categories, authors, subjects);
      signalCount += 1;
    } else if (rating.score <= 2) {
      addWeight(categories, normalizeKey(book.category), -1.25);
      addWeight(authors, normalizeKey(book.author), -1);
      signalCount += 1;
    }
  }

  return {
    categories,
    authors,
    subjects,
    excludeIds,
    hasSignals: signalCount > 0,
  };
}

function addBookSignals(
  book: Book,
  weight: number,
  categories: Map<string, number>,
  authors: Map<string, number>,
  subjects: Map<string, number>,
) {
  addWeight(categories, normalizeKey(book.category), weight * 2);
  addWeight(authors, normalizeKey(book.author), weight * 1.5);
  for (const author of book.authors ?? []) {
    addWeight(authors, normalizeKey(author), weight);
  }
  for (const token of subjectTokens(parseAiSubjects(book.aiSummary))) {
    addWeight(subjects, token, weight);
  }
}

function scoreBook(book: Book, profile: PreferenceProfile): number {
  let score = 0;
  score += (profile.categories.get(normalizeKey(book.category)) ?? 0) * 2.5;
  score += (profile.authors.get(normalizeKey(book.author)) ?? 0) * 2;

  const candidateTokens = new Set([
    ...subjectTokens(parseAiSubjects(book.aiSummary)),
    ...subjectTokens([book.title, book.category, ...(book.description ? [book.description.slice(0, 280)] : [])]),
  ]);
  for (const token of candidateTokens) {
    const weight = profile.subjects.get(token);
    if (weight) score += weight * 0.85;
  }

  // Light popularity tiebreaker so equally matched titles don't feel random.
  score += Math.log1p(book.reads) * 0.15;
  return score;
}

function addWeight(map: Map<string, number>, key: string, amount: number) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + amount);
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}
