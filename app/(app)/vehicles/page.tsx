import Link from "next/link";
import { createVehicleAction } from "@/app/(app)/actions";
import { ActionFeedbackBanner, Panel, SectionHeading } from "@/components/ui";
import { canCreateCustomers, requireSession } from "@/lib/auth";
import { getCustomers, getVehicles } from "@/lib/data";

export default async function VehiclesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string; q?: string; customerId?: string }>;
}) {
  const session = await requireSession();
  const { status, message, q = "", customerId = "" } = await searchParams;
  const vehicles = await getVehicles();
  const customers = await getCustomers();
  const canCreate = canCreateCustomers(session.role);
  const needle = q.trim().toLowerCase();
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesQuery =
      !needle ||
      vehicle.vehicleNumber.toLowerCase().includes(needle) ||
      vehicle.brand.toLowerCase().includes(needle) ||
      vehicle.model.toLowerCase().includes(needle) ||
      (vehicle.customer?.name.toLowerCase().includes(needle) ?? false);
    const matchesCustomer = !customerId || vehicle.customerId === customerId;
    return matchesQuery && matchesCustomer;
  });

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />
      {canCreate && (
        <Panel className="p-6">
          <SectionHeading title="Add Vehicle" />
          <form action={createVehicleAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input type="hidden" name="redirectTo" value="/vehicles" />
            <input type="hidden" name="successMessage" value="Vehicle saved successfully." />
            <select name="customerId" className="field" required>
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <input name="vehicleNumber" placeholder="Vehicle Number" className="field" required />
            <input name="brand" placeholder="Brand" className="field" required />
            <input name="model" placeholder="Model" className="field" required />
            <input name="year" placeholder="Year" type="number" className="field" />
            <input name="fuelType" placeholder="Fuel Type" className="field" />
            <input name="odometer" placeholder="Odometer" type="number" className="field" />
            <button className="btn-primary">Save Vehicle</button>
          </form>
        </Panel>
      )}

      <Panel className="p-6">
        <SectionHeading title="Vehicles" />
        <form className="mb-5 grid gap-3 lg:grid-cols-[1fr_0.8fr_auto]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search vehicle, brand, model, customer..."
            className="field"
          />
          <select name="customerId" defaultValue={customerId} className="field">
            <option value="">All customers</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
          <div className="flex gap-2">
            <button className="btn-primary">Filter</button>
            <Link href="/vehicles" className="btn-secondary">Reset</Link>
          </div>
        </form>
        <p className="mb-4 text-sm text-slate-500">{filteredVehicles.length} vehicle(s) found</p>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="rounded-3xl border border-slate-100 p-5">
            <p className="text-lg font-semibold text-slate-900">{vehicle.vehicleNumber}</p>
            <p className="mt-1 text-sm text-slate-500">{vehicle.brand} {vehicle.model}</p>
            <p className="mt-4 text-sm text-slate-700">Customer: {vehicle.customer?.name}</p>
            <p className="text-sm text-slate-600">Year: {vehicle.year ?? "-"}</p>
            <p className="text-sm text-slate-600">Fuel: {vehicle.fuelType ?? "-"}</p>
            <p className="text-sm text-slate-600">Odometer: {vehicle.odometer ?? 0} km</p>
          </div>
        ))}
        {filteredVehicles.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No vehicles match the current filters.
          </div>
        )}
      </div>
      </Panel>
    </div>
  );
}
