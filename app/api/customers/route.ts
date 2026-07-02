import type { NextRequest } from "next/server";
import { apiJson, assertCustomerWriteRole, handleApiError, requireApiSession } from "@/lib/api";
import { createCustomer, getCustomers } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    await requireApiSession(request);
    return apiJson({ customers: await getCustomers() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    assertCustomerWriteRole(session.role);
    const body = await request.json();
    const customer = await createCustomer({
      name: String(body.name ?? "").trim(),
      phone: String(body.phone ?? "").trim(),
      email: String(body.email ?? "").trim() || undefined,
      address: String(body.address ?? "").trim() || undefined,
      notes: String(body.notes ?? "").trim() || undefined
    });
    return apiJson({ customer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
