import Link from "next/link";
import { createPartAction, deletePartAction, updatePartAction } from "@/app/(app)/actions";
import { ActionFeedbackBanner, Panel, SectionHeading, StatusBadge } from "@/components/ui";
import { canManageCatalog, requireSession } from "@/lib/auth";
import { getParts } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

function getStockBadge(part: { stockQuantity?: number | null }) {
  if (part.stockQuantity == null) {
    return { label: "Untracked stock", tone: "slate" as const };
  }

  if (part.stockQuantity <= 5) {
    return { label: `${part.stockQuantity} left`, tone: "amber" as const };
  }

  return { label: `${part.stockQuantity} in stock`, tone: "green" as const };
}

export default async function PartsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string; q?: string; category?: string; active?: string }>;
}) {
  const session = await requireSession();
  const { status, message, q = "", category = "", active = "" } = await searchParams;
  const parts = await getParts();
  const canManage = canManageCatalog(session.role);
  const needle = q.trim().toLowerCase();
  const categories = Array.from(new Set(parts.map((part) => part.category))).sort();
  const brands = Array.from(new Set(parts.map((part) => part.brand?.trim()).filter((brand): brand is string => Boolean(brand)))).sort();
  const filteredParts = parts.filter((part) => {
    const matchesQuery =
      !needle ||
      part.name.toLowerCase().includes(needle) ||
      part.category.toLowerCase().includes(needle) ||
      (part.brand?.toLowerCase().includes(needle) ?? false) ||
      (part.partNumber?.toLowerCase().includes(needle) ?? false);
    const matchesCategory = !category || part.category === category;
    const matchesActive =
      !active ||
      (active === "active" && part.isActive) ||
      (active === "inactive" && !part.isActive);
    return matchesQuery && matchesCategory && matchesActive;
  });

  const inventoryStats = [
    { label: "Total parts", value: parts.length.toString() },
    { label: "Active", value: parts.filter((part) => part.isActive).length.toString() },
    { label: "Tracked stock", value: parts.filter((part) => part.stockQuantity != null).length.toString() },
    { label: "Untracked", value: parts.filter((part) => part.stockQuantity == null).length.toString() }
  ];

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />

      {canManage && (
        <Panel className="p-6 lg:p-8">
          <SectionHeading
            title="Add Spare Part"
            action={<p className="text-sm text-slate-500">Create clean catalogue entries with pricing and stock in one place.</p>}
          />
          <datalist id="part-category-options">
            {categories.map((entry) => (
              <option key={entry} value={entry} />
            ))}
          </datalist>
          <datalist id="part-brand-options">
            {brands.map((entry) => (
              <option key={entry} value={entry} />
            ))}
          </datalist>
          <form action={createPartAction} className="space-y-6">
            <input type="hidden" name="redirectTo" value="/parts" />
            <input type="hidden" name="successMessage" value="Part saved successfully." />

            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Part identity</p>
                  <p className="mt-1 text-xs text-slate-500">Keep the name, category, and number easy to search later while raising invoices.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="name" placeholder="Part Name" className="field" required />
                  <input name="category" placeholder="Category" className="field" list="part-category-options" required />
                  <input name="brand" placeholder="Brand" className="field" list="part-brand-options" />
                  <input name="partNumber" placeholder="Part Number" className="field" />
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Stock setup</p>
                  <p className="mt-1 text-xs text-slate-500">Leave stock blank when the item should stay outside inventory validation.</p>
                </div>
                <div className="grid gap-3">
                  <input name="unit" placeholder="Unit" className="field" required />
                  <input name="stockQuantity" type="number" placeholder="Stock Quantity (optional)" className="field" />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">Pricing tiers</p>
                <p className="mt-1 text-xs text-slate-500">These prices feed invoice creation based on the selected customer pricing tier.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <input name="standardPrice" type="number" step="0.01" placeholder="Standard Price" className="field" required />
                <input name="premiumPrice" type="number" step="0.01" placeholder="Premium Price" className="field" required />
                <input name="luxuryPrice" type="number" step="0.01" placeholder="Luxury Price" className="field" required />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">Use concise labels so billing staff can identify parts quickly during invoicing.</p>
              <button className="btn-primary min-w-40">Save Part</button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="p-6 lg:p-8">
        <SectionHeading
          title="Spare Parts Inventory"
          action={<p className="text-sm text-slate-500">Search, review stock, and update catalogue entries without scanning a crowded table.</p>}
        />

        <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {inventoryStats.map((stat) => (
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
            placeholder="Search part, category, brand, part number..."
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
            <Link href="/parts" className="btn-secondary">
              Reset
            </Link>
          </div>
        </form>

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {filteredParts.length} part{filteredParts.length === 1 ? "" : "s"} found
          </p>
          {(q || category || active) && (
            <Link href="/parts" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Clear filters
            </Link>
          )}
        </div>

        {filteredParts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center text-sm text-slate-500">
            No spare parts match the current filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredParts.map((part) => {
              const stockBadge = getStockBadge(part);

              return (
                <div key={part.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{part.name}</h3>
                        <StatusBadge label={part.isActive ? "Active" : "Inactive"} tone={part.isActive ? "green" : "slate"} />
                        <StatusBadge label={stockBadge.label} tone={stockBadge.tone} />
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1">{part.category}</span>
                        {part.brand ? <span>Brand: {part.brand}</span> : null}
                        {part.partNumber ? <span>Part #: {part.partNumber}</span> : null}
                        <span>Unit: {part.unit}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm lg:min-w-[340px]">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Standard</p>
                        <p className="mt-2 font-semibold text-slate-900">{formatCurrency(part.standardPrice)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Premium</p>
                        <p className="mt-2 font-semibold text-slate-900">{formatCurrency(part.premiumPrice)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Luxury</p>
                        <p className="mt-2 font-semibold text-slate-900">{formatCurrency(part.luxuryPrice)}</p>
                      </div>
                    </div>
                  </div>

                  {canManage ? (
                    <div className="space-y-4">
                      <form action={updatePartAction} className="space-y-4">
                        <input type="hidden" name="redirectTo" value="/parts" />
                        <input type="hidden" name="successMessage" value="Part updated successfully." />
                        <input type="hidden" name="partId" value={part.id} />

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Catalogue details</p>
                              <p className="mt-1 text-xs text-slate-500">Rename, regroup, or update how this part appears in search.</p>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <input name="name" defaultValue={part.name} className="field" />
                            <input name="category" defaultValue={part.category} className="field" list="part-category-options" />
                            <input name="brand" defaultValue={part.brand ?? ""} className="field" list="part-brand-options" placeholder="Brand" />
                            <input name="partNumber" defaultValue={part.partNumber ?? ""} className="field" placeholder="Part Number" />
                          </div>
                        </div>

                          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Inventory and pricing</p>
                              <p className="mt-1 text-xs text-slate-500">Keep stock visibility and all pricing tiers aligned with billing.</p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                name="stockQuantity"
                                type="number"
                                defaultValue={part.stockQuantity ?? ""}
                                className="field"
                                placeholder="Untracked stock"
                              />
                              <input name="unit" defaultValue={part.unit} className="field" />
                              <input name="standardPrice" type="number" step="0.01" defaultValue={part.standardPrice} className="field" />
                              <input name="premiumPrice" type="number" step="0.01" defaultValue={part.premiumPrice} className="field" />
                              <input name="luxuryPrice" type="number" step="0.01" defaultValue={part.luxuryPrice} className="field md:col-span-2" />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <label className="flex items-center gap-3 text-sm text-slate-600">
                            <input type="checkbox" name="isActive" defaultChecked={part.isActive} className="h-4 w-4 rounded border-slate-300" />
                            Keep this part available for invoicing
                          </label>
                          <button className="btn-primary min-w-32">Save Changes</button>
                        </div>
                      </form>

                      <form action={deletePartAction} className="flex justify-end border-t border-slate-100 pt-4">
                        <input type="hidden" name="redirectTo" value="/parts" />
                        <input type="hidden" name="successMessage" value="Part deleted successfully." />
                        <input type="hidden" name="partId" value={part.id} />
                        <button className="text-sm font-medium text-rose-600 hover:text-rose-700">Delete part</button>
                      </form>
                    </div>
                  ) : (
                    <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Brand</p>
                        <p className="mt-2 font-medium text-slate-900">{part.brand || "Not specified"}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Stock</p>
                        <p className="mt-2 font-medium text-slate-900">
                          {part.stockQuantity == null ? "Untracked" : `${part.stockQuantity} ${part.unit}`}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Part number</p>
                        <p className="mt-2 font-medium text-slate-900">{part.partNumber || "Not assigned"}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
