import Link from "next/link";
import { updateInvoicePaymentAction } from "@/app/(app)/actions";
import { ActionFeedbackBanner, Panel, SectionHeading, StatusBadge } from "@/components/ui";
import { canManageBilling, requireSession } from "@/lib/auth";
import { getInvoices } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function PaymentsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string; q?: string; paymentStatus?: string }>;
}) {
  const session = await requireSession();
  const { status, message, q = "", paymentStatus = "" } = await searchParams;
  const needle = q.trim().toLowerCase();
  const invoices = (await getInvoices())
    .filter((invoice) => invoice.paymentStatus !== "PAID")
    .filter((invoice) => {
      const matchesQuery =
        !needle ||
        invoice.invoiceNumber.toLowerCase().includes(needle) ||
        invoice.customer.name.toLowerCase().includes(needle) ||
        invoice.vehicle.vehicleNumber.toLowerCase().includes(needle);
      const matchesPaymentStatus = !paymentStatus || invoice.paymentStatus === paymentStatus;
      return matchesQuery && matchesPaymentStatus;
    });
  const canManage = canManageBilling(session.role);

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />
      <Panel className="p-6">
        <SectionHeading title="Pending Payments" />
        <form className="mb-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_auto]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search invoice, customer, vehicle..."
            className="field"
          />
          <select name="paymentStatus" defaultValue={paymentStatus} className="field">
            <option value="">All pending statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
          </select>
          <div className="flex gap-2">
            <button className="btn-primary">Filter</button>
            <Link href="/payments" className="btn-secondary">Reset</Link>
          </div>
        </form>
        <p className="mb-4 text-sm text-slate-500">{invoices.length} pending invoice(s) found</p>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-100 p-5">
            <div>
              <p className="font-semibold">{invoice.invoiceNumber}</p>
              <p className="text-sm text-slate-500">{invoice.customer.name} • {invoice.vehicle.vehicleNumber}</p>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge label={invoice.paymentStatus} tone={invoice.paymentStatus === "PARTIAL" ? "amber" : "red"} />
              <p className="font-semibold">{formatCurrency(invoice.grandTotal - invoice.amountPaid)}</p>
            </div>
            {canManage && (
              <form action={updateInvoicePaymentAction} className="grid gap-3 md:grid-cols-4">
                <input type="hidden" name="redirectTo" value="/payments" />
                <input type="hidden" name="successMessage" value="Payment updated successfully." />
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <select name="paymentStatus" defaultValue={invoice.paymentStatus} className="field">
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                </select>
                <select name="paymentMode" defaultValue={invoice.paymentMode ?? ""} className="field">
                  <option value="">Payment Mode</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
                <input name="amountPaid" type="number" step="0.01" defaultValue={invoice.amountPaid} className="field" />
                <button className="btn-primary">Record Payment</button>
              </form>
            )}
            </div>
          ))}
          {invoices.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              No pending payments match the current filters.
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
