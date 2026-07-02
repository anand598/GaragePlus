import type { NextRequest } from "next/server";
import { apiJson, handleApiError, requireApiSession } from "@/lib/api";
import { getReminderHistory } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    await requireApiSession(request);
    return apiJson({ reminders: await getReminderHistory() });
  } catch (error) {
    return handleApiError(error);
  }
}
