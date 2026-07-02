import Link from "next/link";
import { createCustomerAction } from "@/app/(app)/actions";
import { ActionFeedbackBanner, Panel, SectionHeading } from "@/components/ui";
import { canCreateCustomers, requireSession } from "@/lib/auth";
import { getCustomers, getInvoices, getVehicles } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function CustomersPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string; q?: string }>;
}) {
  const session = await requireSession();
  const { status, message, q = "" } = await searchParams;
  const customers = await getCustomers();
  const vehicles = await getVehicles();
  const invoices = await getInvoices();
  const canCreate = canCreateCustomers(session.role);
  const needle = q.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) => {
    if (!needle) return true;
    const customerVehicles = vehicles.filter((vehicle) => vehicle.customerId === customer.id);
    return (
      customer.name.toLowerCase().includes(needle) ||
      customer.phone.toLowerCase().includes(needle) ||
      (customer.email?.toLowerCase().includes(needle) ?? false) ||
      customerVehicles.some((vehicle) => vehicle.vehicleNumber.toLowerCase().includes(needle))
    );
  });

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />
      {canCreate && (
        <Panel className="p-6">
          <SectionHeading title="Add Customer" />
          <form action={createCustomerAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <input type="hidden" name="redirectTo" value="/customers" />
            <input type="hidden" name="successMessage" value="Customer saved successfully." />
            <input name="name" placeholder="Name" className="field" required />
            <input name="phone" placeholder="Phone" className="field" required />
            <input name="email" placeholder="Email" className="field" />
            <input name="address" placeholder="Address" className="field" />
            <button className="btn-primary">Save Customer</button>
          </form>
        </Panel>
      )}

      <Panel className="p-6">
        <SectionHeading title="Customers" action={<Link href="/invoices/new" className="btn-primary">Create Invoice</Link>} />
        <form className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search customer, phone, email, vehicle..."
            className="field"
          />
          <div className="flex gap-2">
            <button className="btn-primary">Filter</button>
            <Link href="/customers" className="btn-secondary">Reset</Link>
          </div>
        </form>
        <p className="mb-4 text-sm text-slate-500">{filteredCustomers.length} customer(s) found</p>
        <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="py-3 font-medium">Customer</th>
              <th className="py-3 font-medium">Phone</th>
              <th className="py-3 font-medium">Vehicles</th>
              <th className="py-3 font-medium">Visits</th>
              <th className="py-3 font-medium">Total Spent</th>
              <th className="py-3 font-medium">Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => {
              const customerVehicles = vehicles.filter((vehicle) => vehicle.customerId === customer.id);
              const customerInvoices = invoices.filter((invoice) => invoice.customerId === customer.id);
              return (
                <tr key={customer.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-4">
                    <Link href={`/customers/${customer.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {customer.name}
                    </Link>
                    <p className="text-xs text-slate-500">{customer.email}</p>
                  </td>
                  <td className="py-4">{customer.phone}</td>
                  <td className="py-4">{customerVehicles.map((vehicle) => vehicle.vehicleNumber).join(", ")}</td>
                  <td className="py-4">{customerInvoices.length}</td>
                  <td className="py-4">{formatCurrency(customerInvoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0))}</td>
                  <td className="py-4">{customerInvoices[0] ? formatDate(customerInvoices[0].createdAt) : "-"}</td>
                </tr>
              );
            })}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                  No customers match the current filters.
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
