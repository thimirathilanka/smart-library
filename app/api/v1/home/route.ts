import { preflight } from "@/lib/api/cors";
import { jsonOk } from "@/lib/api/http";
import { getMemberFromRequest } from "@/lib/api/mobile-auth";
import { featuredBooks } from "@/lib/data/books";
import { recentlyAdded } from "@/lib/data/catalog";
import { getContinueReading, isActiveAccount } from "@/lib/data/members";
import { latestPapers } from "@/lib/data/papers";
import { getRecommendedBooks } from "@/lib/data/recommendations";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const member = await getMemberFromRequest(request);
  const [featured, recent, papers] = await Promise.all([
    featuredBooks(),
    recentlyAdded(8),
    latestPapers(6),
  ]);

  let continueReading: Awaited<ReturnType<typeof getContinueReading>> = [];
  let recommendations: Awaited<ReturnType<typeof getRecommendedBooks>> = {
    books: featured.slice(0, 10),
    personalized: false,
  };

  if (member && isActiveAccount(member)) {
    [continueReading, recommendations] = await Promise.all([
      getContinueReading(member._id),
      getRecommendedBooks(member._id),
    ]);
  }

  return jsonOk(request, {
    featured,
    recent,
    latestPapers: papers,
    continueReading,
    recommendations,
  });
}
