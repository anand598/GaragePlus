"use server";

import { redirect } from "next/navigation";
import { createSession, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/data";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const user = await getUserByEmail(email);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password" };
  }

  await createSession({
    id: user.id,
    workshopId: user.workshopId,
    name: user.name,
    email: user.email,
    role: user.role
  });

  redirect("/dashboard");
}
