import Link from "next/link";
import { Panel, SectionHeading, StatusBadge } from "@/components/ui";
import { searchRecords } from "@/lib/data";

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = await searchRecords(q);

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <SectionHeading title="Search" />
        <p className="text-sm text-slate-600">
          Results for <span className="font-semibold">{q || "all records"}</span>
        </p>
      </Panel>

      <Panel className="p-6">
        <SectionHeading title={`Customers (${results.customers.length})`} />
        <div className="space-y-3">
          {results.customers.length === 0 && <p className="text-sm text-slate-500">No matching customers.</p>}
          {results.customers.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`} className="block rounded-2xl border border-slate-100 p-4 hover:border-blue-200 hover:bg-blue-50">
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-slate-500">{customer.phone} • {customer.email ?? "No email"}</p>
            </Link>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="p-6">
          <SectionHeading title={`Vehicles (${results.vehicles.length})`} />
          <div className="space-y-3">
            {results.vehicles.length === 0 && <p className="text-sm text-slate-500">No matching vehicles.</p>}
            {results.vehicles.map((vehicle) => (
              <div key={vehicle.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="font-medium">{vehicle.vehicleNumber}</p>
                <p className="text-sm text-slate-500">{vehicle.brand} {vehicle.model}</p>
                <p className="mt-1 text-sm text-slate-600">Customer: {vehicle.customerName ?? "Unknown"}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading title={`Invoices (${results.invoices.length})`} />
          <div className="space-y-3">
            {results.invoices.length === 0 && <p className="text-sm text-slate-500">No matching invoices.</p>}
            {results.invoices.map((invoice) => (
              <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="block rounded-2xl border border-slate-100 p-4 hover:border-blue-200 hover:bg-blue-50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-slate-500">{invoice.customer.name} • {invoice.vehicle.vehicleNumber}</p>
                  </div>
                  <StatusBadge label={invoice.paymentStatus} tone={invoice.paymentStatus === "PAID" ? "green" : invoice.paymentStatus === "PARTIAL" ? "amber" : "red"} />
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
