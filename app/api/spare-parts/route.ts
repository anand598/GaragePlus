import type { NextRequest } from "next/server";
import { apiJson, assertCatalogWriteRole, handleApiError, requireApiSession } from "@/lib/api";
import { createPart, getParts } from "@/lib/data";

function parseNullableNumber(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  return Number(value);
}

export async function GET(request: NextRequest) {
  try {
    await requireApiSession(request);
    return apiJson({ spareParts: await getParts() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    assertCatalogWriteRole(session.role);
    const body = await request.json();
    const sparePart = await createPart({
      name: String(body.name ?? "").trim(),
      category: String(body.category ?? "").trim(),
      brand: String(body.brand ?? "").trim() || undefined,
      partNumber: String(body.partNumber ?? "").trim() || undefined,
      unit: String(body.unit ?? "").trim(),
      standardPrice: Number(body.standardPrice ?? 0),
      premiumPrice: Number(body.premiumPrice ?? 0),
      luxuryPrice: Number(body.luxuryPrice ?? 0),
      stockQuantity: parseNullableNumber(body.stockQuantity),
      isActive: body.isActive === undefined ? true : Boolean(body.isActive)
    });
    return apiJson({ sparePart }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
