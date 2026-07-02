import type { NextRequest } from "next/server";
import { apiJson, handleApiError, requireApiSession } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    return apiJson({ user: session });
  } catch (error) {
    return handleApiError(error);
  }
}
