import Link from "next/link";
import { deleteCustomerAction, deleteVehicleAction, updateCustomerAction, updateVehicleAction } from "@/app/(app)/actions";
import { notFound } from "next/navigation";
import { ActionFeedbackBanner, Panel, SectionHeading, StatusBadge } from "@/components/ui";
import { canCreateCustomers, requireSession } from "@/lib/auth";
import { getCustomer } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function CustomerDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const { status, message } = await searchParams;
  const data = await getCustomer(id);
  if (!data) notFound();
  const canManage = canCreateCustomers(session.role);
  const redirectTo = `/customers/${data.customer.id}`;
  const openInvoices = data.invoices.filter((invoice) => invoice.paymentStatus !== "PAID");

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />
      <Panel className="p-6">
        <SectionHeading
          title={data.customer.name}
          action={
            <Link
              href={`/invoices/new?customerId=${data.customer.id}&q=${encodeURIComponent(data.customer.phone)}`}
              className="btn-primary"
            >
              New Invoice
            </Link>
          }
        />
        {canManage ? (
          <form action={updateCustomerAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <input type="hidden" name="successMessage" value="Customer updated successfully." />
            <input type="hidden" name="customerId" value={data.customer.id} />
            <input name="name" defaultValue={data.customer.name} className="field" placeholder="Customer Name" />
            <input name="phone" defaultValue={data.customer.phone} className="field" placeholder="Phone" />
            <input name="email" defaultValue={data.customer.email} className="field" placeholder="Email" />
            <input name="address" defaultValue={data.customer.address} className="field" placeholder="Address" />
            <textarea name="notes" defaultValue={data.customer.notes} className="field md:col-span-2 min-h-28" placeholder="Notes" />
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button className="btn-primary">Save Customer</button>
            </div>
          </form>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <div><p className="text-sm text-slate-500">Phone</p><p className="mt-1 font-medium">{data.customer.phone}</p></div>
            <div><p className="text-sm text-slate-500">Email</p><p className="mt-1 font-medium">{data.customer.email ?? "-"}</p></div>
            <div><p className="text-sm text-slate-500">Total Visits</p><p className="mt-1 font-medium">{data.invoices.length}</p></div>
            <div><p className="text-sm text-slate-500">Total Spent</p><p className="mt-1 font-medium">{formatCurrency(data.totalSpent)}</p></div>
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div><p className="text-sm text-slate-500">Phone</p><p className="mt-1 font-medium">{data.customer.phone}</p></div>
          <div><p className="text-sm text-slate-500">Email</p><p className="mt-1 font-medium">{data.customer.email ?? "-"}</p></div>
          <div><p className="text-sm text-slate-500">Total Visits</p><p className="mt-1 font-medium">{data.invoices.length}</p></div>
          <div><p className="text-sm text-slate-500">Total Spent</p><p className="mt-1 font-medium">{formatCurrency(data.totalSpent)}</p></div>
        </div>

        {canManage && data.invoices.length === 0 && (
          <form action={deleteCustomerAction} className="mt-6">
            <input type="hidden" name="redirectTo" value="/customers" />
            <input type="hidden" name="successMessage" value="Customer deleted successfully." />
            <input type="hidden" name="customerId" value={data.customer.id} />
            <button className="btn-secondary border-rose-200 text-rose-600 hover:bg-rose-50">Delete Customer</button>
          </form>
        )}
      </Panel>

      {openInvoices.length > 0 && (
        <Panel className="p-6">
          <SectionHeading title="Open Invoices" />
          <div className="space-y-4">
            {openInvoices.map((invoice) => (
              <div key={invoice.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
                    <StatusBadge label={invoice.paymentStatus} tone={invoice.paymentStatus === "PARTIAL" ? "amber" : "red"} />
                    <StatusBadge label={invoice.workStatus.replaceAll("_", " ")} tone={invoice.workStatus === "READY_FOR_DELIVERY" ? "violet" : "slate"} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {invoice.vehicleId ? data.vehicles.find((vehicle) => vehicle.id === invoice.vehicleId)?.vehicleNumber : "-"} • {formatDate(invoice.createdAt)}
                  </p>
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
        <SectionHeading title="Vehicles" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.vehicles.map((vehicle) => (
            <div key={vehicle.id} className="rounded-3xl border border-slate-100 p-5">
              {(() => {
                const openInvoice = openInvoices.find((invoice) => invoice.vehicleId === vehicle.id);
                return openInvoice ? (
                  <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">Open invoice {openInvoice.invoiceNumber}</span>
                      <Link href={`/invoices/${openInvoice.id}/edit`} className="text-blue-600 hover:text-blue-700">
                        Continue
                      </Link>
                    </div>
                  </div>
                ) : null;
              })()}
              {canManage ? (
                <form action={updateVehicleAction} className="space-y-3">
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <input type="hidden" name="successMessage" value="Vehicle updated successfully." />
                  <input type="hidden" name="vehicleId" value={vehicle.id} />
                  <input type="hidden" name="customerId" value={data.customer.id} />
                  <input name="vehicleNumber" defaultValue={vehicle.vehicleNumber} className="field" />
                  <div className="grid grid-cols-2 gap-3">
                    <input name="brand" defaultValue={vehicle.brand} className="field" />
                    <input name="model" defaultValue={vehicle.model} className="field" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input name="year" type="number" defaultValue={vehicle.year} className="field" placeholder="Year" />
                    <input name="fuelType" defaultValue={vehicle.fuelType} className="field" placeholder="Fuel" />
                    <input name="odometer" type="number" defaultValue={vehicle.odometer} className="field" placeholder="Km" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="btn-primary">Save Vehicle</button>
                    <Link
                      href={`/invoices/new?customerId=${data.customer.id}&vehicleId=${vehicle.id}&q=${encodeURIComponent(vehicle.vehicleNumber)}`}
                      className="btn-secondary"
                    >
                      New Invoice
                    </Link>
                  </div>
                </form>
              ) : (
                <>
                  <p className="font-semibold text-slate-900">{vehicle.vehicleNumber}</p>
                  <p className="mt-1 text-sm text-slate-500">{vehicle.brand} {vehicle.model}</p>
                  <p className="mt-3 text-sm text-slate-600">Fuel: {vehicle.fuelType ?? "-"}</p>
                  <p className="text-sm text-slate-600">Odometer: {vehicle.odometer ?? 0} km</p>
                  <div className="mt-4">
                    <Link
                      href={`/invoices/new?customerId=${data.customer.id}&vehicleId=${vehicle.id}&q=${encodeURIComponent(vehicle.vehicleNumber)}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Create Invoice
                    </Link>
                  </div>
                </>
              )}

              {canManage && !data.invoices.some((invoice) => invoice.vehicleId === vehicle.id) && (
                <form action={deleteVehicleAction} className="mt-3">
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <input type="hidden" name="successMessage" value="Vehicle deleted successfully." />
                  <input type="hidden" name="vehicleId" value={vehicle.id} />
                  <button className="text-sm text-rose-600">Delete Vehicle</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionHeading title="Invoice History" />
        <div className="space-y-4">
          {data.invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
              <div>
                <p className="font-medium">{invoice.invoiceNumber}</p>
                <p className="text-sm text-slate-500">{formatDate(invoice.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(invoice.grandTotal)}</p>
                <p className="text-sm text-slate-500">{invoice.workStatus.replaceAll("_", " ")}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
