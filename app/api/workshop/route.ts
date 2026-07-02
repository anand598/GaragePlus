import type { NextRequest } from "next/server";
import {
  apiJson,
  handleApiError,
  requireApiSession,
  assertSettingsWriteRole
} from "@/lib/api";
import { getWorkshop, updateWorkshop } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    await requireApiSession(request);
    return apiJson({ workshop: await getWorkshop() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    assertSettingsWriteRole(session.role);
    const body = await request.json();

    await updateWorkshop({
      name: String(body.name ?? "").trim(),
      phone: String(body.phone ?? "").trim(),
      email: String(body.email ?? "").trim(),
      address: String(body.address ?? "").trim(),
      gstNumber: String(body.gstNumber ?? "").trim() || undefined,
      logoUrl: String(body.logoUrl ?? "").trim() || undefined,
      invoicePrefix: String(body.invoicePrefix ?? "").trim(),
      taxPercentage: Number(body.taxPercentage ?? 18),
      businessHours: String(body.businessHours ?? "").trim() || undefined,
      paymentQrCode: String(body.paymentQrCode ?? "").trim() || undefined
    });

    return apiJson({ workshop: await getWorkshop() });
  } catch (error) {
    return handleApiError(error);
  }
}
