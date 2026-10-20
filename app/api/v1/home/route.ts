import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireMobileMember } from "@/lib/api/mobile-auth";
import { featuredBooks } from "@/lib/data/books";
import { recentlyAdded } from "@/lib/data/catalog";
import { getContinueReading } from "@/lib/data/members";
import { latestPapers } from "@/lib/data/papers";
import { getRecommendedBooks } from "@/lib/data/recommendations";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const access = await requireMobileMember(request);
  if (!access.ok) return jsonError(request, access.error, access.status);

  const [featured, recent, papers, continueReading, recommendations] = await Promise.all([
    featuredBooks(),
    recentlyAdded(8),
    latestPapers(6),
    getContinueReading(access.member._id),
    getRecommendedBooks(access.member._id),
  ]);

  return jsonOk(request, {
    featured,
    recent,
    latestPapers: papers,
    continueReading,
    recommendations,
  });
}
