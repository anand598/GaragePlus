import Image from "next/image";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { getInvoice, getWorkshop } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PrintableInvoicePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  const workshop = await getWorkshop();

  if (!invoice) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-white p-8 text-slate-900 print:p-6">
      <div className="mb-8 flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
        <div className="flex items-start gap-4">
          {workshop.logoUrl ? (
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <Image src={workshop.logoUrl} alt="Workshop logo" width={80} height={80} className="h-full w-full object-contain" />
            </div>
          ) : null}
          <div>
          <h1 className="text-3xl font-semibold">{workshop.name}</h1>
          <p className="mt-2 text-sm text-slate-600">{workshop.address}</p>
          <p className="text-sm text-slate-600">{workshop.phone} • {workshop.email}</p>
          <p className="text-sm text-slate-600">GST: {workshop.gstNumber ?? "N/A"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Invoice</p>
          <h2 className="mt-2 text-2xl font-semibold">{invoice.invoiceNumber}</h2>
          <p className="mt-2 text-sm text-slate-600">Date: {formatDate(invoice.createdAt)}</p>
          <PrintButton />
        </div>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Customer</h3>
          <p className="mt-3 font-semibold">{invoice.customer.name}</p>
          <p className="text-sm text-slate-600">{invoice.customer.phone}</p>
          <p className="text-sm text-slate-600">{invoice.customer.email ?? "No email"}</p>
          <p className="text-sm text-slate-600">{invoice.customer.address ?? "No address"}</p>
        </section>
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Vehicle</h3>
          <p className="mt-3 font-semibold">{invoice.vehicle.vehicleNumber}</p>
          <p className="text-sm text-slate-600">{invoice.vehicle.brand} {invoice.vehicle.model}</p>
          <p className="text-sm text-slate-600">Tier: {invoice.pricingTier}</p>
          <p className="text-sm text-slate-600">Work Status: {invoice.workStatus.replaceAll("_", " ")}</p>
        </section>
      </div>

      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-3">Item</th>
            <th className="py-3">Category</th>
            <th className="py-3">Qty</th>
            <th className="py-3">Unit Price</th>
            <th className="py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="py-3">{item.name}</td>
              <td className="py-3">{item.category ?? "-"}</td>
              <td className="py-3">{item.quantity}</td>
              <td className="py-3">{formatCurrency(item.unitPrice)}</td>
              <td className="py-3 text-right">{formatCurrency(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-8 max-w-sm space-y-3 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>{formatCurrency(invoice.discount)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(invoice.taxAmount)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold">
          <span>Grand Total</span>
          <span>{formatCurrency(invoice.grandTotal)}</span>
        </div>
        <div className="flex justify-between"><span>Payment Status</span><span>{invoice.paymentStatus}</span></div>
        <div className="flex justify-between"><span>Payment Mode</span><span>{invoice.paymentMode ?? "N/A"}</span></div>
      </div>

      {workshop.paymentQrCode ? (
        <section className="mt-10 flex items-start justify-between gap-6 border-t border-slate-200 pt-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Scan To Pay</h3>
            <p className="mt-2 text-sm text-slate-600">Customers can use this QR for UPI payments at delivery time.</p>
          </div>
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <Image src={workshop.paymentQrCode} alt="Payment QR code" width={144} height={144} className="h-full w-full object-contain" />
          </div>
        </section>
      ) : null}
    </main>
  );
}
