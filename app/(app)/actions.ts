"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canCreateCustomers,
  canManageBilling,
  canManageCatalog,
  canManageSettings,
  canManageStatus,
  requireSession
} from "@/lib/auth";
import {
  createCustomer,
  createPart,
  createService,
  createStaffUser,
  createVehicle,
  deleteStaffUser,
  deleteCustomer,
  deletePart,
  deleteService,
  deleteVehicle,
  sendReminder,
  updateCustomer,
  updateInvoicePayment,
  updateInvoiceWorkStatus,
  updatePart,
  updateService,
  updateStaffUser,
  updateVehicle,
  updateWorkshop
} from "@/lib/data";
import { saveUploadedFile } from "@/lib/uploads";

function getRedirectTo(formData: FormData, fallbackPath: string) {
  return String(formData.get("redirectTo") ?? "").trim() || fallbackPath;
}

function getSuccessMessage(formData: FormData, fallbackMessage: string) {
  return (
    String(formData.get("submitSuccessMessage") ?? "").trim() ||
    String(formData.get("successMessage") ?? "").trim() ||
    fallbackMessage
  );
}

function getNullableNumber(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  return value === "" ? null : Number(value);
}

function redirectWithFeedback(path: string, status: "success" | "error", message: string) {
  const params = new URLSearchParams();
  params.set("status", status);
  params.set("message", message);
  redirect(`${path}?${params.toString()}`);
}

async function runActionWithFeedback(
  formData: FormData,
  fallbackPath: string,
  fallbackSuccessMessage: string,
  task: () => Promise<void>
) {
  const redirectTo = getRedirectTo(formData, fallbackPath);

  try {
    await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
    redirectWithFeedback(redirectTo, "error", message);
  }

  redirectWithFeedback(redirectTo, "success", getSuccessMessage(formData, fallbackSuccessMessage));
}

export async function createCustomerAction(formData: FormData) {
  await runActionWithFeedback(formData, "/customers", "Customer saved successfully.", async () => {
    const session = await requireSession();
    if (!canCreateCustomers(session.role)) {
      throw new Error("You do not have permission to create customers.");
    }
    await createCustomer({
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim() || undefined,
      address: String(formData.get("address") ?? "").trim() || undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined
    });
  });
}

export async function createVehicleAction(formData: FormData) {
  await runActionWithFeedback(formData, "/vehicles", "Vehicle saved successfully.", async () => {
    const session = await requireSession();
    if (!canCreateCustomers(session.role)) {
      throw new Error("You do not have permission to create vehicles.");
    }
    await createVehicle({
      customerId: String(formData.get("customerId") ?? ""),
      vehicleNumber: String(formData.get("vehicleNumber") ?? "").trim().toUpperCase(),
      brand: String(formData.get("brand") ?? "").trim(),
      model: String(formData.get("model") ?? "").trim(),
      year: Number(formData.get("year") ?? 0) || undefined,
      fuelType: String(formData.get("fuelType") ?? "").trim() || undefined,
      odometer: Number(formData.get("odometer") ?? 0) || undefined
    });
  });
}

