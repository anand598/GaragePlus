import type { NextRequest } from "next/server";
import { apiError, apiJson, assertCustomerWriteRole, handleApiError, requireApiSession } from "@/lib/api";
import { deleteVehicle, getVehicle, updateVehicle } from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(request);
    const { id } = await params;
    const vehicle = await getVehicle(id);
    if (!vehicle) {
      return apiError(404, "Vehicle not found.");
    }
    return apiJson({ vehicle });
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
    await updateVehicle({
      vehicleId: id,
      customerId: String(body.customerId ?? ""),
      vehicleNumber: String(body.vehicleNumber ?? "").trim().toUpperCase(),
      brand: String(body.brand ?? "").trim(),
      model: String(body.model ?? "").trim(),
      year: Number(body.year ?? 0) || undefined,
      fuelType: String(body.fuelType ?? "").trim() || undefined,
      odometer: Number(body.odometer ?? 0) || undefined
    });
    const vehicle = await getVehicle(id);
    return apiJson({ vehicle });
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
    await deleteVehicle(id);
    return apiJson({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
