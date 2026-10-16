"use client";

import Link from "next/link";
import { Bell, Check, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/notifications";
import type { NotificationEntry } from "@/lib/types";

export function NotificationPopover({
  notifications,
  unreadCount,
}: {
  notifications: NotificationEntry[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const popoverRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!popoverRef.current?.contains(event.target as Node)) setOpen(false);
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

  function followNotification(item: NotificationEntry) {
    setOpen(false);
    if (!item.read) {
      startTransition(async () => {
        await markNotificationReadAction(item.id);
        router.refresh();
      });
    }
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full border border-line bg-white/70 p-2 text-navy hover:bg-paper"
      >
        <Bell className="size-4" />
        {unreadCount ? (
          <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-bold leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section role="dialog" aria-label="Notifications" className="absolute top-full right-0 z-50 mt-3 flex max-h-[min(34rem,calc(100vh-6rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_48px_rgba(11,31,58,0.18)]">
          <header className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-navy">Notifications</h2>
              <p className="mt-0.5 text-xs text-muted">{unreadCount ? `${unreadCount} unread` : "You’re all caught up"}</p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount ? (
                <button type="button" onClick={markAllRead} disabled={isPending} className="rounded-lg px-2 py-1.5 text-xs font-medium text-navy-soft hover:bg-paper hover:text-navy disabled:opacity-50">
                  Mark all read
                </button>
              ) : null}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-navy">
                <X className="size-4" />
              </button>
            </div>
          </header>

          <div className="overflow-y-auto">
            {notifications.length ? notifications.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => followNotification(item)}
                className={`flex gap-3 border-b border-line/70 px-4 py-3.5 transition hover:bg-paper/80 ${item.read ? "" : "bg-sky-50/60"}`}
              >
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read ? "bg-transparent" : "bg-amber"}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold leading-5 text-navy">{item.title}</span>
                    {item.read ? <Check className="mt-0.5 size-3.5 shrink-0 text-muted" aria-label="Read" /> : null}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-navy-mid">{item.message}</span>
                  <time className="mt-1.5 block text-[11px] text-muted" dateTime={item.createdAt}>{timeAgo(item.createdAt)}</time>
                </span>
              </Link>
            )) : (
              <div className="px-6 py-10 text-center">
                <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-paper text-muted"><Bell className="size-4" /></span>
                <p className="mt-3 text-sm font-medium text-navy">No notifications yet</p>
                <p className="mt-1 text-xs leading-5 text-muted">Updates about your library activity will appear here.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function timeAgo(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(value).toLocaleDateString();
}
