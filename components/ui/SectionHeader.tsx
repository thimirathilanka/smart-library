import Link from "next/link";
import { cn } from "@/lib/format";

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      {href && action ? (
        <Link
          href={href}
          className={cn(
            "text-sm font-medium text-navy-mid underline-offset-4 transition hover:text-navy hover:underline",
          )}
        >
          {action}
        </Link>
      ) : null}
    </div>
  );
}
