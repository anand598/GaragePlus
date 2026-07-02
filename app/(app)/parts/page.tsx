import Link from "next/link";
import { createPartAction, deletePartAction, updatePartAction } from "@/app/(app)/actions";
import { ActionFeedbackBanner, Panel, SectionHeading } from "@/components/ui";
import { canManageCatalog, requireSession } from "@/lib/auth";
import { getParts } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />
      {canManage && (
        <Panel className="p-6">
          <SectionHeading title="Add Spare Part" />
          <form action={createPartAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <input type="hidden" name="redirectTo" value="/parts" />
            <input type="hidden" name="successMessage" value="Part saved successfully." />
            <input name="name" placeholder="Part Name" className="field" required />
            <input name="category" placeholder="Category" className="field" required />
            <input name="brand" placeholder="Brand" className="field" />
            <input name="partNumber" placeholder="Part Number" className="field" />
            <input name="unit" placeholder="Unit" className="field" required />
            <input name="stockQuantity" type="number" placeholder="Stock Quantity (optional)" className="field" />
            <input name="standardPrice" type="number" step="0.01" placeholder="Standard Price" className="field" required />
            <input name="premiumPrice" type="number" step="0.01" placeholder="Premium Price" className="field" required />
            <input name="luxuryPrice" type="number" step="0.01" placeholder="Luxury Price" className="field" required />
            <button className="btn-primary">Save Part</button>
          </form>
          <p className="mt-3 text-xs text-slate-500">Leave stock blank to mark a spare part as untracked and skip inventory validation.</p>
        </Panel>
      )}

      <Panel className="p-6">
        <SectionHeading title="Spare Parts Inventory" />
        <form className="mb-5 grid gap-3 lg:grid-cols-[1fr_0.7fr_0.7fr_auto]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search part, category, brand, part number..."
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
            <Link href="/parts" className="btn-secondary">Reset</Link>
          </div>
        </form>
        <p className="mb-4 text-sm text-slate-500">{filteredParts.length} part(s) found</p>
        <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="py-3 font-medium">Part</th>
              <th className="py-3 font-medium">Brand</th>
              <th className="py-3 font-medium">Stock</th>
              <th className="py-3 font-medium">Standard</th>
              <th className="py-3 font-medium">Premium</th>
              <th className="py-3 font-medium">Luxury</th>
            </tr>
          </thead>
          <tbody>
            {filteredParts.map((part) => (
              <tr key={part.id} className="border-b border-slate-100 last:border-0">
                {canManage ? (
                  <>
                    <td className="py-4" colSpan={6}>
                      <div className="space-y-2">
                        <form action={updatePartAction} className="grid gap-3 xl:grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]">
                          <input type="hidden" name="redirectTo" value="/parts" />
                          <input type="hidden" name="successMessage" value="Part updated successfully." />
                          <input type="hidden" name="partId" value={part.id} />
                          <div className="space-y-2">
                            <input name="name" defaultValue={part.name} className="field" />
                            <div className="grid grid-cols-2 gap-2">
                              <input name="category" defaultValue={part.category} className="field" />
                              <input name="partNumber" defaultValue={part.partNumber} className="field" placeholder="Part #" />
                            </div>
                          </div>
                          <input name="brand" defaultValue={part.brand} className="field" placeholder="Brand" />
                          <div className="grid grid-cols-2 gap-2">
                            <input name="stockQuantity" type="number" defaultValue={part.stockQuantity ?? ""} className="field" placeholder="Untracked stock" />
                            <input name="unit" defaultValue={part.unit} className="field" />
                          </div>
                          <input name="standardPrice" type="number" step="0.01" defaultValue={part.standardPrice} className="field" />
                          <input name="premiumPrice" type="number" step="0.01" defaultValue={part.premiumPrice} className="field" />
                          <input name="luxuryPrice" type="number" step="0.01" defaultValue={part.luxuryPrice} className="field" />
                          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                            <input type="checkbox" name="isActive" defaultChecked={part.isActive} />
                            Active
                          </label>
                          <button className="btn-primary">Save</button>
                        </form>
                        <form action={deletePartAction} className="flex justify-end">
                          <input type="hidden" name="redirectTo" value="/parts" />
                          <input type="hidden" name="successMessage" value="Part deleted successfully." />
                          <input type="hidden" name="partId" value={part.id} />
                          <button className="text-sm text-rose-600">Delete</button>
                        </form>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-4">
                      <p className="font-medium">{part.name}</p>
                      <p className="text-xs text-slate-500">{part.category} • {part.partNumber}</p>
                    </td>
                    <td className="py-4">{part.brand}</td>
                    <td className="py-4">{part.stockQuantity == null ? "Untracked" : `${part.stockQuantity} ${part.unit}`}</td>
                    <td className="py-4">{formatCurrency(part.standardPrice)}</td>
                    <td className="py-4">{formatCurrency(part.premiumPrice)}</td>
                    <td className="py-4">{formatCurrency(part.luxuryPrice)}</td>
                  </>
                )}
              </tr>
            ))}
            {filteredParts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                  No spare parts match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </Panel>
    </div>
  );
}
