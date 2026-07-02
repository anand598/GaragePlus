import Image from "next/image";
import { updateWorkshopAction } from "@/app/(app)/actions";
import { ActionFeedbackBanner, Panel, SectionHeading } from "@/components/ui";
import { canManageSettings, requireSession } from "@/lib/auth";
import { getWorkshop } from "@/lib/data";

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const session = await requireSession();
  const { status, message } = await searchParams;
  const workshop = await getWorkshop();
  const canManage = canManageSettings(session.role);

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />
      <Panel className="p-6">
        <SectionHeading title="Workshop Setup" />
        {canManage ? (
          <form action={updateWorkshopAction} className="grid gap-4 md:grid-cols-2" encType="multipart/form-data">
            <input type="hidden" name="redirectTo" value="/settings" />
            <input type="hidden" name="successMessage" value="Workshop settings updated successfully." />
          <div className="md:col-span-2 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 p-4">
              <p className="text-sm font-medium text-slate-700">Workshop Logo</p>
              {workshop.logoUrl ? (
                <div className="mt-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <Image src={workshop.logoUrl} alt="Workshop logo" width={112} height={112} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="mt-3 flex h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
                  No logo
                </div>
              )}
              <input name="logoUrl" defaultValue={workshop.logoUrl} className="field mt-3" placeholder="Logo URL" />
              <input name="logoFile" type="file" accept="image/*" className="field mt-3" />
            </div>

            <div className="rounded-3xl border border-slate-100 p-4">
              <p className="text-sm font-medium text-slate-700">Payment QR Code</p>
              {workshop.paymentQrCode ? (
                <div className="mt-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <Image src={workshop.paymentQrCode} alt="Payment QR code" width={112} height={112} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="mt-3 flex h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
                  No QR
                </div>
              )}
              <input name="paymentQrCode" defaultValue={workshop.paymentQrCode} className="field mt-3" placeholder="Payment QR Code URL" />
              <input name="paymentQrFile" type="file" accept="image/*" className="field mt-3" />
            </div>
          </div>

          <input name="name" defaultValue={workshop.name} className="field" placeholder="Workshop Name" />
          <input name="phone" defaultValue={workshop.phone} className="field" placeholder="Phone" />
          <input name="email" defaultValue={workshop.email} className="field" placeholder="Email" />
          <input name="address" defaultValue={workshop.address} className="field" placeholder="Address" />
          <input name="gstNumber" defaultValue={workshop.gstNumber} className="field" placeholder="GST Number" />
          <input name="invoicePrefix" defaultValue={workshop.invoicePrefix} className="field" placeholder="Invoice Prefix" />
          <input name="taxPercentage" type="number" step="0.01" defaultValue={workshop.taxPercentage} className="field" placeholder="Tax Percentage" />
          <input name="businessHours" defaultValue={workshop.businessHours} className="field" placeholder="Business Hours" />
          <button className="btn-primary md:col-span-2">Save Workshop Settings</button>
          </form>
        ) : (
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
            Only the workshop owner can change setup and billing configuration.
          </div>
        )}
      </Panel>
    </div>
  );
}
