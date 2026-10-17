"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, CreditCard, LogOut, Mail, Menu, PenLine, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/format";
import { signOutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/types";
import { NotificationPopover } from "@/components/layout/NotificationPopover";
import type { NotificationEntry } from "@/lib/types";

export function Navbar({ user, unreadNotifications = 0, notifications = [] }: { user: SessionUser | null; unreadNotifications?: number; notifications?: NotificationEntry[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isStaff = Boolean(user?.isAdmin);
  const isAuthor = Boolean(user?.isAuthor);

  const links = [
    { href: "/", label: "Home" },
    { href: "/books", label: "Books" },
    { href: "/research", label: "Research Papers" },
    ...(isAuthor ? [{ href: "/author", label: "Author" }] : []),
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
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors",
        pathname === "/"
          ? "border-b border-white/10 bg-[#101311]/95 text-white backdrop-blur-xl"
          : "glass-nav",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className={cn("flex items-center gap-2", pathname === "/" ? "text-white" : "text-navy")}>
          <span className={cn("flex size-9 items-center justify-center rounded-lg", pathname === "/" ? "bg-white/10 text-white" : "bg-navy text-white")}>
            <BookOpen className="size-4" />
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-lg">Nextgen</span>
            <span className={cn("-mt-0.5 block text-[10px] tracking-[0.22em] uppercase", pathname === "/" ? "text-white/45" : "text-muted")}>
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
                    ? pathname === "/"
                      ? "bg-white/10 text-white"
                      : "bg-navy text-white"
                    : pathname === "/"
                      ? "text-white/65 hover:bg-white/10 hover:text-white"
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
              className={cn(
                "w-full rounded-full border py-2 pr-4 pl-10 text-sm outline-none transition",
                pathname === "/"
                  ? "border-white/15 bg-white/[0.06] text-white placeholder:text-white/40 focus:border-white/35 focus:ring-2 focus:ring-white/10"
                  : "border-line bg-white/80 focus:border-navy-soft focus:ring-2 focus:ring-navy/10",
              )}
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          {user ? (
            <>
              <NotificationPopover notifications={notifications} unreadCount={unreadNotifications} />
              <AccountMenu user={user} />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className={cn("text-sm", pathname === "/" ? "text-white/70 hover:text-white" : "text-navy-mid hover:text-navy")}>
                Sign in
              </Link>
              <Link
                href="/register"
                className={cn("rounded-full px-3 py-1.5 text-sm", pathname === "/" ? "bg-[#f3f3f1] text-[#151715] hover:bg-[#dededb]" : "bg-navy text-white hover:bg-navy-mid")}
              >
                Register
              </Link>
            </div>
          )}
          <button
            type="button"
            className={cn("rounded-lg p-2 lg:hidden", pathname === "/" ? "text-white" : "text-navy")}
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className={cn("border-t px-4 py-4 lg:hidden", pathname === "/" ? "border-white/10 bg-[#101311]/98" : "border-line bg-white/95")}>
          <form onSubmit={submitSearch} className="mb-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the collection…"
              className={cn(
                "w-full rounded-full border px-4 py-2 text-sm outline-none",
                pathname === "/" ? "border-white/15 bg-white/[0.06] text-white placeholder:text-white/40" : "border-line bg-white",
              )}
            />
          </form>
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn("rounded-lg px-3 py-2 text-sm", pathname === "/" ? "text-white/80 hover:bg-white/10" : "text-navy hover:bg-paper")}
              >
                {link.label}
              </Link>
            ))}
            {!user ? (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className={cn("rounded-lg px-3 py-2 text-sm", pathname === "/" ? "text-white/80 hover:bg-white/10" : "text-navy hover:bg-paper")}>
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className={cn("rounded-lg px-3 py-2 text-sm", pathname === "/" ? "text-white/80 hover:bg-white/10" : "text-navy hover:bg-paper")}>
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
          className="absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-3xl border border-line bg-white shadow-[0_18px_40px_rgba(11,31,58,0.12)]"
        >
          <div className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-navy">{user.name}</p>
                <p className="mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-navy-soft uppercase">
                  {user.isMember ? "Member" : "Free plan"}
                </p>
              </div>
            </div>

            <p className="mt-4 flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5 text-sm text-navy-mid">
              <Mail className="size-4 shrink-0 text-muted" />
              <span className="truncate">{user.email}</span>
            </p>

            <div className="mt-3 flex flex-col gap-2.5">
              <Link
                href="/membership"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-mid"
              >
                <CreditCard className="size-4" />
                Membership
              </Link>
              <Link
                href="/library"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-navy hover:bg-paper"
              >
                <BookOpen className="size-4 text-muted" />
                My Library
              </Link>
              {user.isAuthor ? (
                <Link
                  href="/author"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-navy hover:bg-paper"
                >
                  <PenLine className="size-4 text-muted" />
                  Author
                </Link>
              ) : null}
            </div>
          </div>

          <form action={signOutAction} className="border-t border-line bg-paper/70">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm text-muted hover:text-navy"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
