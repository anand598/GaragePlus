import Link from "next/link";
import { createServiceAction, deleteServiceAction, updateServiceAction } from "@/app/(app)/actions";
import { ActionFeedbackBanner, Panel, SectionHeading } from "@/components/ui";
import { canManageCatalog, requireSession } from "@/lib/auth";
import { getServices } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function ServicesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string; q?: string; category?: string; active?: string }>;
}) {
  const session = await requireSession();
  const { status, message, q = "", category = "", active = "" } = await searchParams;
  const services = await getServices();
  const canManage = canManageCatalog(session.role);
  const needle = q.trim().toLowerCase();
  const categories = Array.from(new Set(services.map((service) => service.category))).sort();
  const filteredServices = services.filter((service) => {
    const matchesQuery =
      !needle ||
      service.name.toLowerCase().includes(needle) ||
      service.category.toLowerCase().includes(needle) ||
      (service.description?.toLowerCase().includes(needle) ?? false);
    const matchesCategory = !category || service.category === category;
    const matchesActive =
      !active ||
      (active === "active" && service.isActive) ||
      (active === "inactive" && !service.isActive);
    return matchesQuery && matchesCategory && matchesActive;
  });

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />
      {canManage && (
        <Panel className="p-6">
          <SectionHeading title="Add Service" />
          <form action={createServiceAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input type="hidden" name="redirectTo" value="/services" />
            <input type="hidden" name="successMessage" value="Service saved successfully." />
            <input name="name" placeholder="Service Name" className="field" required />
            <input name="category" placeholder="Category" className="field" required />
            <input name="estimatedTime" placeholder="Estimated Time" className="field" />
            <input name="description" placeholder="Description" className="field" />
            <input name="standardPrice" type="number" step="0.01" placeholder="Standard Price" className="field" required />
            <input name="premiumPrice" type="number" step="0.01" placeholder="Premium Price" className="field" required />
            <input name="luxuryPrice" type="number" step="0.01" placeholder="Luxury Price" className="field" required />
            <button className="btn-primary">Save Service</button>
          </form>
        </Panel>
      )}

      <Panel className="p-6">
        <SectionHeading title="Service Catalog" />
        <form className="mb-5 grid gap-3 lg:grid-cols-[1fr_0.7fr_0.7fr_auto]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search service, category, description..."
            className="field"
          />
          <select name="category" defaultValue={category} className="field">
            <option value="">All categories</option>
            {categories.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </select>
          <select name="active" defaultValue={active} className="field">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex gap-2">
            <button className="btn-primary">Filter</button>
            <Link href="/services" className="btn-secondary">Reset</Link>
          </div>
        </form>
        <p className="mb-4 text-sm text-slate-500">{filteredServices.length} service(s) found</p>
        <div className="grid gap-4 xl:grid-cols-2">
        {filteredServices.map((service) => (
          <div key={service.id} className="rounded-3xl border border-slate-100 p-5">
            {canManage ? (
              <form action={updateServiceAction} className="space-y-4">
                <input type="hidden" name="redirectTo" value="/services" />
                <input type="hidden" name="successMessage" value="Service updated successfully." />
                <input type="hidden" name="serviceId" value={service.id} />
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="name" defaultValue={service.name} className="field" />
                  <input name="category" defaultValue={service.category} className="field" />
                  <input name="estimatedTime" defaultValue={service.estimatedTime} className="field" placeholder="Estimated Time" />
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                    <input type="checkbox" name="isActive" defaultChecked={service.isActive} />
                    Active
                  </label>
                </div>
                <textarea name="description" defaultValue={service.description} className="field min-h-24" placeholder="Description" />
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <input name="standardPrice" type="number" step="0.01" defaultValue={service.standardPrice} className="field" />
                  <input name="premiumPrice" type="number" step="0.01" defaultValue={service.premiumPrice} className="field" />
                  <input name="luxuryPrice" type="number" step="0.01" defaultValue={service.luxuryPrice} className="field" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-primary">Save Service</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{service.name}</p>
                    <p className="text-sm text-slate-500">{service.category}</p>
                    <p className="mt-3 text-sm text-slate-600">{service.description}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{service.estimatedTime}</span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-slate-500">Standard</p><p className="mt-1 font-semibold">{formatCurrency(service.standardPrice)}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-slate-500">Premium</p><p className="mt-1 font-semibold">{formatCurrency(service.premiumPrice)}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-slate-500">Luxury</p><p className="mt-1 font-semibold">{formatCurrency(service.luxuryPrice)}</p></div>
                </div>
              </>
            )}
            {canManage && (
              <form action={deleteServiceAction} className="mt-3">
                <input type="hidden" name="redirectTo" value="/services" />
                <input type="hidden" name="successMessage" value="Service deleted successfully." />
                <input type="hidden" name="serviceId" value={service.id} />
                <button className="text-sm text-rose-600">Delete Service</button>
              </form>
            )}
          </div>
        ))}
        {filteredServices.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No services match the current filters.
          </div>
        )}
      </div>
      </Panel>
    </div>
  );
}
