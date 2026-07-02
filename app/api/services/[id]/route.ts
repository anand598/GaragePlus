import type { NextRequest } from "next/server";
import { apiError, apiJson, assertCatalogWriteRole, handleApiError, requireApiSession } from "@/lib/api";
import { deleteService, getServices, updateService } from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(request);
    const { id } = await params;
    const service = (await getServices()).find((entry) => entry.id === id);
    if (!service) {
      return apiError(404, "Service not found.");
    }
    return apiJson({ service });
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
    assertCatalogWriteRole(session.role);
    const { id } = await params;
    const body = await request.json();
    await updateService({
      serviceId: id,
      name: String(body.name ?? "").trim(),
      category: String(body.category ?? "").trim(),
      description: String(body.description ?? "").trim() || undefined,
      estimatedTime: String(body.estimatedTime ?? "").trim() || undefined,
      standardPrice: Number(body.standardPrice ?? 0),
      premiumPrice: Number(body.premiumPrice ?? 0),
      luxuryPrice: Number(body.luxuryPrice ?? 0),
      isActive: Boolean(body.isActive)
    });
    const service = (await getServices()).find((entry) => entry.id === id) ?? null;
    return apiJson({ service });
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
    assertCatalogWriteRole(session.role);
    const { id } = await params;
    await deleteService(id);
    return apiJson({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
