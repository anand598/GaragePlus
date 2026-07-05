import Link from "next/link";
import { createVehicleAction } from "@/app/(app)/actions";
import { ActionFeedbackBanner, Panel, SectionHeading, StatusBadge } from "@/components/ui";
import { canCreateCustomers, requireSession } from "@/lib/auth";
import { getCustomers, getInvoices, getVehicles } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function VehiclesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string; q?: string; customerId?: string }>;
}) {
  const session = await requireSession();
  const { status, message, q = "", customerId = "" } = await searchParams;
  const vehicles = await getVehicles();
  const customers = await getCustomers();
  const openInvoices = (await getInvoices()).filter((invoice) => invoice.paymentStatus !== "PAID");
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

  const stats = [
    { label: "Total vehicles", value: vehicles.length.toString() },
    { label: "Filtered", value: filteredVehicles.length.toString() },
    { label: "With open invoices", value: openInvoices.length.toString() },
    {
      label: "Customers covered",
      value: new Set(vehicles.map((vehicle) => vehicle.customerId)).size.toString()
    }
  ];

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />

      {canCreate && (
        <Panel className="p-6 lg:p-8">
          <SectionHeading
            title="Add Vehicle"
            action={<p className="text-sm text-slate-500">Keep vehicle entry quick so the team can move straight into invoicing.</p>}
          />

          <form action={createVehicleAction} className="space-y-5">
            <input type="hidden" name="redirectTo" value="/vehicles" />
            <input type="hidden" name="successMessage" value="Vehicle saved successfully." />

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Vehicle basics</p>
                  <p className="mt-1 text-xs text-slate-500">Pick the customer, then add the number plate and core model details.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <select name="customerId" className="field" required>
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <input name="vehicleNumber" placeholder="Vehicle Number" className="field" required />
                  <input name="brand" placeholder="Brand" className="field" required />
                  <input name="model" placeholder="Model" className="field" required />
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Extra details</p>
                  <p className="mt-1 text-xs text-slate-500">Add servicing context only where it helps the workshop team.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                  <input name="year" placeholder="Year" type="number" className="field" />
                  <input name="fuelType" placeholder="Fuel Type" className="field" />
                  <input name="odometer" placeholder="Odometer" type="number" className="field" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">Use the exact vehicle number format your billing and pickup teams rely on.</p>
              <button className="btn-primary min-w-40">Save Vehicle</button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="p-6 lg:p-8">
        <SectionHeading
          title="Vehicles"
          action={<p className="text-sm text-slate-500">Search quickly, spot pending billing, and jump into the next action from one list.</p>}
        />

        <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <form className="mb-6 grid gap-3 xl:grid-cols-[1.2fr_0.8fr_auto]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search vehicle, brand, model, customer..."
            className="field"
          />
          <select name="customerId" defaultValue={customerId} className="field">
            <option value="">All customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button className="btn-primary">Filter</button>
            <Link href="/vehicles" className="btn-secondary">
              Reset
            </Link>
          </div>
        </form>

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {filteredVehicles.length} vehicle{filteredVehicles.length === 1 ? "" : "s"} found
          </p>
          {(q || customerId) && (
            <Link href="/vehicles" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Clear filters
            </Link>
          )}
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center text-sm text-slate-500">
            No vehicles match the current filters.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredVehicles.map((vehicle) => {
              const openInvoice = openInvoices.find((invoice) => invoice.vehicleId === vehicle.id);

              return (
                <div key={vehicle.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <Link href={`/vehicles/${vehicle.id}`} className="text-xl font-semibold text-slate-900 hover:text-blue-600">
                        {vehicle.vehicleNumber}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">
                        {vehicle.brand} {vehicle.model}
                      </p>
                    </div>
                    {openInvoice ? (
                      <StatusBadge label={openInvoice.paymentStatus} tone={openInvoice.paymentStatus === "PARTIAL" ? "amber" : "red"} />
                    ) : (
                      <StatusBadge label="Clear" tone="green" />
                    )}
                  </div>

                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Customer</p>
                      <p className="mt-2 font-medium text-slate-900">{vehicle.customer?.name || "Not linked"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Year</p>
                      <p className="mt-2 font-medium text-slate-900">{vehicle.year ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fuel</p>
                      <p className="mt-2 font-medium text-slate-900">{vehicle.fuelType ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Odometer</p>
                      <p className="mt-2 font-medium text-slate-900">
                        {vehicle.odometer ? `${vehicle.odometer} km` : "Not recorded"}
                      </p>
                    </div>
                  </div>

                  {openInvoice ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{openInvoice.invoiceNumber}</p>
                          <p className="mt-1 text-xs text-amber-900">
                            Balance due {formatCurrency(Math.max(openInvoice.grandTotal - openInvoice.amountPaid, 0))}
                          </p>
                        </div>
                        <Link href={`/invoices/${openInvoice.id}/edit`} className="font-medium text-blue-600 hover:text-blue-700">
                          Continue
                        </Link>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-sm">
                    <Link
                      href={`/invoices/new?customerId=${vehicle.customerId}&vehicleId=${vehicle.id}&q=${encodeURIComponent(vehicle.vehicleNumber)}`}
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      New Invoice
                    </Link>
                    {vehicle.customer ? (
                      <Link href={`/customers/${vehicle.customerId}`} className="font-medium text-slate-600 hover:text-slate-900">
                        Customer
                      </Link>
                    ) : null}
                    <Link href={`/vehicles/${vehicle.id}`} className="font-medium text-slate-600 hover:text-slate-900">
                      Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
