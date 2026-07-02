"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { registerOwner } from "@/lib/data";

export async function registerOwnerAction(formData: FormData) {
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const workshopName = String(formData.get("workshopName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    const user = await registerOwner({
      ownerName,
      workshopName,
      email,
      phone,
      address,
      passwordHash: await bcrypt.hash(password, 10)
    });

    await createSession({
      id: user.id,
      workshopId: user.workshopId,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Registration failed."
    };
  }

  redirect("/dashboard");
}
