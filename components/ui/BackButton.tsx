"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/format";

type BackButtonProps = {
  fallbackHref?: string;
  defaultLabel?: string;
  className?: string;
};

function getLabelFromPath(pathname: string): string {
  if (pathname === "/") return "Back to Home";
  if (pathname.startsWith("/compare")) return "Back to Compare";
  if (pathname.startsWith("/finder")) return "Back to Discover";
  if (pathname.startsWith("/books")) return "Back to Books";
  if (pathname.startsWith("/research")) return "Back to Research";
  if (pathname.startsWith("/library")) return "Back to Library";
  if (pathname.startsWith("/author")) return "Back to Author";
  if (pathname.startsWith("/admin")) return "Back to Admin";
  return "Back";
}

const STORAGE_KEY = "smart_lib_prev_tab";

export function BackButton({
  fallbackHref = "/books",
  defaultLabel,
  className,
}: BackButtonProps) {
  const router = useRouter();
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const [label, setLabel] = useState<string>(defaultLabel ?? "Back");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const referrer = document.referrer;
    let candidateUrl: string | null = null;

    if (referrer && referrer.startsWith(window.location.origin)) {
      try {
        const refUrl = new URL(referrer);
        // If referrer is not a reader page or current page, record it as the originating tab
        if (!refUrl.pathname.includes("/read") && refUrl.pathname !== window.location.pathname) {
          candidateUrl = refUrl.pathname + refUrl.search;
          sessionStorage.setItem(STORAGE_KEY, candidateUrl);
        }
      } catch {
        // ignore parse errors
      }
    }

    if (!candidateUrl) {
      candidateUrl = sessionStorage.getItem(STORAGE_KEY);
    }

    if (candidateUrl) {
      setReturnUrl(candidateUrl);
      if (!defaultLabel) {
        try {
          const path = new URL(candidateUrl, window.location.origin).pathname;
          setLabel(getLabelFromPath(path));
        } catch {
          setLabel("Back");
        }
      }
    } else {
      if (!defaultLabel) {
        setLabel(getLabelFromPath(fallbackHref));
      }
    }
  }, [defaultLabel, fallbackHref]);

  function handleBack() {
    if (returnUrl) {
      router.push(returnUrl);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border border-line bg-white/80 py-1.5 pr-4 pl-2.5 text-xs font-medium text-navy-mid shadow-xs transition hover:border-navy/20 hover:bg-white hover:text-navy sm:text-sm",
        className,
      )}
    >
      <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </button>
  );
}
