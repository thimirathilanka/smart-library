"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/format";
import { currentUser } from "@/lib/mock-data";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/books", label: "Books" },
  { href: "/research", label: "Research Papers" },
  { href: "/library", label: "My Library" },
  { href: "/admin", label: "Admin" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    const target = pathname.startsWith("/research") ? "/research" : "/books";
    router.push(value ? `${target}?q=${encodeURIComponent(value)}` : target);
    setOpen(false);
  }

  return (
    <header className="glass-nav sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-navy">
          <span className="flex size-9 items-center justify-center rounded-lg bg-navy text-white">
            <BookOpen className="size-4" />
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-lg">Nextgen</span>
            <span className="-mt-0.5 block text-[10px] tracking-[0.22em] text-muted uppercase">
              Digital Library
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition",
                  active
                    ? "bg-navy text-white"
                    : "text-navy-mid hover:bg-navy/6",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden min-w-0 flex-1 max-w-md md:block">
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the collection…"
              className="w-full rounded-full border border-line bg-white/80 py-2 pr-4 pl-10 text-sm outline-none transition focus:border-navy-soft focus:ring-2 focus:ring-navy/10"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <div className="hidden items-center gap-2 rounded-full border border-line bg-white/70 py-1 pr-3 pl-1 sm:flex">
            <span className="flex size-7 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white">
              AC
            </span>
            <span className="text-xs leading-tight">
              <span className="block font-medium text-navy">{currentUser.name}</span>
              <span className="text-muted">{currentUser.role}</span>
            </span>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-navy lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-line bg-white/95 px-4 py-4 lg:hidden">
          <form onSubmit={submitSearch} className="mb-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the collection…"
              className="w-full rounded-full border border-line px-4 py-2 text-sm outline-none"
            />
          </form>
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-navy hover:bg-paper"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
