import type { NextRequest } from "next/server";
import { apiJson, assertRole, handleApiError, requireApiSession } from "@/lib/api";
import { getPendingDeliveries } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    assertRole(["OWNER", "MANAGER", "CASHIER"], session.role);
    return apiJson({ invoices: await getPendingDeliveries() });
  } catch (error) {
    return handleApiError(error);
  }
}
