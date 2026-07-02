import type { NextRequest } from "next/server";
import { apiError, apiJson, assertBillingWriteRole, handleApiError, requireApiSession } from "@/lib/api";
import { getInvoice, updateInvoice } from "@/lib/data";
import type { PricingTier, WorkStatus } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(request);
    const { id } = await params;
    const invoice = await getInvoice(id);
    if (!invoice) {
      return apiError(404, "Invoice not found.");
    }
    return apiJson({ invoice });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiSession(request);
    assertBillingWriteRole(session.role);
    const { id } = await params;
    const body = await request.json();

    const invoice = await updateInvoice({
      invoiceId: id,
      customerId: String(body.customerId ?? ""),
      vehicleId: String(body.vehicleId ?? ""),
      pricingTier: String(body.pricingTier ?? "STANDARD") as PricingTier,
      workStatus: String(body.workStatus ?? "RECEIVED") as WorkStatus,
      discount: Number(body.discount ?? 0),
      taxPercentage: Number(body.taxPercentage ?? 18),
      notes: String(body.notes ?? "").trim() || undefined,
      items: Array.isArray(body.items) ? body.items : []
    });

    return apiJson({ invoice });
  } catch (error) {
    return handleApiError(error);
  }
}