export async function createServiceAction(formData: FormData) {
  await runActionWithFeedback(formData, "/services", "Service saved successfully.", async () => {
    const session = await requireSession();
    if (!canManageCatalog(session.role)) {
      throw new Error("You do not have permission to manage services.");
    }
    await createService({
      name: String(formData.get("name") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || undefined,
      estimatedTime: String(formData.get("estimatedTime") ?? "").trim() || undefined,
      standardPrice: Number(formData.get("standardPrice") ?? 0),
      premiumPrice: Number(formData.get("premiumPrice") ?? 0),
      luxuryPrice: Number(formData.get("luxuryPrice") ?? 0)
    });
  });
}

export async function createPartAction(formData: FormData) {
  await runActionWithFeedback(formData, "/parts", "Part saved successfully.", async () => {
    const session = await requireSession();
    if (!canManageCatalog(session.role)) {
      throw new Error("You do not have permission to manage parts.");
    }
    await createPart({
      name: String(formData.get("name") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      brand: String(formData.get("brand") ?? "").trim() || undefined,
      partNumber: String(formData.get("partNumber") ?? "").trim() || undefined,
      unit: String(formData.get("unit") ?? "").trim(),
      standardPrice: Number(formData.get("standardPrice") ?? 0),
      premiumPrice: Number(formData.get("premiumPrice") ?? 0),
      luxuryPrice: Number(formData.get("luxuryPrice") ?? 0),
      stockQuantity: getNullableNumber(formData, "stockQuantity")
    });
  });
}

export async function updateWorkshopAction(formData: FormData) {
  await runActionWithFeedback(formData, "/settings", "Workshop settings updated successfully.", async () => {
    const session = await requireSession();
    if (!canManageSettings(session.role)) {
      throw new Error("You do not have permission to update workshop settings.");
    }

    const logoFile = formData.get("logoFile");
    const qrFile = formData.get("paymentQrFile");
    const uploadedLogoUrl =
      logoFile instanceof File ? await saveUploadedFile(logoFile, "workshop-logo") : undefined;
    const uploadedQrUrl =
      qrFile instanceof File ? await saveUploadedFile(qrFile, "payment-qr") : undefined;

    await updateWorkshop({
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      gstNumber: String(formData.get("gstNumber") ?? "").trim() || undefined,
      logoUrl: uploadedLogoUrl || (String(formData.get("logoUrl") ?? "").trim() || undefined),
      invoicePrefix: String(formData.get("invoicePrefix") ?? "").trim(),
      taxPercentage: Number(formData.get("taxPercentage") ?? 18),
      businessHours: String(formData.get("businessHours") ?? "").trim() || undefined,
      paymentQrCode: uploadedQrUrl || (String(formData.get("paymentQrCode") ?? "").trim() || undefined)
    });
  });
}

export async function updateInvoicePaymentAction(formData: FormData) {
  await runActionWithFeedback(formData, "/payments", "Payment updated successfully.", async () => {
    const session = await requireSession();
    if (!canManageBilling(session.role)) {
      throw new Error("You do not have permission to record payments.");
    }
    await updateInvoicePayment({
      invoiceId: String(formData.get("invoiceId") ?? ""),
      paymentStatus: String(formData.get("paymentStatus") ?? "") as "PAID" | "UNPAID" | "PARTIAL",
      paymentMode: (String(formData.get("paymentMode") ?? "") || undefined) as
        | "CASH"
        | "UPI"
        | "CARD"
        | "BANK_TRANSFER"
        | undefined,
      amountPaid: Number(formData.get("amountPaid") ?? 0)
    });
  });
}

export async function updateInvoiceWorkStatusAction(formData: FormData) {
  await runActionWithFeedback(formData, "/vehicle-status", "Vehicle status updated successfully.", async () => {
    const session = await requireSession();
    if (!canManageStatus(session.role)) {
      throw new Error("You do not have permission to update work status.");
    }
    await updateInvoiceWorkStatus({
      invoiceId: String(formData.get("invoiceId") ?? ""),
      workStatus: String(formData.get("workStatus") ?? "") as
        | "RECEIVED"
        | "IN_SERVICE"
        | "READY_FOR_DELIVERY"
        | "DELIVERED"
        | "CANCELLED"
    });
  });
}

export async function refreshRouteAction(path: string) {
  revalidatePath(path);
}

export async function updateCustomerAction(formData: FormData) {
  await runActionWithFeedback(formData, "/customers", "Customer updated successfully.", async () => {
    const session = await requireSession();
    if (!canCreateCustomers(session.role)) {
      throw new Error("You do not have permission to update customers.");
    }
    await updateCustomer({
      customerId: String(formData.get("customerId") ?? ""),
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim() || undefined,
      address: String(formData.get("address") ?? "").trim() || undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined
    });
  });
}

export async function deleteCustomerAction(formData: FormData) {
  await runActionWithFeedback(formData, "/customers", "Customer deleted successfully.", async () => {
    const session = await requireSession();
    if (!canCreateCustomers(session.role)) {
      throw new Error("You do not have permission to delete customers.");
    }
    await deleteCustomer(String(formData.get("customerId") ?? ""));
  });
}

export async function updateVehicleAction(formData: FormData) {
  await runActionWithFeedback(formData, "/vehicles", "Vehicle updated successfully.", async () => {
    const session = await requireSession();
    if (!canCreateCustomers(session.role)) {
      throw new Error("You do not have permission to update vehicles.");
    }
    await updateVehicle({
      vehicleId: String(formData.get("vehicleId") ?? ""),
      customerId: String(formData.get("customerId") ?? ""),
      vehicleNumber: String(formData.get("vehicleNumber") ?? "").trim().toUpperCase(),
      brand: String(formData.get("brand") ?? "").trim(),
      model: String(formData.get("model") ?? "").trim(),
      year: Number(formData.get("year") ?? 0) || undefined,
      fuelType: String(formData.get("fuelType") ?? "").trim() || undefined,
      odometer: Number(formData.get("odometer") ?? 0) || undefined
    });
  });
}

export async function deleteVehicleAction(formData: FormData) {
  await runActionWithFeedback(formData, "/vehicles", "Vehicle deleted successfully.", async () => {
    const session = await requireSession();
    if (!canCreateCustomers(session.role)) {
      throw new Error("You do not have permission to delete vehicles.");
    }
    await deleteVehicle(String(formData.get("vehicleId") ?? ""));
  });
}

export async function updateServiceAction(formData: FormData) {
  await runActionWithFeedback(formData, "/services", "Service updated successfully.", async () => {
    const session = await requireSession();
    if (!canManageCatalog(session.role)) {
      throw new Error("You do not have permission to update services.");
    }
    await updateService({
      serviceId: String(formData.get("serviceId") ?? ""),
      name: String(formData.get("name") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || undefined,
      estimatedTime: String(formData.get("estimatedTime") ?? "").trim() || undefined,
      standardPrice: Number(formData.get("standardPrice") ?? 0),
      premiumPrice: Number(formData.get("premiumPrice") ?? 0),
      luxuryPrice: Number(formData.get("luxuryPrice") ?? 0),
      isActive: String(formData.get("isActive") ?? "") === "on"
    });
  });
}

export async function deleteServiceAction(formData: FormData) {
  await runActionWithFeedback(formData, "/services", "Service deleted successfully.", async () => {
    const session = await requireSession();
    if (!canManageCatalog(session.role)) {
      throw new Error("You do not have permission to delete services.");
    }
    await deleteService(String(formData.get("serviceId") ?? ""));
  });
}

export async function updatePartAction(formData: FormData) {
  await runActionWithFeedback(formData, "/parts", "Part updated successfully.", async () => {
    const session = await requireSession();
    if (!canManageCatalog(session.role)) {
      throw new Error("You do not have permission to update parts.");
    }
    await updatePart({
      partId: String(formData.get("partId") ?? ""),
      name: String(formData.get("name") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      brand: String(formData.get("brand") ?? "").trim() || undefined,
      partNumber: String(formData.get("partNumber") ?? "").trim() || undefined,
      unit: String(formData.get("unit") ?? "").trim(),
      standardPrice: Number(formData.get("standardPrice") ?? 0),
      premiumPrice: Number(formData.get("premiumPrice") ?? 0),
      luxuryPrice: Number(formData.get("luxuryPrice") ?? 0),
      stockQuantity: getNullableNumber(formData, "stockQuantity"),
      isActive: String(formData.get("isActive") ?? "") === "on"
    });
  });
}

export async function deletePartAction(formData: FormData) {
  await runActionWithFeedback(formData, "/parts", "Part deleted successfully.", async () => {
    const session = await requireSession();
    if (!canManageCatalog(session.role)) {
      throw new Error("You do not have permission to delete parts.");
    }
    await deletePart(String(formData.get("partId") ?? ""));
  });
}

export async function createStaffUserAction(formData: FormData) {
  await runActionWithFeedback(formData, "/users", "User created successfully.", async () => {
    const session = await requireSession();
    if (!canManageSettings(session.role)) {
      throw new Error("You do not have permission to manage users.");
    }

    await createStaffUser({
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      passwordHash: await bcrypt.hash(String(formData.get("password") ?? ""), 10),
      role: String(formData.get("role") ?? "STAFF") as "MANAGER" | "CASHIER" | "STAFF"
    });
  });
}

export async function updateStaffUserAction(formData: FormData) {
  await runActionWithFeedback(formData, "/users", "User updated successfully.", async () => {
    const session = await requireSession();
    if (!canManageSettings(session.role)) {
      throw new Error("You do not have permission to manage users.");
    }

    await updateStaffUser({
      userId: String(formData.get("userId") ?? ""),
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      role: String(formData.get("role") ?? "STAFF") as "MANAGER" | "CASHIER" | "STAFF"
    });
  });
}

export async function deleteStaffUserAction(formData: FormData) {
  await runActionWithFeedback(formData, "/users", "User removed successfully.", async () => {
    const session = await requireSession();
    if (!canManageSettings(session.role)) {
      throw new Error("You do not have permission to manage users.");
    }

    const userId = String(formData.get("userId") ?? "");
    if (userId === session.id) {
      throw new Error("You cannot delete your own account.");
    }

    await deleteStaffUser(userId);
  });
}

export async function sendReminderAction(formData: FormData) {
  const session = await requireSession();
  if (!canManageStatus(session.role) && !canManageBilling(session.role)) {
    throw new Error("You do not have permission to send reminders.");
  }

  await sendReminder({
    invoiceId: String(formData.get("invoiceId") ?? ""),
    channel: String(formData.get("channel") ?? "WHATSAPP") as "WHATSAPP" | "SMS",
    sentByName: session.name
  });
}
