import type { NextRequest } from "next/server";
import { apiJson, assertRole, handleApiError, requireApiSession } from "@/lib/api";
import { getInvoices } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    assertRole(["OWNER", "MANAGER", "CASHIER"], session.role);
    const invoices = (await getInvoices()).filter((invoice) => invoice.paymentStatus !== "PAID");
    return apiJson({
      totalPending: invoices.reduce((sum, invoice) => sum + (invoice.grandTotal - invoice.amountPaid), 0),
      invoices
    });
  } catch (error) {
    return handleApiError(error);
  }
}
