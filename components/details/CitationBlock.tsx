"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { bookAPA, bookChicago, bookMLA, paperAPA, paperChicago, paperMLA } from "@/lib/citations";
import type { Book, ResearchPaper } from "@/lib/types";
import { cn } from "@/lib/format";

type Style = "apa" | "mla" | "chicago";

export function CitationBlock({
  book,
  paper,
}: {
  book?: Book;
  paper?: ResearchPaper;
}) {
  const [style, setStyle] = useState<Style>("apa");
  const [copied, setCopied] = useState(false);

  const text = book
    ? style === "apa"
      ? bookAPA(book)
      : style === "mla"
        ? bookMLA(book)
        : bookChicago(book)
    : paper
      ? style === "apa"
        ? paperAPA(paper)
        : style === "mla"
          ? paperMLA(paper)
          : paperChicago(paper)
      : "";

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-navy">Cite this resource</h2>
        <div className="flex rounded-full bg-paper p-1">
          {(["apa", "mla", "chicago"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStyle(item)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium uppercase",
                style === item ? "bg-navy text-white" : "text-muted",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 font-serif text-sm leading-7 text-navy-mid">{text}</p>
      <button
        type="button"
        onClick={copy}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-navy hover:underline"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy citation"}
      </button>
    </section>
  );
}
