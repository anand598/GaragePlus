import type { NextRequest } from "next/server";
import { apiJson, assertRole, handleApiError, requireApiSession } from "@/lib/api";
import { getInvoices } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    assertRole(["OWNER", "MANAGER", "CASHIER"], session.role);
    const invoices = await getInvoices();
    const today = new Date();
    const dailyRevenue = invoices
      .filter((invoice) => {
        if (invoice.paymentStatus !== "PAID") return false;
        return new Date(invoice.createdAt).toDateString() === today.toDateString();
      })
      .reduce((sum, invoice) => sum + invoice.amountPaid, 0);
    const monthlyRevenue = invoices
      .filter((invoice) => {
        const createdAt = new Date(invoice.createdAt);
        return createdAt.getFullYear() === today.getFullYear() && createdAt.getMonth() === today.getMonth();
      })
      .reduce((sum, invoice) => sum + invoice.amountPaid, 0);
    const byMonth = new Map<string, number>();

    for (const invoice of invoices) {
      const key = new Date(invoice.createdAt).toLocaleString("en-IN", { month: "short", year: "numeric" });
      byMonth.set(key, (byMonth.get(key) ?? 0) + invoice.amountPaid);
    }

    return apiJson({
      dailyRevenue,
      monthlyRevenue,
      monthlyBuckets: Array.from(byMonth.entries()).map(([label, amount]) => ({ label, amount }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}
