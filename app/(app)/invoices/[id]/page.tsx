import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, SectionHeading, StatusBadge } from "@/components/ui";
import { getInvoice, getWorkshop } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const workshop = await getWorkshop();

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Invoice</p>
            <h1 className="mt-2 text-3xl font-semibold">{invoice.invoiceNumber}</h1>
            <p className="mt-2 text-sm text-slate-500">{formatDate(invoice.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge label={invoice.paymentStatus} tone={invoice.paymentStatus === "PAID" ? "green" : "amber"} />
            <StatusBadge label={invoice.workStatus.replaceAll("_", " ")} tone={invoice.workStatus === "DELIVERED" ? "green" : "violet"} />
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel className="p-6">
          <SectionHeading title="Line Items" />
          <div className="space-y-4">
            {invoice.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.category} • Qty {item.quantity}</p>
                </div>
                <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading title="Summary" />
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-slate-900">{workshop.name}</p>
              <p className="text-slate-500">{workshop.address}</p>
              <p className="text-slate-500">{workshop.phone} • {workshop.email}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-medium">{invoice.customer.name}</p>
              <p className="text-slate-500">{invoice.customer.phone}</p>
              <p className="text-slate-500">{invoice.vehicle.vehicleNumber} • {invoice.vehicle.brand} {invoice.vehicle.model}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>{formatCurrency(invoice.discount)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(invoice.taxAmount)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><span>Grand Total</span><span>{formatCurrency(invoice.grandTotal)}</span></div>
            </div>
            <Link href={`/invoices/${invoice.id}/print`} target="_blank" className="btn-secondary w-full">
              Print Invoice
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
