import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-xs tracking-[0.2em] text-navy-soft uppercase">404</p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Resource not found</h1>
      <p className="mt-3 text-muted">
        That title is not in the catalog. Return to the dashboard or browse
        books and papers.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-navy px-5 py-2.5 text-sm text-white hover:bg-navy-mid"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
