import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function ReaderView({
  backHref,
  kicker,
  title,
  byline,
  children,
}: {
  backHref: string;
  kicker: string;
  title: string;
  byline: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-[#f3efe6]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-navy-mid hover:text-navy"
        >
          <ChevronLeft className="size-4" />
          Back to details
        </Link>
        <article className="mt-6 rounded-sm bg-[#fbf7ee] px-8 py-12 shadow-[0_20px_60px_-30px_rgba(11,31,58,0.45)] sm:px-14">
          <p className="text-center text-[11px] tracking-[0.22em] text-muted uppercase">
            {kicker}
          </p>
          <h1 className="mt-4 text-center font-serif text-3xl leading-tight text-navy sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-center text-sm text-navy-mid">{byline}</p>
          <div className="mx-auto mt-6 h-px w-16 bg-gold" />
          <div className="mt-10 space-y-5 font-serif text-[17px] leading-8 text-ink/90">
            {children}
          </div>
        </article>
      </div>
    </div>
  );
}
