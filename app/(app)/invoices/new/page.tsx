import { InvoiceBuilder } from "@/app/(app)/invoices/new/invoice-builder";
import { getCustomers, getInvoices, getParts, getServices, getVehicles, getWorkshop } from "@/lib/data";

export default async function NewInvoicePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; customerId?: string; vehicleId?: string }>;
}) {
  const workshop = await getWorkshop();
  const { q = "", customerId = "", vehicleId = "" } = await searchParams;
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
  const openInvoices = (await getInvoices())
    .filter(
      (invoice): invoice is typeof invoice & { paymentStatus: "UNPAID" | "PARTIAL" } => invoice.paymentStatus !== "PAID"
    )
    .map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customer.name,
      customerPhone: invoice.customer.phone,
      vehicleId: invoice.vehicleId,
      vehicleNumber: invoice.vehicle.vehicleNumber,
      paymentStatus: invoice.paymentStatus,
      workStatus: invoice.workStatus,
      grandTotal: invoice.grandTotal,
      amountPaid: invoice.amountPaid
    }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Create Invoice</h1>
        <p className="mt-2 text-sm text-slate-500">
          Search by vehicle number, customer name, or mobile number to start quickly. Price changes are not stored historically. Only final billed prices are written to invoice items.
        </p>
      </div>
      <InvoiceBuilder
        customers={customers}
        vehicles={vehicles}
        catalog={catalog}
        openInvoices={openInvoices}
        defaultTax={workshop.taxPercentage}
        initialLookupQuery={q}
        initialCustomerId={customerId}
        initialVehicleId={vehicleId}
      />
    </div>
  );
}
