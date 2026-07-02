import type { NextRequest } from "next/server";
import { apiJson, handleApiError, requireApiSession } from "@/lib/api";
import { getInvoices } from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(request);
    const { id } = await params;
    const invoices = (await getInvoices()).filter((invoice) => invoice.vehicleId === id);
    return apiJson({ invoices });
  } catch (error) {
    return handleApiError(error);
  }
}
