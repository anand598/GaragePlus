import type { NextRequest } from "next/server";
import { apiJson, handleApiError, requireApiSession } from "@/lib/api";
import { getVehicles } from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(request);
    const { id } = await params;
    const vehicles = (await getVehicles()).filter((vehicle) => vehicle.customerId === id);
    return apiJson({ vehicles });
  } catch (error) {
    return handleApiError(error);
  }
}
