import type { NextRequest } from "next/server";
import { apiJson, handleApiError, requireApiSession } from "@/lib/api";
import { getDashboardData } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    await requireApiSession(request);
    return apiJson(await getDashboardData());
  } catch (error) {
    return handleApiError(error);
  }
}
