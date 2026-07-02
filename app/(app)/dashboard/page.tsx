import { ArrowRight, CircleDollarSign, Clock3, PackageCheck, Receipt, Users, Wrench } from "lucide-react";
import Link from "next/link";
import { Panel, SectionHeading, StatusBadge } from "@/components/ui";
import { getDashboardData } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();

  const cards = [
    { label: "Today's Revenue", value: formatCurrency(data.metrics.todayRevenue), icon: CircleDollarSign, tone: "text-blue-600" },
    { label: "Vehicles Received", value: data.metrics.vehiclesReceived, icon: Receipt, tone: "text-emerald-600" },
    { label: "In Service", value: data.metrics.vehiclesInService, icon: Wrench, tone: "text-amber-500" },
    { label: "Ready For Delivery", value: data.metrics.readyForDelivery, icon: Clock3, tone: "text-violet-600" },
    { label: "Pending Payments", value: formatCurrency(data.metrics.pendingPayments), icon: Receipt, tone: "text-rose-500" },
    { label: "Total Customers", value: data.metrics.totalCustomers, icon: Users, tone: "text-cyan-600" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Panel key={card.label} className="p-5">
              <div className="flex items-center justify-between">
                <div className={`rounded-2xl bg-slate-50 p-3 ${card.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
            </Panel>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1.4fr_1fr]">
        <Panel className="p-6">
          <SectionHeading title="Vehicle Status Overview" />
          <div className="space-y-4">
            {[
              ["Received", data.metrics.vehiclesReceived],
              ["In Service", data.metrics.vehiclesInService],
              ["Ready", data.metrics.readyForDelivery],
              ["Delivered", data.metrics.deliveredToday]
            ].map(([label, count]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">{label}</span>
                <span className="text-lg font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading title="Reminder Alerts" action={<Link href="/vehicle-status" className="text-sm text-blue-600">View all</Link>} />
          <div className="space-y-4">
            {data.reminders.map((reminder) => (
              <div key={reminder.invoiceId} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 p-4">
                <div>
                  <p className="font-medium text-slate-900">{reminder.customerName}</p>
                  <p className="text-sm text-slate-500">{reminder.vehicleNumber}</p>
                  <p className="mt-2 text-sm text-slate-600">{reminder.message}</p>
                </div>
                <a
                  href={`/reminders/dispatch?invoiceId=${reminder.invoiceId}&channel=WHATSAPP`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary shrink-0"
                >
                  Send Reminder
                </a>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading title="Delivery Due Today" action={<Link href="/vehicle-status" className="text-sm text-blue-600">View all</Link>} />
          <div className="space-y-4">
            {data.dueToday.map((entry) => (
              <div key={entry.invoiceId} className="rounded-2xl border border-slate-100 p-4">
                <p className="font-medium text-slate-900">{entry.customerName}</p>
                <p className="text-sm text-slate-500">{entry.vehicleNumber}</p>
                <p className="mt-3 text-sm text-blue-600">{new Date(entry.dueDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <Panel className="p-6">
          <SectionHeading title="Recent Invoices" action={<Link href="/invoices" className="text-sm text-blue-600">View all</Link>} />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="py-3 font-medium">Invoice #</th>
                  <th className="py-3 font-medium">Customer</th>
                  <th className="py-3 font-medium">Vehicle</th>
                  <th className="py-3 font-medium">Date</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 font-medium text-slate-900">{invoice.invoiceNumber}</td>
                    <td className="py-4">{invoice.customer.name}</td>
                    <td className="py-4">{invoice.vehicle.vehicleNumber}</td>
                    <td className="py-4">{formatDate(invoice.createdAt)}</td>
                    <td className="py-4">
                      <StatusBadge
                        label={invoice.workStatus.replaceAll("_", " ")}
                        tone={invoice.workStatus === "DELIVERED" ? "green" : invoice.workStatus === "READY_FOR_DELIVERY" ? "violet" : "amber"}
                      />
                    </td>
                    <td className="py-4 font-medium">{formatCurrency(invoice.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading title="Quick Actions" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { href: "/invoices/new", label: "New Invoice" },
              { href: "/customers", label: "Add Customer" },
              { href: "/services", label: "Add Service" },
              { href: "/parts", label: "Add Spare Part" }
            ].map((action) => (
              <Link key={action.href} href={action.href} className="rounded-3xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50">
                <PackageCheck className="h-8 w-8 text-blue-600" />
                <p className="mt-8 font-medium">{action.label}</p>
                <div className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600">
                  Open <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
