import { InvoiceBuilder } from "@/app/(app)/invoices/new/invoice-builder";
import { getCustomers, getParts, getServices, getVehicles, getWorkshop } from "@/lib/data";

export default async function NewInvoicePage() {
  const workshop = await getWorkshop();
  const customers = await getCustomers();
  const vehicles = (await getVehicles()).map((vehicle) => ({
    id: vehicle.id,
    customerId: vehicle.customerId,
    vehicleNumber: vehicle.vehicleNumber
  }));
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
        <h1 className="text-3xl font-semibold text-slate-900">Create Invoice</h1>
        <p className="mt-2 text-sm text-slate-500">Price changes are not stored historically. Only final billed prices are written to invoice items.</p>
      </div>
      <InvoiceBuilder customers={customers} vehicles={vehicles} catalog={catalog} defaultTax={workshop.taxPercentage} />
    </div>
  );
}
