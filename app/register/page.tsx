import { RegisterForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">
        Members
      </p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Create an account</h1>
      <p className="mt-2 text-muted">
        Join Nextgen Digital Library to save papers and keep reading history.
      </p>
      <RegisterForm />
    </div>
  );
}
