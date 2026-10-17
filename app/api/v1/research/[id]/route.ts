import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk } from "@/lib/api/http";
import { getMemberFromRequest } from "@/lib/api/mobile-auth";
import { getUserResourceRating } from "@/lib/data/ratings";
import { getMemberLibrary, hasActiveMembership, isActiveAccount } from "@/lib/data/members";
import { getPaper, relatedPapers } from "@/lib/data/papers";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper) return jsonError(request, "Paper not found.", 404);

  const member = await getMemberFromRequest(request);
  const related = await relatedPapers(paper);
  let userRating = 0;
  let saved = false;
  let favorited = false;
  let canRead = paper.access === "open";

  if (member && isActiveAccount(member)) {
    const [rating, library] = await Promise.all([
      getUserResourceRating(member._id, "paper", id),
      getMemberLibrary(member._id),
    ]);
    userRating = rating;
    saved = library.saved.some((item) => item.resourceId === id && item.kind === "paper");
    favorited = library.favorites.some((item) => item.resourceId === id && item.kind === "paper");
    canRead = paper.access === "open" || member.isAdmin || hasActiveMembership(member);
  } else if (paper.access === "members") {
    canRead = false;
  }

  return jsonOk(request, { paper, related, userRating, saved, favorited, canRead });
}
