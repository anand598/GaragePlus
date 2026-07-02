import type { NextRequest } from "next/server";
import { apiError, apiJson, assertCustomerWriteRole, handleApiError, requireApiSession } from "@/lib/api";
import { deleteCustomer, getCustomer, updateCustomer } from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(request);
    const { id } = await params;
    const customer = await getCustomer(id);
    if (!customer) {
      return apiError(404, "Customer not found.");
    }
    return apiJson({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiSession(request);
    assertCustomerWriteRole(session.role);
    const { id } = await params;
    const body = await request.json();
    await updateCustomer({
      customerId: id,
      name: String(body.name ?? "").trim(),
      phone: String(body.phone ?? "").trim(),
      email: String(body.email ?? "").trim() || undefined,
      address: String(body.address ?? "").trim() || undefined,
      notes: String(body.notes ?? "").trim() || undefined
    });
    return apiJson({ customer: await getCustomer(id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiSession(request);
    assertCustomerWriteRole(session.role);
    const { id } = await params;
    await deleteCustomer(id);
    return apiJson({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
