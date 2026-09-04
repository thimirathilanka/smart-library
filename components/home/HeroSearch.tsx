"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/format";

export function HeroSearch() {
  const router = useRouter();
  const [scope, setScope] = useState<"books" | "research">("books");
  const [query, setQuery] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const path = scope === "books" ? "/books" : "/research";
    const value = query.trim();
    router.push(value ? `${path}?q=${encodeURIComponent(value)}` : path);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-8 w-full max-w-2xl">
      <div className="flex justify-center gap-2">
        {(["books", "research"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setScope(item)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition",
              scope === item
                ? "bg-white text-navy"
                : "bg-white/10 text-white/80 hover:bg-white/16",
            )}
          >
            {item === "books" ? "Books" : "Research papers"}
          </button>
        ))}
      </div>
      <label className="relative mt-4 block">
        <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            scope === "books"
              ? "Search titles, authors, or subjects…"
              : "Search papers, authors, or keywords…"
          }
          className="w-full rounded-full border border-white/15 bg-white py-4 pr-36 pl-14 text-base text-ink shadow-2xl outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className="absolute top-1.5 right-1.5 rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-mid"
        >
          Search catalog
        </button>
      </label>
    </form>
  );
}
