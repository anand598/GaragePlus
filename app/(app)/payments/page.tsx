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

  const totalOutstanding = invoices.reduce((sum, invoice) => sum + Math.max(invoice.grandTotal - invoice.amountPaid, 0), 0);
  const totalCollected = invoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0);
  const partialCount = invoices.filter((invoice) => invoice.paymentStatus === "PARTIAL").length;
  const unpaidCount = invoices.filter((invoice) => invoice.paymentStatus === "UNPAID").length;

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />

      <Panel className="p-6 lg:p-8">
        <SectionHeading
          title="Pending Payments"
          action={<p className="text-sm text-slate-500">Track balances, collect updates, and close invoices without scanning noisy rows.</p>}
        />

        <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pending invoices</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{invoices.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Outstanding</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Partially paid</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{partialCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Unpaid</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{unpaidCount}</p>
          </div>
        </div>

        <form className="mb-6 grid gap-3 xl:grid-cols-[1.2fr_0.8fr_auto]">
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
            <Link href="/payments" className="btn-secondary">
              Reset
            </Link>
          </div>
        </form>

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {invoices.length} pending invoice{invoices.length === 1 ? "" : "s"} found
          </p>
          {(q || paymentStatus) && (
            <Link href="/payments" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Clear filters
            </Link>
          )}
        </div>

        {invoices.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center text-sm text-slate-500">
            No pending payments match the current filters.
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => {
              const balanceDue = Math.max(invoice.grandTotal - invoice.amountPaid, 0);

              return (
                <div key={invoice.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{invoice.invoiceNumber}</h3>
                        <StatusBadge label={invoice.paymentStatus} tone={invoice.paymentStatus === "PARTIAL" ? "amber" : "red"} />
                        <StatusBadge label={invoice.workStatus.replaceAll("_", " ")} tone={invoice.workStatus === "READY_FOR_DELIVERY" ? "violet" : "slate"} />
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1">{invoice.customer.name}</span>
                        <span>{invoice.vehicle.vehicleNumber}</span>
                        <span>Created invoice total {formatCurrency(invoice.grandTotal)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm lg:min-w-[300px]">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Balance due</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(balanceDue)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Collected</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(invoice.amountPaid)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-sm font-semibold text-slate-900">Collection snapshot</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Customer</p>
                          <p className="mt-2 text-sm font-medium text-slate-900">{invoice.customer.name}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Vehicle</p>
                          <p className="mt-2 text-sm font-medium text-slate-900">{invoice.vehicle.vehicleNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Payment mode</p>
                          <p className="mt-2 text-sm font-medium text-slate-900">{invoice.paymentMode || "Not recorded yet"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-sm font-semibold text-slate-900">Amount flow</p>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600">
                          <span>Total billed</span>
                          <span className="font-medium text-slate-900">{formatCurrency(invoice.grandTotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Already paid</span>
                          <span className="font-medium text-slate-900">{formatCurrency(invoice.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-600">
                          <span>Still due</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(balanceDue)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <form action={updateInvoicePaymentAction} className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                      <input type="hidden" name="redirectTo" value="/payments" />
                      <input type="hidden" name="successMessage" value="Payment updated successfully." />
                      <input type="hidden" name="invoiceId" value={invoice.id} />

                      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
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
                      </div>
                    </form>
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
