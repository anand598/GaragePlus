"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { resetPasswordWithToken } from "@/lib/data";

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "This password reset link is invalid or has expired." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  try {
    await resetPasswordWithToken({
      token,
      passwordHash: await bcrypt.hash(password, 10)
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to reset password."
    };
  }

  redirect("/login?reset=success");
}
