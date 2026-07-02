import Link from "next/link";
import { Panel, SectionHeading, StatusBadge } from "@/components/ui";
import { getInvoices } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function InvoicesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; workStatus?: string; paymentStatus?: string }>;
}) {
  const invoices = await getInvoices();
  const { q = "", workStatus = "", paymentStatus = "" } = await searchParams;
  const needle = q.trim().toLowerCase();
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesQuery =
      !needle ||
      invoice.invoiceNumber.toLowerCase().includes(needle) ||
      invoice.customer.name.toLowerCase().includes(needle) ||
      invoice.customer.phone.toLowerCase().includes(needle) ||
      invoice.vehicle.vehicleNumber.toLowerCase().includes(needle);
    const matchesWorkStatus = !workStatus || invoice.workStatus === workStatus;
    const matchesPaymentStatus = !paymentStatus || invoice.paymentStatus === paymentStatus;
    return matchesQuery && matchesWorkStatus && matchesPaymentStatus;
  });

  return (
    <Panel className="p-6">
      <SectionHeading title="Invoice History" action={<Link href="/invoices/new" className="btn-primary">New Invoice</Link>} />
      <form className="mb-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search invoice, customer, vehicle..."
          className="field"
        />
        <select name="workStatus" defaultValue={workStatus} className="field">
          <option value="">All work statuses</option>
          <option value="RECEIVED">Received</option>
          <option value="IN_SERVICE">In Service</option>
          <option value="READY_FOR_DELIVERY">Ready For Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select name="paymentStatus" defaultValue={paymentStatus} className="field">
          <option value="">All payment statuses</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
        </select>
        <div className="flex gap-2">
          <button className="btn-primary">Filter</button>
          <Link href="/invoices" className="btn-secondary">Reset</Link>
        </div>
      </form>
      <p className="mb-4 text-sm text-slate-500">{filteredInvoices.length} invoice(s) found</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="py-3 font-medium">Invoice #</th>
              <th className="py-3 font-medium">Customer</th>
              <th className="py-3 font-medium">Vehicle</th>
              <th className="py-3 font-medium">Date</th>
              <th className="py-3 font-medium">Work Status</th>
              <th className="py-3 font-medium">Payment</th>
              <th className="py-3 font-medium">Total</th>
              <th className="py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-slate-100 last:border-0">
                <td className="py-4">
                  <Link href={`/invoices/${invoice.id}`} className="font-medium text-slate-900 hover:text-blue-600">{invoice.invoiceNumber}</Link>
                </td>
                <td className="py-4">{invoice.customer.name}</td>
                <td className="py-4">{invoice.vehicle.vehicleNumber}</td>
                <td className="py-4">{formatDate(invoice.createdAt)}</td>
                <td className="py-4">
                  <StatusBadge label={invoice.workStatus.replaceAll("_", " ")} tone={invoice.workStatus === "DELIVERED" ? "green" : "amber"} />
                </td>
                <td className="py-4">
                  <StatusBadge label={invoice.paymentStatus} tone={invoice.paymentStatus === "PAID" ? "green" : invoice.paymentStatus === "PARTIAL" ? "amber" : "red"} />
                </td>
                <td className="py-4 font-semibold">{formatCurrency(invoice.grandTotal)}</td>
                <td className="py-4">
                  <div className="flex gap-3 text-sm">
                    <Link href={`/invoices/${invoice.id}`} className="font-medium text-slate-700 hover:text-blue-600">
                      View
                    </Link>
                    {invoice.paymentStatus !== "PAID" && (
                      <Link href={`/invoices/${invoice.id}/edit`} className="font-medium text-blue-600 hover:text-blue-700">
                        Edit
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-slate-500">
                  No invoices match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
