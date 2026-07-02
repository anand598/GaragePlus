import type { NextRequest } from "next/server";
import { apiJson, assertRole, handleApiError, requireApiSession } from "@/lib/api";
import { getInvoices } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    assertRole(["OWNER", "MANAGER", "CASHIER"], session.role);
    const services = Array.from(
      (await getInvoices())
        .flatMap((invoice) => invoice.items)
        .filter((item) => item.itemType === "SERVICE")
        .reduce((map, item) => {
          const current = map.get(item.name) ?? {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
          current.quantity += item.quantity;
          current.revenue += item.totalPrice;
          map.set(item.name, current);
          return map;
        }, new Map<string, { name: string; quantity: number; revenue: number }>())
    )
      .map(([, value]) => value)
      .sort((a, b) => b.quantity - a.quantity);

    return apiJson({ services });
  } catch (error) {
    return handleApiError(error);
  }
}
