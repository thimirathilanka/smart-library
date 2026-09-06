import { cn } from "@/lib/format";
import type { AccessType } from "@/lib/types";

export function AccessBadge({ access }: { access: AccessType }) {
  const isOpen = access === "open";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        isOpen
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
          : "bg-navy/8 text-navy-mid ring-1 ring-navy/15",
      )}
    >
      {isOpen ? "Open Access" : "Premium"}
    </span>
  );
}
