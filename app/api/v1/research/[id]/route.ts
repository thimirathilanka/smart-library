import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireMobileMember } from "@/lib/api/mobile-auth";
import { getUserResourceRating } from "@/lib/data/ratings";
import { getMemberLibrary } from "@/lib/data/members";
import { getPaper, relatedPapers } from "@/lib/data/papers";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireMobileMember(request);
  if (!access.ok) return jsonError(request, access.error, access.status);

  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper) return jsonError(request, "Paper not found.", 404);

  const [related, userRating, library] = await Promise.all([
    relatedPapers(paper),
    getUserResourceRating(access.member._id, "paper", id),
    getMemberLibrary(access.member._id),
  ]);

  return jsonOk(request, {
    paper,
    related,
    userRating,
    saved: library.saved.some((item) => item.resourceId === id && item.kind === "paper"),
    favorited: library.favorites.some((item) => item.resourceId === id && item.kind === "paper"),
    canRead: true,
  });
}
