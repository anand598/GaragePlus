import type { NextRequest } from "next/server";
import { apiJson, assertStatusWriteRole, handleApiError, requireApiSession } from "@/lib/api";
import { getInvoice, updateInvoiceWorkStatus } from "@/lib/data";
import type { WorkStatus } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiSession(request);
    assertStatusWriteRole(session.role);
    const { id } = await params;
    const body = await request.json();
    await updateInvoiceWorkStatus({
      invoiceId: id,
      workStatus: String(body.workStatus ?? "RECEIVED") as WorkStatus
    });
    return apiJson({ invoice: await getInvoice(id) });
  } catch (error) {
    return handleApiError(error);
  }
}
