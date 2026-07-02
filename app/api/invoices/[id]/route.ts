import type { NextRequest } from "next/server";
import { apiError, apiJson, handleApiError, requireApiSession } from "@/lib/api";
import { getInvoice } from "@/lib/data";

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
