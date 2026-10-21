"use client";

import { Suspense, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import {
  cancelMembershipAction,
  createMembershipCheckoutAction,
  verifyCheckoutSessionAction,
} from "@/app/actions/membership";
import { CheckCircle2, CreditCard, Loader2, RefreshCw, TriangleAlert } from "lucide-react";

export function MembershipPurchase({
  session,
  renewal = false,
  autoRenewActive = false,
}: {
  session: Session | null;
  renewal?: boolean;
  autoRenewActive?: boolean;
}) {
  return (
    <SessionProvider session={session}>
      <Suspense fallback={<div className="h-20 animate-pulse rounded-lg bg-slate-100" />}>
        <MembershipPurchaseButton renewal={renewal} autoRenewActive={autoRenewActive} />
      </Suspense>
    </SessionProvider>
  );
}

function MembershipPurchaseButton({
  renewal,
  autoRenewActive,
}: {
  renewal: boolean;
  autoRenewActive?: boolean;
}) {
  const { data, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [autoRenew, setAutoRenew] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isCancelled = searchParams.get("payment") === "cancelled";
  const hasSuccessParams = searchParams.get("payment") === "success" && Boolean(searchParams.get("session_id"));
  const [isVerifying, setIsVerifying] = useState(hasSuccessParams);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (isCancelled) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [isCancelled]);

  // Check for Stripe redirect query params
  useEffect(() => {
    const payment = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    if (payment === "success" && sessionId && !verifiedRef.current) {
      verifiedRef.current = true;
      let cancelled = false;

      verifyCheckoutSessionAction(sessionId)
        .then(async (result) => {
          if (cancelled) return;
          if (result.success) {
            setNotice("Payment verified! Your membership is active.");
            await update({
              isMember: true,
              isAuthor: data?.user?.isAuthor,
            });
            router.refresh();
          } else {
            setError(result.error ?? "Failed to verify Stripe payment.");
          }
        })
        .catch(() => {
          if (!cancelled) setError("An error occurred while verifying your payment.");
        })
        .finally(() => {
          if (!cancelled) setIsVerifying(false);
          window.history.replaceState({}, "", window.location.pathname);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [searchParams, update, router, data?.user?.isAuthor]);

  function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    startTransition(async () => {
      const result = await createMembershipCheckoutAction(autoRenew);
      if (!result.success || !result.checkoutUrl) {
        setError(result.error ?? "Could not initiate payment gateway.");
        return;
      }

      // Redirect user directly to Stripe Hosted Checkout
      window.location.href = result.checkoutUrl;
    });
  }

  return (
    <div className="mt-4">
      {isVerifying ? (
        <div className="my-3 flex items-center justify-center gap-2 rounded-lg border border-line bg-[#f8f9fa] p-3 text-sm text-navy">
          <Loader2 className="size-4 animate-spin" />
          Verifying Stripe payment…
        </div>
      ) : null}

      {notice ? (
        <div role="status" className="my-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>{notice}</span>
        </div>
      ) : null}

      {isCancelled ? (
        <div role="alert" className="my-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <TriangleAlert className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <span>Payment checkout was cancelled. No charges were made.</span>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="my-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <TriangleAlert className="size-4 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={handleCheckout} className="space-y-4">
        {/* Toggle option for auto-deduction vs manual 30-day payment */}
        {!autoRenewActive && (
          <label className="flex items-start gap-3 rounded-lg border border-line/70 bg-white p-3 cursor-pointer select-none hover:border-line transition-colors">
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              disabled={pending || isVerifying}
              className="mt-0.5 size-4 rounded border-line text-navy focus:ring-navy cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-semibold text-navy flex items-center gap-1.5">
                <RefreshCw className="size-3 text-navy/70" />
                Auto-renew monthly (automatic deduction)
              </span>
              <p className="mt-0.5 text-muted">
                Bills automatically every month via Stripe. You can cancel at any time.
              </p>
            </div>
          </label>
        )}

        <button
          type="submit"
          disabled={pending || isVerifying}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-navy/90 disabled:opacity-60 transition-colors"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Redirecting to Stripe…
            </>
          ) : (
            <>
              <CreditCard className="size-4" />
              {renewal
                ? autoRenew
                  ? "Renew with Monthly Auto-Deduction"
                  : "Renew for 30 Days (One-Time)"
                : autoRenew
                  ? "Subscribe with Stripe (Auto-Renew)"
                  : "Pay with Stripe (30-Day Pass)"}
            </>
          )}
        </button>
      </form>

      <p className="mt-2 text-center text-[11px] text-muted">
        Secured by Stripe Checkout. Supports Cards, Apple Pay & Google Pay.
      </p>
    </div>
  );
}

export function MembershipCancel({
  session,
  autoRenewActive = false,
}: {
  session: Session | null;
  autoRenewActive?: boolean;
}) {
  return (
    <SessionProvider session={session}>
      <MembershipCancelButton autoRenewActive={autoRenewActive} />
    </SessionProvider>
  );
}

function MembershipCancelButton({ autoRenewActive }: { autoRenewActive: boolean }) {
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
    <div className="mt-3">
      <button
        type="button"
        onClick={() => {
          setError("");
          dialogRef.current?.showModal();
        }}
        className="w-full rounded-full border border-line px-4 py-2 text-xs font-medium text-navy hover:border-red-300 hover:text-red-700 transition-colors"
      >
        {autoRenewActive ? "Cancel subscription & auto-renew" : "Cancel membership"}
      </button>

      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current && !pending) dialogRef.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:backdrop-blur-md backdrop:bg-transparent"
        aria-labelledby="cancel-membership-title"
        aria-describedby="cancel-membership-description"
      >
        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="flex items-center gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-200">
              <TriangleAlert className="size-5" aria-hidden="true" />
            </span>
            <h2 id="cancel-membership-title" className="font-serif text-xl text-navy">
              {autoRenewActive ? "Cancel Stripe subscription?" : "Cancel membership?"}
            </h2>
          </div>
          <p id="cancel-membership-description" className="mt-4 text-sm leading-6 text-muted">
            {autoRenewActive
              ? "Your automatic monthly billing on Stripe will be cancelled immediately, and members-only access will end."
              : "Members-only access ends immediately. Membership fees are non-refundable."}
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
              className="min-h-10 rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60 transition-colors"
            >
              {pending ? "Cancelling…" : "Confirm cancellation"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}