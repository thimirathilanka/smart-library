import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAdminCatalog } from "@/lib/data/catalog";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const catalog = await getAdminCatalog();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">
        Collections staff
      </p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Admin dashboard</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Manage the digital catalog, members, and readership reports. New
        resources are prepared for in-browser reading.
      </p>
      <div className="mt-8">
        <AdminDashboard catalog={catalog} />
      </div>
    </div>
  );
}
