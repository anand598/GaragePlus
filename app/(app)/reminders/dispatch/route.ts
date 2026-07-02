import { NextRequest, NextResponse } from "next/server";
import { canManageBilling, canManageStatus, getSession } from "@/lib/auth";
import { sendReminder } from "@/lib/data";

function redirectToReminders(request: NextRequest, params: Record<string, string>) {
  const target = new URL("/reminders", request.url);
  Object.entries(params).forEach(([key, value]) => {
    target.searchParams.set(key, value);
  });
  return NextResponse.redirect(target);
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!canManageStatus(session.role) && !canManageBilling(session.role)) {
    return redirectToReminders(request, {
      error: "You do not have permission to send reminders."
    });
  }

  const invoiceId = request.nextUrl.searchParams.get("invoiceId") ?? "";
  const channel = request.nextUrl.searchParams.get("channel") === "SMS" ? "SMS" : "WHATSAPP";

  if (!invoiceId) {
    return redirectToReminders(request, {
      error: "Invoice not found."
    });
  }

  try {
    const activity = await sendReminder({
      invoiceId,
      channel,
      sentByName: session.name
    });

    return NextResponse.redirect(activity.dispatchUrl);
  } catch (error) {
    return redirectToReminders(request, {
      error: error instanceof Error ? error.message : "Unable to launch reminder."
    });
  }
}
