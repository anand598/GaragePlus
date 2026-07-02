import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";
import { getSessionFromCookies, SESSION_COOKIE, signSessionToken, type SessionUser } from "@/lib/session";

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = await signSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
}

export async function getSession() {
  return getSessionFromCookies();
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export function canManageCatalog(role: Role) {
  return role === "OWNER" || role === "MANAGER";
}

export function canManageBilling(role: Role) {
  return role === "OWNER" || role === "MANAGER" || role === "CASHIER";
}

export function canManageStatus(role: Role) {
  return role === "OWNER" || role === "MANAGER" || role === "STAFF";
}

export function canManageSettings(role: Role) {
  return role === "OWNER";
}

export function canCreateCustomers(role: Role) {
  return role === "OWNER" || role === "MANAGER" || role === "CASHIER";
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
