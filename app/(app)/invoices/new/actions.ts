"use server";

import { canManageBilling, requireSession } from "@/lib/auth";
import { createInvoice, updateInvoice } from "@/lib/data";

function parseInvoiceInput(formData: FormData) {
  return {
    customerId: String(formData.get("customerId")),
    vehicleId: String(formData.get("vehicleId")),
    pricingTier: String(formData.get("pricingTier")) as "STANDARD" | "PREMIUM" | "LUXURY",
    workStatus: String(formData.get("workStatus")) as "RECEIVED" | "IN_SERVICE" | "READY_FOR_DELIVERY" | "DELIVERED" | "CANCELLED",
    discount: Number(formData.get("discount") ?? 0),
    taxPercentage: Number(formData.get("taxPercentage") ?? 18),
    notes: String(formData.get("notes") ?? ""),
    items: JSON.parse(String(formData.get("items") ?? "[]"))
  };
}

export async function createInvoiceAction(formData: FormData) {
  const session = await requireSession();
  if (!canManageBilling(session.role)) {
    return { error: "You do not have permission to create invoices." };
  }

  try {
    const invoice = await createInvoice({
      ...parseInvoiceInput(formData),
      paymentStatus: String(formData.get("paymentStatus")) as "PAID" | "UNPAID" | "PARTIAL",
      paymentMode: (formData.get("paymentMode") ? String(formData.get("paymentMode")) : undefined) as
        | "CASH"
        | "UPI"
        | "CARD"
        | "BANK_TRANSFER"
        | undefined
    });

    return { id: invoice.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create invoice."
    };
  }
}

export async function updateInvoiceAction(formData: FormData) {
  const session = await requireSession();
  if (!canManageBilling(session.role)) {
    return { error: "You do not have permission to update invoices." };
  }

  try {
    const invoice = await updateInvoice({
      invoiceId: String(formData.get("invoiceId") ?? ""),
      ...parseInvoiceInput(formData)
    });

    return { id: invoice.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update invoice."
    };
  }
}
