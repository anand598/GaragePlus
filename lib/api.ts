import { NextResponse, type NextRequest } from "next/server";
import {
  canCreateCustomers,
  canManageBilling,
  canManageCatalog,
  canManageSettings,
  canManageStatus
} from "@/lib/auth";
import { getSessionFromRequest, signSessionToken, SESSION_COOKIE, type SessionUser } from "@/lib/session";
import type { Role } from "@/lib/types";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function apiJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(status: number, message: string) {
  return apiJson({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return apiError(error.status, error.message);
  }

  if (error instanceof Error) {
    return apiError(400, error.message);
  }

  return apiError(500, "Something went wrong.");
}

export async function requireApiSession(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    throw new ApiError(401, "Authentication required.");
  }

  return session;
}

export function assertRole(allowedRoles: Role[], role: Role, message = "You do not have permission to perform this action.") {
  if (!allowedRoles.includes(role)) {
    throw new ApiError(403, message);
  }
}

export function assertCustomerWriteRole(role: Role) {
  if (!canCreateCustomers(role)) {
    throw new ApiError(403, "You do not have permission to manage customers or vehicles.");
  }
}

export function assertCatalogWriteRole(role: Role) {
  if (!canManageCatalog(role)) {
    throw new ApiError(403, "You do not have permission to manage catalog items.");
  }
}

export function assertBillingWriteRole(role: Role) {
  if (!canManageBilling(role)) {
    throw new ApiError(403, "You do not have permission to manage billing.");
  }
}

export function assertStatusWriteRole(role: Role) {
  if (!canManageStatus(role)) {
    throw new ApiError(403, "You do not have permission to manage work status.");
  }
}

export function assertSettingsWriteRole(role: Role) {
  if (!canManageSettings(role)) {
    throw new ApiError(403, "You do not have permission to manage workshop settings.");
  }
}

export async function createAuthResponse(user: SessionUser, body: unknown, init?: ResponseInit) {
  const token = await signSessionToken(user);
  const response = NextResponse.json(body, init);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  return response;
}
