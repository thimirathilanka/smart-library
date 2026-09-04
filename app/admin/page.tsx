import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">
        Collections staff
      </p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Admin dashboard</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Manage the digital catalog, members, and readership reports. Upload is
        ingest-only—readers still open works in the browser.
      </p>
      <div className="mt-8">
        <AdminDashboard />
      </div>
    </div>
  );
}
