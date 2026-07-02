import type { NextRequest } from "next/server";
import { apiError, apiJson, assertCatalogWriteRole, handleApiError, requireApiSession } from "@/lib/api";
import { deletePart, getParts, updatePart } from "@/lib/data";

function parseNullableNumber(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  return Number(value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(request);
    const { id } = await params;
    const sparePart = (await getParts()).find((entry) => entry.id === id);
    if (!sparePart) {
      return apiError(404, "Spare part not found.");
    }
    return apiJson({ sparePart });
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
    await updatePart({
      partId: id,
      name: String(body.name ?? "").trim(),
      category: String(body.category ?? "").trim(),
      brand: String(body.brand ?? "").trim() || undefined,
      partNumber: String(body.partNumber ?? "").trim() || undefined,
      unit: String(body.unit ?? "").trim(),
      standardPrice: Number(body.standardPrice ?? 0),
      premiumPrice: Number(body.premiumPrice ?? 0),
      luxuryPrice: Number(body.luxuryPrice ?? 0),
      stockQuantity: parseNullableNumber(body.stockQuantity),
      isActive: Boolean(body.isActive)
    });
    const sparePart = (await getParts()).find((entry) => entry.id === id) ?? null;
    return apiJson({ sparePart });
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
    await deletePart(id);
    return apiJson({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
