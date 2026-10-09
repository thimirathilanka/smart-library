"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { cancelMembershipAction, purchaseMembershipAction } from "@/app/actions/membership";
import { TriangleAlert } from "lucide-react";

export function MembershipPurchase({
  session,
  renewal = false,
}: {
  session: Session | null;
  renewal?: boolean;
}) {
  return (
    <SessionProvider session={session}>
      <MembershipPurchaseButton renewal={renewal} />
    </SessionProvider>
  );
}

function MembershipPurchaseButton({ renewal }: { renewal: boolean }) {
  const { data, update } = useSession();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await purchaseMembershipAction();
      if (!result.success) {
        setError(result.error ?? "Membership could not be started.");
        return;
      }

      await update({
        isMember: result.isMember,
        isAuthor: data?.user?.isAuthor,
      });
      router.refresh();
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-full bg-navy px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Updating membership…" : renewal ? "Renew membership" : "Get membership"}
        </button>
      </form>
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
    </>
  );
}

export function MembershipCancel({ session }: { session: Session | null }) {
  return (
    <SessionProvider session={session}>
      <MembershipCancelButton />
    </SessionProvider>
  );
}

function MembershipCancelButton() {
  const { data, update } = useSession();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await cancelMembershipAction();
      if (!result.success) {
        setError(result.error ?? "Membership could not be cancelled.");
        return;
      }

      await update({
        isMember: result.isMember,
        isAuthor: data?.user?.isAuthor,
      });
      router.refresh();
      dialogRef.current?.close();
    });
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => {
          setError("");
          dialogRef.current?.showModal();
        }}
        className="rounded-full border border-line px-4 py-2 text-sm font-medium text-navy hover:border-red-300 hover:text-red-700"
      >
        Cancel membership
      </button>
      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current && !pending) dialogRef.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-navy/45 backdrop:backdrop-blur-sm"
        aria-labelledby="cancel-membership-title"
        aria-describedby="cancel-membership-description"
      >
        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="flex items-center gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-200">
              <TriangleAlert className="size-5" aria-hidden="true" />
            </span>
            <h2 id="cancel-membership-title" className="font-serif text-xl text-navy">
              Cancel membership?
            </h2>
          </div>
          <p id="cancel-membership-description" className="mt-4 text-sm leading-6 text-muted">
            Members-only access ends immediately. Membership fees are non-refundable.
          </p>
          {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={pending}
              className="min-h-10 rounded-full border border-line px-4 py-2 text-sm font-medium text-navy disabled:opacity-60"
            >
              Keep membership
            </button>
            <button
              type="submit"
              disabled={pending}
              className="min-h-10 rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
            >
              {pending ? "Cancelling…" : "Confirm cancellation"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}