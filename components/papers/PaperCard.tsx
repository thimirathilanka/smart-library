import Link from "next/link";
import { FileText } from "lucide-react";
import type { ResearchPaper } from "@/lib/types";
import { AccessBadge } from "@/components/ui/AccessBadge";
import { formatDate, formatNumber } from "@/lib/format";

export function PaperCard({ paper }: { paper: ResearchPaper }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-navy/20 hover:shadow-md sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-navy-soft uppercase">
          {paper.field}
        </span>
        <span className="text-muted">·</span>
        <span className="text-xs text-muted">{paper.venueType === "journal" ? "Journal" : "Conference"}</span>
        <AccessBadge access={paper.access} />
      </div>
      <h3 className="mt-3 font-serif text-xl leading-snug text-navy">
        <Link href={`/research/${paper._id}`} className="hover:text-navy-mid">
          {paper.title}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-navy-mid">
        {paper.authors.join(" · ")}
      </p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{paper.abstract}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {paper.keywords.map((keyword) => (
          <span
            key={keyword}
            className="rounded-full bg-paper px-2.5 py-1 text-[11px] text-navy-mid ring-1 ring-line"
          >
            {keyword}
          </span>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>{paper.venue}</span>
          <span>{formatDate(paper.publishedAt)}</span>
          <span>{formatNumber(paper.citations)} citations</span>
        </div>
        <Link
          href={`/research/${paper._id}/read`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-mid"
        >
          <FileText className="size-4" />
          Read online
        </Link>
      </div>
    </article>
  );
}
