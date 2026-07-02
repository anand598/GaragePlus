"use server";

import { createPasswordResetLink } from "@/lib/data";

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return { error: "Enter the email address linked to the account." };
  }

  const reset = await createPasswordResetLink(email);

  return {
    message: "If an account exists for this email, a password reset link is ready.",
    resetPath: reset?.resetPath ?? null,
    expiresAt: reset?.expiresAt ?? null
  };
}
