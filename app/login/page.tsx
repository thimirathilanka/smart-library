import { LoginForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : "/";

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">
        Members
      </p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Sign in</h1>
      <p className="mt-2 text-muted">
        Access your shelf, reading history, and members-only titles.
      </p>
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
