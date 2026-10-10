import { auth } from "@/auth";
import { getMemberById, hasActiveMembership } from "@/lib/data/members";
import { formatLongDate } from "@/lib/format";
import { MembershipCancel, MembershipPurchase } from "@/components/membership/MembershipPurchase";
import { BookOpen, Check, Crown, LibraryBig } from "lucide-react";

export const metadata = { title: "Membership" };

export default async function MembershipPage() {
  const session = await auth();
  const member = session?.user?.id ? await getMemberById(session.user.id) : null;
  const expiresAt = member?.membershipExpiresAt;
  const active = hasActiveMembership(member);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">Account</p>
        <h1 className="mt-2 font-serif text-4xl text-navy">Choose your reading plan</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Your current plan is marked below. Membership adds access to titles reserved for members.
        </p>
      </div>

      <div className="mt-9 grid items-stretch gap-5 md:grid-cols-2">
        <section
          aria-labelledby="free-plan-title"
          className={`relative flex min-h-full flex-col overflow-hidden rounded-xl border bg-white ${!active ? "border-emerald-500 ring-2 ring-emerald-100" : "border-line"}`}
        >
          <div className="border-b border-line bg-[#edf5f8] px-6 py-6 sm:px-7">
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg bg-white text-[#28667a] ring-1 ring-[#cbdfe5]">
                <BookOpen className="size-5" aria-hidden="true" />
              </span>
              {!active ? <CurrentPlanBadge /> : null}
            </div>
            <h2 id="free-plan-title" className="mt-5 font-serif text-2xl text-navy">Free</h2>
            <p className="mt-1 text-sm text-muted">Read open-access books and research.</p>
            <p className="mt-5 text-3xl font-semibold text-navy">
              Rs. 0 <span className="text-sm font-normal text-muted">/ month</span>
            </p>
          </div>
          <div className="flex flex-1 flex-col px-6 py-6 sm:px-7">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Included</p>
            <ul className="mt-4 space-y-3 text-sm text-ink">
              <PlanFeature>Browse the public catalog</PlanFeature>
              <PlanFeature>Read open-access titles online</PlanFeature>
              <PlanFeature>Save titles to your library</PlanFeature>
              <PlanFeature>Track your reading history</PlanFeature>
            </ul>
            <div className="mt-auto pt-7">
              {!active ? (
                <p className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-900">
                  <Check className="size-4" aria-hidden="true" />
                  You are on this plan
                </p>
              ) : (
                <p className="min-h-11 content-center text-center text-sm text-muted">
                  Available to all library readers
                </p>
              )}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="membership-plan-title"
          className={`relative flex min-h-full flex-col overflow-hidden rounded-xl border bg-white ${active ? "border-[#c99a24] ring-2 ring-[#f5e8c2]" : "border-line"}`}
        >
          <div className="border-b border-[#eadcad] bg-[#fbf6e8] px-6 py-6 sm:px-7">
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg bg-white text-[#8b6511] ring-1 ring-[#eadcad]">
                <Crown className="size-5" aria-hidden="true" />
              </span>
              {active ? <CurrentPlanBadge /> : null}
            </div>
            <h2 id="membership-plan-title" className="mt-5 font-serif text-2xl text-navy">Membership</h2>
            <p className="mt-1 text-sm text-muted">For readers who want the full collection.</p>
            <p className="mt-5 text-3xl font-semibold text-navy">
              Rs. 1,000 <span className="text-sm font-normal text-muted">/ 30 days</span>
            </p>
          </div>
          <div className="flex flex-1 flex-col px-6 py-6 sm:px-7">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Everything in Free, plus</p>
            <ul className="mt-4 space-y-3 text-sm text-ink">
              <PlanFeature>Read members-only books and papers</PlanFeature>
              <PlanFeature>Full in-browser reading access</PlanFeature>
              <PlanFeature>Keep saved titles and reading history</PlanFeature>
              <PlanFeature>30 days of access from renewal</PlanFeature>
            </ul>
            <div className="mt-auto pt-7">
              {active ? (
                <>
                  <p className="mb-3 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-900">
                    <Check className="size-4" aria-hidden="true" />
                    You are on this plan
                  </p>
                  {expiresAt ? (
                    <p className="mb-3 text-center text-xs text-muted">
                      Access through {formatLongDate(expiresAt)}
                    </p>
                  ) : null}
                  <MembershipPurchase session={session} renewal />
                  <MembershipCancel session={session} />
                </>
              ) : (
                <MembershipPurchase session={session} />
              )}
            </div>
          </div>
        </section>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
        <LibraryBig className="size-4" aria-hidden="true" />
        Membership access is managed by the library and can be cancelled at any time.
      </p>
    </div>
  );
}

function CurrentPlanBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white">
      <Check className="size-3.5" aria-hidden="true" />
      Your current plan
    </span>
  );
}

function PlanFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}
