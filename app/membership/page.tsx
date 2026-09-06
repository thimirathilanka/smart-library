import { auth } from "@/auth";
import { getMemberById } from "@/lib/data/members";
import { formatLongDate } from "@/lib/format";

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
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">
        Account
      </p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Membership</h1>
      {active && expiresAt ? (
        <p className="mt-4 text-muted">Expires on {formatLongDate(expiresAt)}</p>
      ) : (
        <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm">
          <p className="text-sm text-muted">Free plan</p>
          <p className="mt-2 font-serif text-2xl text-navy">Rs. 1,000 per month</p>
          <button
            type="button"
            className="mt-5 w-full rounded-full bg-navy px-4 py-2.5 text-sm font-medium text-white"
          >
            Get membership
          </button>
        </div>
      )}
    </div>
  );
}
