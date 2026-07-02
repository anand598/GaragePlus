import type { NextRequest } from "next/server";
import { apiJson, handleApiError, requireApiSession } from "@/lib/api";
import { sendReminder } from "@/lib/data";

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    const body = await request.json();
    const reminder = await sendReminder({
      invoiceId: String(body.invoiceId ?? ""),
      channel: String(body.channel ?? "WHATSAPP") as "WHATSAPP" | "SMS",
      sentByName: session.name
    });
    return apiJson({ reminder });
  } catch (error) {
    return handleApiError(error);
  }
}
