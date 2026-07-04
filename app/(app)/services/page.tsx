import Link from "next/link";
import { createServiceAction, deleteServiceAction, updateServiceAction } from "@/app/(app)/actions";
import { ActionFeedbackBanner, Panel, SectionHeading, StatusBadge } from "@/components/ui";
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

  const stats = [
    { label: "Total services", value: services.length.toString() },
    { label: "Active", value: services.filter((service) => service.isActive).length.toString() },
    { label: "Categories", value: categories.length.toString() },
    {
      label: "With description",
      value: services.filter((service) => Boolean(service.description?.trim())).length.toString()
    }
  ];

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />

      {canManage && (
        <Panel className="p-6 lg:p-8">
          <SectionHeading
            title="Add Service"
            action={<p className="text-sm text-slate-500">Build a clear service catalog that billing and front-desk staff can scan fast.</p>}
          />
          <datalist id="service-category-options">
            {categories.map((entry) => (
              <option key={entry} value={entry} />
            ))}
          </datalist>
          <form action={createServiceAction} className="space-y-6">
            <input type="hidden" name="redirectTo" value="/services" />
            <input type="hidden" name="successMessage" value="Service saved successfully." />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Service identity</p>
                  <p className="mt-1 text-xs text-slate-500">Name and categorize each job the way your team speaks at the counter.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="name" placeholder="Service Name" className="field" required />
                  <input name="category" placeholder="Category" className="field" list="service-category-options" required />
                  <input name="estimatedTime" placeholder="Estimated Time" className="field" />
                  <input name="description" placeholder="Short Description" className="field" />
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Pricing tiers</p>
                  <p className="mt-1 text-xs text-slate-500">These values auto-fill when an invoice uses Standard, Premium, or Luxury pricing.</p>
                </div>
                <div className="grid gap-3">
                  <input name="standardPrice" type="number" step="0.01" placeholder="Standard Price" className="field" required />
                  <input name="premiumPrice" type="number" step="0.01" placeholder="Premium Price" className="field" required />
                  <input name="luxuryPrice" type="number" step="0.01" placeholder="Luxury Price" className="field" required />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">Keep descriptions short so teams can compare services without reading long paragraphs.</p>
              <button className="btn-primary min-w-40">Save Service</button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="p-6 lg:p-8">
        <SectionHeading
          title="Service Catalog"
          action={<p className="text-sm text-slate-500">Review pricing, delivery time, and availability without losing the big picture.</p>}
        />

        <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <form className="mb-6 grid gap-3 xl:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search service, category, description..."
            className="field"
          />
          <select name="category" defaultValue={category} className="field">
            <option value="">All categories</option>
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
          <select name="active" defaultValue={active} className="field">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex gap-2">
            <button className="btn-primary">Filter</button>
            <Link href="/services" className="btn-secondary">
              Reset
            </Link>
          </div>
        </form>

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {filteredServices.length} service{filteredServices.length === 1 ? "" : "s"} found
          </p>
          {(q || category || active) && (
            <Link href="/services" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Clear filters
            </Link>
          )}
        </div>

        {filteredServices.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center text-sm text-slate-500">
            No services match the current filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <div key={service.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{service.name}</h3>
                      <StatusBadge label={service.isActive ? "Active" : "Inactive"} tone={service.isActive ? "green" : "slate"} />
                      {service.estimatedTime ? <StatusBadge label={service.estimatedTime} tone="blue" /> : null}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1">{service.category}</span>
                      {service.description ? <span>{service.description}</span> : <span>No description added yet</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm lg:min-w-[340px]">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Standard</p>
                      <p className="mt-2 font-semibold text-slate-900">{formatCurrency(service.standardPrice)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Premium</p>
                      <p className="mt-2 font-semibold text-slate-900">{formatCurrency(service.premiumPrice)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Luxury</p>
                      <p className="mt-2 font-semibold text-slate-900">{formatCurrency(service.luxuryPrice)}</p>
                    </div>
                  </div>
                </div>

                {canManage ? (
                  <div className="space-y-4">
                    <form action={updateServiceAction} className="space-y-4">
                      <input type="hidden" name="redirectTo" value="/services" />
                      <input type="hidden" name="successMessage" value="Service updated successfully." />
                      <input type="hidden" name="serviceId" value={service.id} />

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Catalogue details</p>
                            <p className="mt-1 text-xs text-slate-500">Update labels, timing, and service copy shown during invoicing.</p>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <input name="name" defaultValue={service.name} className="field" />
                            <input name="category" defaultValue={service.category} className="field" list="service-category-options" />
                            <input name="estimatedTime" defaultValue={service.estimatedTime ?? ""} className="field" placeholder="Estimated Time" />
                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                              <input type="checkbox" name="isActive" defaultChecked={service.isActive} className="h-4 w-4 rounded border-slate-300" />
                              Keep this service available
                            </label>
                          </div>
                          <textarea
                            name="description"
                            defaultValue={service.description ?? ""}
                            className="field min-h-28"
                            placeholder="Description"
                          />
                        </div>

                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Pricing</p>
                            <p className="mt-1 text-xs text-slate-500">Keep all tiers aligned so the invoice builder stays predictable.</p>
                          </div>
                          <div className="grid gap-3">
                            <input name="standardPrice" type="number" step="0.01" defaultValue={service.standardPrice} className="field" />
                            <input name="premiumPrice" type="number" step="0.01" defaultValue={service.premiumPrice} className="field" />
                            <input name="luxuryPrice" type="number" step="0.01" defaultValue={service.luxuryPrice} className="field" />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end border-t border-slate-200 pt-4">
                        <button className="btn-primary min-w-36">Save Changes</button>
                      </div>
                    </form>

                    <form action={deleteServiceAction} className="flex justify-end border-t border-slate-100 pt-4">
                      <input type="hidden" name="redirectTo" value="/services" />
                      <input type="hidden" name="successMessage" value="Service deleted successfully." />
                      <input type="hidden" name="serviceId" value={service.id} />
                      <button className="text-sm font-medium text-rose-600 hover:text-rose-700">Delete service</button>
                    </form>
                  </div>
                ) : (
                  <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Estimated time</p>
                      <p className="mt-2 font-medium text-slate-900">{service.estimatedTime || "Not specified"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Availability</p>
                      <p className="mt-2 font-medium text-slate-900">{service.isActive ? "Available for invoicing" : "Hidden from invoicing"}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
