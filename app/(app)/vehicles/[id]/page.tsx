import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteVehicleAction, updateVehicleAction } from "@/app/(app)/actions";
import { ActionFeedbackBanner, Panel, SectionHeading, StatusBadge } from "@/components/ui";
import { canCreateCustomers, requireSession } from "@/lib/auth";
import { getVehicle } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function VehicleDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const { status, message } = await searchParams;
  const data = await getVehicle(id);
  if (!data) notFound();

  const canManage = canCreateCustomers(session.role);
  const redirectTo = `/vehicles/${data.vehicle.id}`;

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />

      <Panel className="p-6">
        <SectionHeading
          title={data.vehicle.vehicleNumber}
          action={
            <Link
              href={`/invoices/new?customerId=${data.customer.id}&vehicleId=${data.vehicle.id}&q=${encodeURIComponent(data.vehicle.vehicleNumber)}`}
              className="btn-primary"
            >
              New Invoice
            </Link>
          }
        />

        {canManage ? (
          <form action={updateVehicleAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <input type="hidden" name="successMessage" value="Vehicle updated successfully." />
            <input type="hidden" name="vehicleId" value={data.vehicle.id} />
            <input type="hidden" name="customerId" value={data.customer.id} />
            <input name="vehicleNumber" defaultValue={data.vehicle.vehicleNumber} className="field" />
            <input name="brand" defaultValue={data.vehicle.brand} className="field" />
            <input name="model" defaultValue={data.vehicle.model} className="field" />
            <input name="year" type="number" defaultValue={data.vehicle.year} className="field" placeholder="Year" />
            <input name="fuelType" defaultValue={data.vehicle.fuelType} className="field" placeholder="Fuel Type" />
            <input name="odometer" type="number" defaultValue={data.vehicle.odometer} className="field" placeholder="Odometer" />
            <div className="xl:col-span-4 flex flex-wrap gap-3">
              <button className="btn-primary">Save Vehicle</button>
              <Link href={`/customers/${data.customer.id}`} className="btn-secondary">
                View Customer
              </Link>
            </div>
          </form>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <div><p className="text-sm text-slate-500">Customer</p><p className="mt-1 font-medium">{data.customer.name}</p></div>
            <div><p className="text-sm text-slate-500">Fuel</p><p className="mt-1 font-medium">{data.vehicle.fuelType ?? "-"}</p></div>
            <div><p className="text-sm text-slate-500">Total Invoices</p><p className="mt-1 font-medium">{data.invoices.length}</p></div>
            <div><p className="text-sm text-slate-500">Collected</p><p className="mt-1 font-medium">{formatCurrency(data.totalPaid)}</p></div>
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-slate-500">Customer</p>
            <Link href={`/customers/${data.customer.id}`} className="mt-1 block font-medium text-blue-600 hover:text-blue-700">
              {data.customer.name}
            </Link>
          </div>
          <div><p className="text-sm text-slate-500">Brand & Model</p><p className="mt-1 font-medium">{data.vehicle.brand} {data.vehicle.model}</p></div>
          <div><p className="text-sm text-slate-500">Odometer</p><p className="mt-1 font-medium">{data.vehicle.odometer ?? 0} km</p></div>
          <div><p className="text-sm text-slate-500">Total Billed</p><p className="mt-1 font-medium">{formatCurrency(data.totalBilled)}</p></div>
        </div>

        {canManage && data.invoices.length === 0 && (
          <form action={deleteVehicleAction} className="mt-6">
            <input type="hidden" name="redirectTo" value="/vehicles" />
            <input type="hidden" name="successMessage" value="Vehicle deleted successfully." />
            <input type="hidden" name="vehicleId" value={data.vehicle.id} />
            <button className="btn-secondary border-rose-200 text-rose-600 hover:bg-rose-50">Delete Vehicle</button>
          </form>
        )}
      </Panel>

      {data.openInvoices.length > 0 && (
        <Panel className="p-6">
          <SectionHeading title="Open Invoices" />
          <div className="space-y-4">
            {data.openInvoices.map((invoice) => (
              <div key={invoice.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
                    <StatusBadge label={invoice.paymentStatus} tone={invoice.paymentStatus === "PARTIAL" ? "amber" : "red"} />
                    <StatusBadge label={invoice.workStatus.replaceAll("_", " ")} tone={invoice.workStatus === "READY_FOR_DELIVERY" ? "violet" : "slate"} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(invoice.createdAt)}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Balance due {formatCurrency(Math.max(invoice.grandTotal - invoice.amountPaid, 0))}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <Link href={`/invoices/${invoice.id}/edit`} className="font-medium text-blue-600 hover:text-blue-700">
                    Continue Invoice
                  </Link>
                  <Link href={`/invoices/${invoice.id}`} className="font-medium text-slate-600 hover:text-slate-900">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel className="p-6">
        <SectionHeading title="Invoice History" />
        <div className="space-y-4">
          {data.invoices.map((invoice) => (
            <div key={invoice.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/invoices/${invoice.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                    {invoice.invoiceNumber}
                  </Link>
                  <StatusBadge label={invoice.paymentStatus} tone={invoice.paymentStatus === "PAID" ? "green" : invoice.paymentStatus === "PARTIAL" ? "amber" : "red"} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{formatDate(invoice.createdAt)}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="font-semibold">{formatCurrency(invoice.grandTotal)}</p>
                <p className="text-sm text-slate-500">{invoice.workStatus.replaceAll("_", " ")}</p>
              </div>
            </div>
          ))}
          {data.invoices.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No invoices exist for this vehicle yet.
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
