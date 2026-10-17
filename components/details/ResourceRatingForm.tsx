"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { rateResourceAction, type RatingActionState } from "@/app/actions/ratings";
import type { ResourceKind } from "@/lib/types";

export function ResourceRatingForm({
  kind,
  resourceId,
  signedIn,
  userRating = 0,
}: {
  kind: ResourceKind;
  resourceId: string;
  signedIn: boolean;
  userRating?: number;
}) {
  const [state, formAction, pending] = useActionState<RatingActionState, FormData>(
    rateResourceAction,
    { userRating },
  );
  const [hovered, setHovered] = useState(0);
  const selected = state.userRating ?? userRating;
  const preview = hovered || selected;
  const resourcePath = kind === "book" ? `/books/${resourceId}` : `/research/${resourceId}`;

  return (
    <section className="mt-4" aria-label="Rate this resource">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Your rating</p>
      {signedIn ? (
        <form action={formAction} className="mt-1">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="resourceId" value={resourceId} />
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label="Choose one to five stars"
            onMouseLeave={() => setHovered(0)}
          >
            {Array.from({ length: 5 }, (_, index) => {
              const score = index + 1;
              return (
                <button
                  key={score}
                  type="submit"
                  name="score"
                  value={score}
                  aria-label={`${score} ${score === 1 ? "star" : "stars"}`}
                  aria-pressed={selected === score}
                  disabled={pending}
                  onMouseEnter={() => setHovered(score)}
                  className="group cursor-pointer rounded p-1 text-gold transition hover:scale-125 hover:bg-gold/15 hover:text-amber-600 focus-visible:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-wait disabled:opacity-50"
                >
                  <Star className={`size-5 transition-colors ${score <= preview ? "fill-gold text-gold" : "fill-transparent text-line group-hover:fill-current group-hover:text-amber-600"}`} />
                </button>
              );
            })}
            <span className="ml-1 text-xs text-muted">
              {pending ? "Saving…" : selected ? `You rated ${selected}/5` : "Select a rating"}
            </span>
          </div>
          {state.error ? <p role="alert" className="mt-1 text-xs text-red-700">{state.error}</p> : null}
          {state.success ? <p role="status" className="mt-1 text-xs text-emerald-700">{state.success}</p> : null}
        </form>
      ) : (
        <p className="mt-1 text-sm text-muted">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(resourcePath)}`}
            className="font-medium text-navy underline underline-offset-2"
          >
            Sign in
          </Link>{" "}
          to rate this {kind}.
        </p>
      )}
    </section>
  );
}
