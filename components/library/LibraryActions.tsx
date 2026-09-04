"use client";

import { Heart, Bookmark } from "lucide-react";
import { toggleLibraryAction } from "@/app/actions/auth";
import type { ResourceKind } from "@/lib/types";
import { cn } from "@/lib/format";

export function LibraryActions({
  resourceId,
  kind,
  saved,
  favorited,
  signedIn,
}: {
  resourceId: string;
  kind: ResourceKind;
  saved: boolean;
  favorited: boolean;
  signedIn: boolean;
}) {
  if (!signedIn) {
    return (
      <p className="mt-3 text-xs text-muted">
        <a href="/login" className="font-medium text-navy hover:underline">
          Sign in
        </a>{" "}
        to save this title to My Library.
      </p>
    );
  }

  return (
    <div className="mt-3 flex gap-2">
      <form action={toggleLibraryAction.bind(null, "saved", resourceId, kind)}>
        <button
          type="submit"
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1",
            saved ? "bg-navy text-white ring-navy" : "bg-white text-navy ring-line",
          )}
        >
          <Bookmark className="size-3.5" />
          {saved ? "Saved" : "Save"}
        </button>
      </form>
      <form action={toggleLibraryAction.bind(null, "favorites", resourceId, kind)}>
        <button
          type="submit"
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1",
            favorited ? "bg-navy text-white ring-navy" : "bg-white text-navy ring-line",
          )}
        >
          <Heart className="size-3.5" />
          {favorited ? "Favorited" : "Favorite"}
        </button>
      </form>
    </div>
  );
}
