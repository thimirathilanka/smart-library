import { Star } from "lucide-react";
import { cn, formatNumber } from "@/lib/format";

export function RatingStars({
  rating,
  count,
  compact = false,
}: {
  rating: number;
  count?: number;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 text-gold">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = rating >= index + 0.6;
        return (
          <Star
            key={index}
            className={cn("size-3.5", filled ? "fill-gold" : "fill-transparent text-line")}
          />
        );
      })}
      <span className="text-xs text-muted">
        {rating.toFixed(1)}
        {!compact && count != null ? ` · ${formatNumber(count)}` : null}
      </span>
    </div>
  );
}
