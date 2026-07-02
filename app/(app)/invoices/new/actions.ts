"use server";

import { canManageBilling, requireSession } from "@/lib/auth";
import { createInvoice } from "@/lib/data";

export async function createInvoiceAction(formData: FormData) {
  const session = await requireSession();
  if (!canManageBilling(session.role)) {
    return { error: "You do not have permission to create invoices." };
  }

  try {
    const items = JSON.parse(String(formData.get("items") ?? "[]"));

    const invoice = await createInvoice({
      customerId: String(formData.get("customerId")),
      vehicleId: String(formData.get("vehicleId")),
      pricingTier: String(formData.get("pricingTier")) as "STANDARD" | "PREMIUM" | "LUXURY",
      paymentStatus: String(formData.get("paymentStatus")) as "PAID" | "UNPAID" | "PARTIAL",
      paymentMode: (formData.get("paymentMode") ? String(formData.get("paymentMode")) : undefined) as
        | "CASH"
        | "UPI"
        | "CARD"
        | "BANK_TRANSFER"
        | undefined,
      workStatus: String(formData.get("workStatus")) as "RECEIVED" | "IN_SERVICE" | "READY_FOR_DELIVERY" | "DELIVERED" | "CANCELLED",
      discount: Number(formData.get("discount") ?? 0),
      taxPercentage: Number(formData.get("taxPercentage") ?? 18),
      notes: String(formData.get("notes") ?? ""),
      items
    });

    return { id: invoice.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create invoice."
    };
  }
}
