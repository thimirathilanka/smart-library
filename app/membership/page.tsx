import { auth } from "@/auth";
import { getMemberById } from "@/lib/data/members";
import { formatLongDate } from "@/lib/format";
import { MembershipCancel, MembershipPurchase } from "@/components/membership/MembershipPurchase";

export const metadata = { title: "Membership" };

function isActiveMembership(isMember: boolean, expiresAt?: string) {
  if (!isMember || !expiresAt) return false;
  return expiresAt >= new Date().toISOString().slice(0, 10);
}

export default async function MembershipPage() {
  const session = await auth();
  const member = session?.user?.id ? await getMemberById(session.user.id) : null;
  const expiresAt = member?.membershipExpiresAt;
  const active = isActiveMembership(Boolean(member?.isMember), expiresAt);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">
        Account
      </p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Membership</h1>
      {active && expiresAt ? (
        <div className="mt-6 rounded-xl border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-navy">Membership plan</p>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
              Current plan
            </span>
          </div>
          <p className="mt-2 font-serif text-2xl text-navy">Rs. 1,000 per month</p>
          <p className="mt-3 text-sm text-muted">Expires on {formatLongDate(expiresAt)}</p>
          <MembershipCancel session={session} />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-navy">Free plan</p>
              <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-medium text-navy-mid ring-1 ring-line">
                Current plan
              </span>
            </div>
            <p className="mt-2 font-serif text-2xl text-navy">Rs. 0 per month</p>
          </div>
          <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-navy">Membership plan</p>
            <p className="mt-2 font-serif text-2xl text-navy">Rs. 1,000 per month</p>
            <MembershipPurchase session={session} />
          </div>
        </div>
      )}
    </div>
  );
}
