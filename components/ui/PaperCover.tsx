import type { ResearchPaper } from "@/lib/types";
import { cn } from "@/lib/format";

type PaperCoverProps = {
  paper: ResearchPaper;
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
};

const sizes = {
  sm: "aspect-[3/4] w-20",
  md: "aspect-[3/4] w-full",
  lg: "aspect-[3/4] w-56",
  hero: "aspect-[3/4] w-full max-w-[280px]",
};

const palette = [
  { from: "#0B1F3A", to: "#1B4F8A", accent: "#C9A227" },
  { from: "#1A2F23", to: "#3D6B4F", accent: "#E8D5A3" },
  { from: "#1B1B3A", to: "#4C3A8C", accent: "#7EE0C8" },
  { from: "#121C33", to: "#2C4A7A", accent: "#C9B037" },
];

function coverForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length]!;
}

export function PaperCover({ paper, className, size = "md" }: PaperCoverProps) {
  if (paper.coverId) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-sm shadow-[0_18px_40px_-18px_rgba(11,31,58,0.55)]",
          sizes[size],
          className,
        )}
      >
        <img
          src={`/api/research/${paper._id}/cover`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  const cover = coverForId(paper._id);
  const byline = paper.authors[0] ?? paper.field;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm shadow-[0_18px_40px_-18px_rgba(11,31,58,0.55)] transition-transform duration-300",
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(155deg, ${cover.from} 0%, ${cover.to} 72%)`,
      }}
    >
      <div className="absolute inset-y-0 left-0 w-[10px] bg-black/25" />
      <div
        className="absolute inset-y-0 left-[10px] w-px opacity-70"
        style={{ background: cover.accent }}
      />
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
      <div className="relative flex h-full flex-col justify-between p-4 pl-6 text-white">
        <div>
          <p className="font-serif text-[0.95rem] leading-snug tracking-tight sm:text-lg">
            {paper.title}
          </p>
          <p className="mt-1 line-clamp-1 text-[10px] uppercase tracking-[0.14em] text-white/70">
            {paper.field}
          </p>
        </div>
        <div>
          <div className="mb-2 h-px w-10" style={{ background: cover.accent }} />
          <p className="text-[11px] tracking-[0.16em] uppercase text-white/85">{byline}</p>
        </div>
      </div>
    </div>
  );
}
