"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { LockKeyhole, X } from "lucide-react";

type ReaderPreview = {
  kicker: string;
  title: string;
  byline: string;
  paragraphs: { label?: string; text: string }[];
};

export function ReadAccessLink({
  href,
  requiresMembership,
  hasMembership,
  signedIn,
  preview,
  openOnMount = false,
  className,
  children,
}: {
  href: string;
  requiresMembership: boolean;
  hasMembership: boolean;
  signedIn: boolean;
  preview: ReaderPreview;
  openOnMount?: boolean;
  className: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const blocked = requiresMembership && !hasMembership;

  useEffect(() => {
    if (openOnMount && blocked) dialogRef.current?.showModal();
  }, [openOnMount, blocked]);

  if (!blocked) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={className}
        aria-haspopup="dialog"
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto h-[min(86dvh,44rem)] max-h-[calc(100dvh-1rem)] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:backdrop-blur-md backdrop:bg-transparent"
        aria-labelledby="members-only-title"
        aria-describedby="members-only-description"
      >
        <div className="reading-theme relative h-full overflow-y-auto bg-[#f3efe6]">
          <article
            aria-hidden="true"
            className="pointer-events-none mx-auto min-h-full max-w-2xl bg-[#fbf7ee] px-7 py-9 blur-[3px] sm:px-12 sm:py-12"
          >
            <p className="text-center text-[11px] tracking-[0.22em] text-muted uppercase">
              {preview.kicker}
            </p>
            <h2 className="mt-4 text-center font-serif text-3xl leading-tight text-navy">
              {preview.title}
            </h2>
            <p className="mt-3 text-center text-sm text-navy-mid">{preview.byline}</p>
            <div className="mx-auto mt-6 h-px w-16 bg-gold" />
            <div className="mt-10 space-y-5 font-serif text-[17px] leading-8 text-ink/90">
              {preview.paragraphs.map((paragraph, index) => (
                <p key={`${paragraph.label ?? "text"}-${index}`}>
                  {paragraph.label ? <strong>{paragraph.label} </strong> : null}
                  {paragraph.text}
                </p>
              ))}
            </div>
          </article>
          <div className="absolute inset-0 grid place-items-center bg-white/20 p-4 backdrop-blur-[2px]">
            <section className="relative max-h-full w-full max-w-sm overflow-y-auto rounded-xl border border-line bg-white/95 p-4 shadow-xl sm:p-5">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="absolute right-3 top-3 rounded-full p-2 text-muted hover:bg-paper hover:text-navy"
            aria-label="Close members-only message"
            autoFocus
          >
            <X className="size-4" />
          </button>
              <div className="flex items-center gap-3 pr-8">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-200">
                  <LockKeyhole className="size-5" aria-hidden="true" />
                </span>
                <h2 id="members-only-title" className="font-serif text-xl text-navy">
                  Members only
                </h2>
              </div>
              <p id="members-only-description" className="mt-4 text-sm leading-6 text-muted">
                This title is part of the members-only collection. Membership is required to read it online.
              </p>
              <Link
                href={signedIn ? "/membership" : "/login?callbackUrl=%2Fmembership"}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-mid"
              >
                {signedIn ? "View membership" : "Sign in for membership"}
              </Link>
            </section>
          </div>
        </div>
      </dialog>
    </>
  );
}