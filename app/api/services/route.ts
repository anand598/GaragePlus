import type { NextRequest } from "next/server";
import { apiJson, assertCatalogWriteRole, handleApiError, requireApiSession } from "@/lib/api";
import { createService, getServices } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    await requireApiSession(request);
    return apiJson({ services: await getServices() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    assertCatalogWriteRole(session.role);
    const body = await request.json();
    const service = await createService({
      name: String(body.name ?? "").trim(),
      category: String(body.category ?? "").trim(),
      description: String(body.description ?? "").trim() || undefined,
      estimatedTime: String(body.estimatedTime ?? "").trim() || undefined,
      standardPrice: Number(body.standardPrice ?? 0),
      premiumPrice: Number(body.premiumPrice ?? 0),
      luxuryPrice: Number(body.luxuryPrice ?? 0),
      isActive: body.isActive === undefined ? true : Boolean(body.isActive)
    });
    return apiJson({ service }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
