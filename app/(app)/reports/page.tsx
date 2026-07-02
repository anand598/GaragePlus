import Link from "next/link";
import { Panel, SectionHeading } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getInvoices, getMonthlyRevenue, getPendingDeliveries } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage() {
  await requireRole(["OWNER", "MANAGER", "CASHIER"]);
  const invoices = await getInvoices();
  const today = new Date();
  const dailyRevenue = invoices
    .filter((invoice) => {
      if (invoice.paymentStatus !== "PAID") return false;
      const createdAt = new Date(invoice.createdAt);
      return createdAt.toDateString() === today.toDateString();
    })
    .reduce((sum, invoice) => sum + invoice.amountPaid, 0);
  const monthlyRevenue = await getMonthlyRevenue();
  const pendingPayments = invoices.filter((invoice) => invoice.paymentStatus !== "PAID").reduce((sum, invoice) => sum + (invoice.grandTotal - invoice.amountPaid), 0);
  const pendingDeliveries = (await getPendingDeliveries()).length;
  const deliveredVehicles = invoices.filter((invoice) => invoice.workStatus === "DELIVERED").length;
  const sparePartSales = Array.from(
    invoices
      .flatMap((invoice) => invoice.items)
      .filter((item) => item.itemType === "PART")
      .reduce((map, item) => {
        const current = map.get(item.name) ?? { name: item.name, quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue += item.totalPrice;
        map.set(item.name, current);
        return map;
      }, new Map<string, { name: string; quantity: number; revenue: number }>())
  )
    .map(([, value]) => value)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const paymentBreakdown = [
    { label: "Paid", count: invoices.filter((invoice) => invoice.paymentStatus === "PAID").length },
    { label: "Partial", count: invoices.filter((invoice) => invoice.paymentStatus === "PARTIAL").length },
    { label: "Unpaid", count: invoices.filter((invoice) => invoice.paymentStatus === "UNPAID").length }
  ];
  const workBreakdown = [
    { label: "Received", count: invoices.filter((invoice) => invoice.workStatus === "RECEIVED").length },
    { label: "In Service", count: invoices.filter((invoice) => invoice.workStatus === "IN_SERVICE").length },
    { label: "Ready", count: invoices.filter((invoice) => invoice.workStatus === "READY_FOR_DELIVERY").length },
    { label: "Delivered", count: invoices.filter((invoice) => invoice.workStatus === "DELIVERED").length }
  ];
  const monthlyBuckets = new Map<string, number>();
  for (const invoice of invoices) {
    const label = new Date(invoice.createdAt).toLocaleString("en-IN", { month: "short", year: "numeric" });
    monthlyBuckets.set(label, (monthlyBuckets.get(label) ?? 0) + invoice.amountPaid);
  }
  const topCustomers = Array.from(
    invoices.reduce((map, invoice) => {
      const key = invoice.customer.id;
      const current = map.get(key) ?? { name: invoice.customer.name, spent: 0, visits: 0 };
      current.spent += invoice.amountPaid;
      current.visits += 1;
      map.set(key, current);
      return map;
    }, new Map<string, { name: string; spent: number; visits: number }>())
  )
    .map(([, value]) => value)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const cards = [
    { label: "Daily Revenue", value: formatCurrency(dailyRevenue) },
    { label: "Monthly Revenue", value: formatCurrency(monthlyRevenue) },
    { label: "Pending Payments", value: formatCurrency(pendingPayments) },
    { label: "Pending Deliveries", value: String(pendingDeliveries) },
    { label: "Delivered Vehicles", value: String(deliveredVehicles) }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Panel key={card.label} className="p-6">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold">{card.value}</p>
          </Panel>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-6">
          <SectionHeading title="Revenue Ledger" action={<Link href="/reports/export" className="btn-secondary">Export CSV</Link>} />
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                <div>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-slate-500">{invoice.customer.name} • {invoice.paymentStatus}</p>
                </div>
                <p className="font-semibold">{formatCurrency(invoice.amountPaid)}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-6">
            <SectionHeading title="Payment Breakdown" />
            <div className="space-y-3">
              {paymentBreakdown.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-600">{entry.label}</span>
                  <span className="font-semibold">{entry.count}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-6">
            <SectionHeading title="Work Status Breakdown" />
            <div className="space-y-3">
              {workBreakdown.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-600">{entry.label}</span>
                  <span className="font-semibold">{entry.count}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="p-6">
          <SectionHeading title="Monthly Collections" />
          <div className="space-y-3">
            {Array.from(monthlyBuckets.entries()).map(([month, amount]) => (
              <div key={month} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                <span className="text-sm text-slate-600">{month}</span>
                <span className="font-semibold">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading title="Top Customers" />
          <div className="space-y-3">
            {topCustomers.map((customer) => (
              <div key={customer.name} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-slate-500">{customer.visits} visits</p>
                </div>
                <span className="font-semibold">{formatCurrency(customer.spent)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading title="Spare Part Sales" />
          <div className="space-y-3">
            {sparePartSales.length === 0 && <p className="text-sm text-slate-500">No spare part sales yet.</p>}
            {sparePartSales.map((part) => (
              <div key={part.name} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                <div>
                  <p className="font-medium">{part.name}</p>
                  <p className="text-sm text-slate-500">{part.quantity} units billed</p>
                </div>
                <span className="font-semibold">{formatCurrency(part.revenue)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
