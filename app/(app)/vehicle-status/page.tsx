import Link from "next/link";
import { updateInvoiceWorkStatusAction } from "@/app/(app)/actions";
import { ActionFeedbackBanner, Panel, SectionHeading, StatusBadge } from "@/components/ui";
import { canManageStatus, requireSession } from "@/lib/auth";
import { buildReminder, getInvoices, getWorkshop } from "@/lib/data";

export default async function VehicleStatusPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string; q?: string; workStatus?: string }>;
}) {
  const session = await requireSession();
  const { status, message, q = "", workStatus = "" } = await searchParams;
  const needle = q.trim().toLowerCase();
  const invoices = (await getInvoices()).filter((invoice) => {
    const matchesQuery =
      !needle ||
      invoice.invoiceNumber.toLowerCase().includes(needle) ||
      invoice.customer.name.toLowerCase().includes(needle) ||
      invoice.vehicle.vehicleNumber.toLowerCase().includes(needle);
    const matchesWorkStatus = !workStatus || invoice.workStatus === workStatus;
    return matchesQuery && matchesWorkStatus;
  });
  const workshop = await getWorkshop();
  const canManage = canManageStatus(session.role);

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />
      <Panel className="p-6">
        <SectionHeading title="Work Orders & Vehicle Status" />
        <form className="mb-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_auto]">
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
          <div className="flex gap-2">
            <button className="btn-primary">Filter</button>
            <Link href="/vehicle-status" className="btn-secondary">Reset</Link>
          </div>
        </form>
        <p className="mb-4 text-sm text-slate-500">{invoices.length} work order(s) found</p>
        <div className="space-y-4">
          {invoices.map((invoice) => {
          const reminder = buildReminder(invoice, {
            workshopName: workshop.name,
            customerName: invoice.customer.name,
            vehicleNumber: invoice.vehicle.vehicleNumber
          });
          return (
            <div key={invoice.id} className="rounded-3xl border border-slate-100 p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-slate-500">{invoice.customer.name} • {invoice.vehicle.vehicleNumber}</p>
                </div>
                <StatusBadge label={invoice.workStatus.replaceAll("_", " ")} tone={invoice.workStatus === "READY_FOR_DELIVERY" ? "violet" : invoice.workStatus === "DELIVERED" ? "green" : "amber"} />
              </div>
              <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{reminder.message}</p>
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                {canManage && (
                  <form action={updateInvoiceWorkStatusAction} className="flex flex-col gap-3 md:flex-row">
                    <input type="hidden" name="redirectTo" value="/vehicle-status" />
                    <input type="hidden" name="successMessage" value="Vehicle status updated successfully." />
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <select name="workStatus" defaultValue={invoice.workStatus} className="field min-w-52">
                      <option value="RECEIVED">Received</option>
                      <option value="IN_SERVICE">In Service</option>
                      <option value="READY_FOR_DELIVERY">Ready For Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <button className="btn-primary">Update Status</button>
                  </form>
                )}
                <a
                  href={`/reminders/dispatch?invoiceId=${invoice.id}&channel=WHATSAPP`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  Send WhatsApp
                </a>
                <a
                  href={`/reminders/dispatch?invoiceId=${invoice.id}&channel=SMS`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  Send SMS
                </a>
              </div>
            </div>
          );
        })}
        {invoices.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No work orders match the current filters.
          </div>
        )}
        </div>
      </Panel>
    </div>
  );
}
