import type { NextRequest } from "next/server";
import { apiJson, assertBillingWriteRole, handleApiError, requireApiSession } from "@/lib/api";
import { createInvoice, getInvoices } from "@/lib/data";
import type { PaymentMode, PaymentStatus, PricingTier, WorkStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    await requireApiSession(request);
    return apiJson({ invoices: await getInvoices() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    assertBillingWriteRole(session.role);
    const body = await request.json();
    const invoice = await createInvoice({
      customerId: String(body.customerId ?? ""),
      vehicleId: String(body.vehicleId ?? ""),
      pricingTier: String(body.pricingTier ?? "STANDARD") as PricingTier,
      paymentStatus: String(body.paymentStatus ?? "UNPAID") as PaymentStatus,
      paymentMode: (body.paymentMode ? String(body.paymentMode) : undefined) as PaymentMode | undefined,
      workStatus: String(body.workStatus ?? "RECEIVED") as WorkStatus,
      discount: Number(body.discount ?? 0),
      taxPercentage: Number(body.taxPercentage ?? 18),
      notes: String(body.notes ?? "").trim() || undefined,
      items: Array.isArray(body.items) ? body.items : []
    });
    return apiJson({ invoice }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
