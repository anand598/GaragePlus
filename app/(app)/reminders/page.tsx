import { RemindersLiveRefresh } from "@/app/(app)/reminders/reminders-live-refresh";
import { Panel, SectionHeading, StatusBadge } from "@/components/ui";
import { getInvoices, getReminderHistory, getWorkshop } from "@/lib/data";

export default async function RemindersPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [history, invoices, workshop] = await Promise.all([
    getReminderHistory(),
    getInvoices(),
    getWorkshop()
  ]);

  const suggested = invoices
    .filter((invoice) => invoice.workStatus === "RECEIVED" || invoice.workStatus === "IN_SERVICE" || invoice.workStatus === "READY_FOR_DELIVERY")
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <RemindersLiveRefresh />
      <Panel className="p-6">
        <SectionHeading title="Reminder Center" />
        <p className="text-sm text-slate-600">
          Launch WhatsApp or SMS with a ready-to-send customer update, and GaragePro will record the reminder in your activity log.
        </p>
        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Panel className="p-6">
          <SectionHeading title="Send Reminder" />
          <div className="space-y-4">
            {suggested.map((invoice) => (
              <div key={invoice.id} className="rounded-3xl border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{invoice.customer.name}</p>
                    <p className="text-sm text-slate-500">{invoice.vehicle.vehicleNumber} • {invoice.invoiceNumber}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {invoice.workStatus === "READY_FOR_DELIVERY"
                        ? `Hi ${invoice.customer.name}, your vehicle ${invoice.vehicle.vehicleNumber} is ready for delivery. Total amount: Rs ${invoice.grandTotal}.`
                        : invoice.workStatus === "IN_SERVICE"
                          ? `Hi ${invoice.customer.name}, your vehicle ${invoice.vehicle.vehicleNumber} is currently under service at ${workshop.name}.`
                          : `Hi ${invoice.customer.name}, your vehicle ${invoice.vehicle.vehicleNumber} has been received at ${workshop.name}.`}
                    </p>
                  </div>
                  <StatusBadge label={invoice.workStatus.replaceAll("_", " ")} tone={invoice.workStatus === "READY_FOR_DELIVERY" ? "violet" : "amber"} />
                </div>
                <div className="mt-4 flex gap-3">
                  <a
                    href={`/reminders/dispatch?invoiceId=${invoice.id}&channel=WHATSAPP`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    Open WhatsApp
                  </a>
                  <a
                    href={`/reminders/dispatch?invoiceId=${invoice.id}&channel=SMS`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    Open SMS
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading title="Reminder History" />
          <div className="space-y-4">
            {history.length === 0 && <p className="text-sm text-slate-500">No reminders have been sent yet.</p>}
            {history.map((entry) => (
              <div key={entry.id} className="rounded-3xl border border-slate-100 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.customerName}</p>
                    <p className="text-sm text-slate-500">{entry.vehicleNumber}</p>
                  </div>
                  <StatusBadge label={entry.channel} tone={entry.channel === "WHATSAPP" ? "green" : "blue"} />
                </div>
                <p className="mt-3 text-sm text-slate-600">{entry.message}</p>
                <p className="mt-3 text-xs text-slate-500">
                  Sent by {entry.sentByName ?? "System"} on {new Date(entry.sentAt).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
