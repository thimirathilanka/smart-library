"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
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
        <LibraryButton active={saved} idle="Save" activeLabel="Saved" pendingLabel="Saving…">
          <Bookmark className="size-3.5" />
        </LibraryButton>
      </form>
      <form action={toggleLibraryAction.bind(null, "favorites", resourceId, kind)}>
        <LibraryButton active={favorited} idle="Favorite" activeLabel="Favorited" pendingLabel="Saving…">
          <Heart className="size-3.5" />
        </LibraryButton>
      </form>
    </div>
  );
}

function LibraryButton({
  active,
  idle,
  activeLabel,
  pendingLabel,
  children,
}: {
  active: boolean;
  idle: string;
  activeLabel: string;
  pendingLabel: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1 disabled:opacity-60",
        active ? "bg-navy text-white ring-navy" : "bg-white text-navy ring-line",
      )}
    >
      {children}
      {pending ? pendingLabel : active ? activeLabel : idle}
    </button>
  );
}
