"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/format";
import { signOutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/types";

export function Navbar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isStaff = Boolean(user?.isAdmin);

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/books", label: "Books" },
    { href: "/research", label: "Research Papers" },
    ...(isStaff ? [{ href: "/admin", label: "Admin" }] : []),
  ];

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
          {user ? (
            <AccountMenu user={user} />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="text-sm text-navy-mid hover:text-navy">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-navy px-3 py-1.5 text-sm text-white hover:bg-navy-mid"
              >
                Register
              </Link>
            </div>
          )}
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
            {!user ? (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-navy hover:bg-paper">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-navy hover:bg-paper">
                  Register
                </Link>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function AccountMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-line bg-white/70 py-1 pr-3 pl-1"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white">
          {initials}
        </span>
        <span className="max-w-[9rem] truncate text-left text-xs font-medium text-navy sm:max-w-[12rem]">
          {user.name}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 w-72 rounded-2xl border border-line bg-white p-4 shadow-lg"
        >
          <p className="font-medium text-navy">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
          <p className="mt-1 text-xs text-navy-mid">
            {user.isMember ? "Member" : "Free plan"}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/membership"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="rounded-full bg-navy px-4 py-2 text-center text-sm font-medium text-white hover:bg-navy-mid"
            >
              Membership
            </Link>
            <Link
              href="/library"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="rounded-full border border-line px-4 py-2 text-center text-sm font-medium text-navy hover:bg-paper"
            >
              My Library
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                role="menuitem"
                className="w-full rounded-full px-4 py-2 text-sm text-navy-mid hover:bg-paper hover:text-navy"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
