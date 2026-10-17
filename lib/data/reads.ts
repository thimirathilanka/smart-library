import "server-only";

import { recordActivity } from "@/lib/data/activity";
import { incrementBookReads } from "@/lib/data/books";
import { incrementMonthlyReads } from "@/lib/data/catalog";
import { incrementPaperReads } from "@/lib/data/papers";
import type { ResourceKind } from "@/lib/types";

/** Count a published file open once (full GET, not a Range request). Never throw — file delivery must succeed. */
export async function recordFileOpen(
  kind: ResourceKind,
  id: string,
  actorId: string | null,
  request: Request,
) {
  if (request.headers.has("range")) return;

  try {
    const counted = kind === "book" ? await incrementBookReads(id) : await incrementPaperReads(id);
    if (!counted) return;

    await incrementMonthlyReads(kind === "book" ? "books" : "papers");
    await recordActivity({
      actorId,
      action: "resource.read",
      targetKind: kind,
      targetId: id,
      detail: `Opened ${kind} file`,
    });
  } catch (error) {
    console.error("Could not record file open", error);
  }
}
