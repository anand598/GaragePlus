import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceBuilder } from "@/app/(app)/invoices/new/invoice-builder";
import { Panel } from "@/components/ui";
import { getCustomers, getInvoice, getParts, getServices, getVehicles, getWorkshop } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    notFound();
  }

  if (invoice.paymentStatus === "PAID") {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Invoice Locked</h1>
          <p className="mt-2 text-sm text-slate-500">
            This invoice is fully paid and can no longer be modified.
          </p>
        </div>
        <Panel className="space-y-4 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Invoice</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{invoice.invoiceNumber}</h2>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
            <p><span className="font-medium text-slate-900">Customer:</span> {invoice.customer.name}</p>
            <p><span className="font-medium text-slate-900">Vehicle:</span> {invoice.vehicle.vehicleNumber}</p>
            <p><span className="font-medium text-slate-900">Paid:</span> {formatCurrency(invoice.amountPaid)}</p>
          </div>
          <Link href={`/invoices/${invoice.id}`} className="btn-secondary w-full sm:w-auto">
            Back to Invoice
          </Link>
        </Panel>
      </div>
    );
  }

  const workshop = await getWorkshop();
  const customers = await getCustomers();
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const vehicles = (await getVehicles()).map((vehicle) => {
    const customer = customerById.get(vehicle.customerId);
    return {
      id: vehicle.id,
      customerId: vehicle.customerId,
      vehicleNumber: vehicle.vehicleNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      customerName: customer?.name,
      customerPhone: customer?.phone
    };
  });

  const catalog = [
    ...(await getServices()).map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
      type: "SERVICE" as const,
      standardPrice: service.standardPrice,
      premiumPrice: service.premiumPrice,
      luxuryPrice: service.luxuryPrice
    })),
    ...(await getParts()).map((part) => ({
      id: part.id,
      name: part.name,
      category: part.category,
      type: "PART" as const,
      standardPrice: part.standardPrice,
      premiumPrice: part.premiumPrice,
      luxuryPrice: part.luxuryPrice
    }))
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Edit Invoice</h1>
        <p className="mt-2 text-sm text-slate-500">
          Update customer, vehicle, status, and line items while payment is still pending or partial.
        </p>
      </div>
      <InvoiceBuilder
        customers={customers}
        vehicles={vehicles}
        catalog={catalog}
        defaultTax={workshop.taxPercentage}
        mode="edit"
        invoiceId={invoice.id}
        amountPaid={invoice.amountPaid}
        initialLookupQuery={invoice.vehicle.vehicleNumber}
        initialValues={{
          customerId: invoice.customerId,
          vehicleId: invoice.vehicleId,
          pricingTier: invoice.pricingTier,
          paymentStatus: invoice.paymentStatus,
          paymentMode: invoice.paymentMode,
          workStatus: invoice.workStatus,
          discount: invoice.discount,
          taxPercentage: invoice.taxPercentage,
          notes: invoice.notes ?? "",
          items: invoice.items.map((item) => ({
            sourceId: item.sourceId ?? `${item.itemType}-${item.id}`,
            name: item.name,
            category: item.category,
            itemType: item.itemType,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }}
      />
    </div>
  );
}
