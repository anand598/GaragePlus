import type { NextRequest } from "next/server";
import { apiJson, assertRole, handleApiError, requireApiSession } from "@/lib/api";
import { getInvoices } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    assertRole(["OWNER", "MANAGER", "CASHIER"], session.role);
    const customers = Array.from(
      (await getInvoices()).reduce((map, invoice) => {
        const current = map.get(invoice.customer.id) ?? {
          customerId: invoice.customer.id,
          name: invoice.customer.name,
          visits: 0,
          totalSpent: 0
        };
        current.visits += 1;
        current.totalSpent += invoice.amountPaid;
        map.set(invoice.customer.id, current);
        return map;
      }, new Map<string, { customerId: string; name: string; visits: number; totalSpent: number }>())
    )
      .map(([, value]) => value)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return apiJson({ customers });
  } catch (error) {
    return handleApiError(error);
  }
}
