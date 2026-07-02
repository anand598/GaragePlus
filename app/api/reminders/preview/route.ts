import type { NextRequest } from "next/server";
import { apiError, apiJson, handleApiError, requireApiSession } from "@/lib/api";
import { buildReminder, getInvoice, getWorkshop } from "@/lib/data";

export async function POST(request: NextRequest) {
  try {
    await requireApiSession(request);
    const body = await request.json();
    const invoice = await getInvoice(String(body.invoiceId ?? ""));
    if (!invoice) {
      return apiError(404, "Invoice not found.");
    }

    const workshop = await getWorkshop();
    const reminder = buildReminder(invoice, {
      workshopName: workshop.name,
      customerName: invoice.customer.name,
      vehicleNumber: invoice.vehicle.vehicleNumber
    });

    return apiJson({ reminder });
  } catch (error) {
    return handleApiError(error);
  }
}
