import type { NextRequest } from "next/server";
import { apiJson, assertCustomerWriteRole, handleApiError, requireApiSession } from "@/lib/api";
import { createVehicle, getVehicles } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    await requireApiSession(request);
    return apiJson({ vehicles: await getVehicles() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    assertCustomerWriteRole(session.role);
    const body = await request.json();
    const vehicle = await createVehicle({
      customerId: String(body.customerId ?? ""),
      vehicleNumber: String(body.vehicleNumber ?? "").trim().toUpperCase(),
      brand: String(body.brand ?? "").trim(),
      model: String(body.model ?? "").trim(),
      year: Number(body.year ?? 0) || undefined,
      fuelType: String(body.fuelType ?? "").trim() || undefined,
      odometer: Number(body.odometer ?? 0) || undefined
    });
    return apiJson({ vehicle }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
