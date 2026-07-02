import { createHash, randomBytes, randomUUID } from "crypto";
import { PricingTier as PrismaPricingTier, PaymentStatus as PrismaPaymentStatus, PaymentMode as PrismaPaymentMode, Role as PrismaRole, WorkStatus as PrismaWorkStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendReminderActivity, getReminderActivities } from "@/lib/reminders";
import { readStore, updateStore } from "@/lib/store";
import type {
  Customer,
  Invoice,
  InvoiceItem,
  PaymentMode,
  PaymentStatus,
  PricingTier,
  Reminder,
  ReminderActivity,
  Role,
  Service,
  SparePart,
  User,
  Vehicle,
  WorkStatus,
  Workshop
} from "@/lib/types";

const hasDatabase = Boolean(process.env.DATABASE_URL);

type InvoiceView = Awaited<ReturnType<typeof getInvoices>>[number];
type InvoiceItemInput = {
  itemType: "SERVICE" | "PART";
  sourceId: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
};

function getTierPrice<T extends { standardPrice: number; premiumPrice: number; luxuryPrice: number }>(
  item: T,
  tier: PricingTier
) {
  if (tier === "PREMIUM") return item.premiumPrice;
  if (tier === "LUXURY") return item.luxuryPrice;
  return item.standardPrice;
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

function getPartItemDeltas(
  items: Array<{
    itemType: string;
    sourceId?: string | null;
    quantity: number;
  }>
) {
  const deltas = new Map<string, number>();

  for (const item of items) {
    if (item.itemType !== "PART" || !item.sourceId) {
      continue;
    }

    deltas.set(item.sourceId, (deltas.get(item.sourceId) ?? 0) + item.quantity);
  }

  return deltas;
}

function applyPartStockDeductionOrThrow(
  parts: Array<{ id: string; name: string; stockQuantity?: number | null }>,
  items: Array<{ itemType: string; sourceId?: string | null; quantity: number }>
) {
  const deltas = getPartItemDeltas(items);

  for (const [partId, quantity] of deltas.entries()) {
    const part = parts.find((entry) => entry.id === partId);
    if (!part) {
      throw new Error("One or more spare parts used in the invoice could not be found.");
    }

    if (part.stockQuantity != null && part.stockQuantity < quantity) {
      throw new Error(`Insufficient stock for ${part.name}. Available: ${part.stockQuantity}, required: ${quantity}.`);
    }
  }

  for (const [partId, quantity] of deltas.entries()) {
    const part = parts.find((entry) => entry.id === partId);
    if (part && part.stockQuantity != null) {
      part.stockQuantity -= quantity;
    }
  }
}

function restorePartStock(
  parts: Array<{ id: string; stockQuantity?: number | null }>,
  items: Array<{ itemType: string; sourceId?: string | null; quantity: number }>
) {
  const deltas = getPartItemDeltas(items);

  for (const [partId, quantity] of deltas.entries()) {
    const part = parts.find((entry) => entry.id === partId);
    if (part && part.stockQuantity != null) {
      part.stockQuantity += quantity;
    }
  }
}

const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60 * 2;

function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createPasswordResetSecret() {
  return randomBytes(32).toString("hex");
}

function isResetTokenUsable(token: {
  expiresAt: string | Date;
  usedAt?: string | Date | null;
}) {
  const expiresAt = token.expiresAt instanceof Date ? token.expiresAt.getTime() : new Date(token.expiresAt).getTime();
  const usedAt = token.usedAt
    ? token.usedAt instanceof Date
      ? token.usedAt.getTime()
      : new Date(token.usedAt).getTime()
    : null;
  return !usedAt && expiresAt > Date.now();
}

function invoiceNumberFromCount(prefix: string, count: number) {
  return `${prefix}-${String(1000 + count + 1).padStart(4, "0")}`;
}

function reminderMessage({
  customerName,
  vehicleNumber,
  workshopName,
  workStatus,
  total
}: {
  customerName: string;
  vehicleNumber: string;
  workshopName: string;
  workStatus: WorkStatus;
  total: number;
}) {
  const templates: Record<WorkStatus, string> = {
    RECEIVED: `Hi ${customerName}, your vehicle ${vehicleNumber} has been received at ${workshopName}.`,
    IN_SERVICE: `Hi ${customerName}, your vehicle ${vehicleNumber} is currently under service.`,
    READY_FOR_DELIVERY: `Hi ${customerName}, your vehicle ${vehicleNumber} is ready for delivery. Total amount: Rs ${total}.`,
    DELIVERED: `Hi ${customerName}, thank you for visiting ${workshopName}. Your vehicle ${vehicleNumber} has been delivered.`,
    CANCELLED: `Hi ${customerName}, the work order for vehicle ${vehicleNumber} has been cancelled.`
  };
  return templates[workStatus];
}

function normalizePhoneForDispatch(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }

  return digits;
}

function buildReminderDispatchUrl(channel: "WHATSAPP" | "SMS", phone: string, message: string) {
  const encodedMessage = encodeURIComponent(message);
  if (channel === "WHATSAPP") {
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  }

  return `sms:${phone}?&body=${encodedMessage}`;
}

function mapWorkshop(workshop: {
  id: string;
  name: string;
  logoUrl: string | null;
  phone: string;
  email: string;
  address: string;
  gstNumber: string | null;
  invoicePrefix: string;
  taxPercentage: number;
  paymentQrCode: string | null;
  businessHours: string | null;
}): Workshop {
  return {
    id: workshop.id,
    name: workshop.name,
    logoUrl: workshop.logoUrl ?? undefined,
    phone: workshop.phone,
    email: workshop.email,
    address: workshop.address,
    gstNumber: workshop.gstNumber ?? undefined,
    invoicePrefix: workshop.invoicePrefix,
    taxPercentage: workshop.taxPercentage,
    paymentQrCode: workshop.paymentQrCode ?? undefined,
    businessHours: workshop.businessHours ?? undefined
  };
}

function mapUser(user: {
  id: string;
  workshopId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: PrismaRole;
}): User {
  return {
    id: user.id,
    workshopId: user.workshopId,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role
  };
}

function mapCustomer(customer: {
  id: string;
  workshopId: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: Date;
}): Customer {
  return {
    id: customer.id,
    workshopId: customer.workshopId,
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? undefined,
    address: customer.address ?? undefined,
    notes: customer.notes ?? undefined,
    createdAt: customer.createdAt.toISOString()
  };
}

function mapVehicle(vehicle: {
  id: string;
  customerId: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  year: number | null;
  fuelType: string | null;
  odometer: number | null;
}): Vehicle {
  return {
    id: vehicle.id,
    customerId: vehicle.customerId,
    vehicleNumber: vehicle.vehicleNumber,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year ?? undefined,
    fuelType: vehicle.fuelType ?? undefined,
    odometer: vehicle.odometer ?? undefined
  };
}

function mapService(service: {
  id: string;
  workshopId: string;
  name: string;
  category: string;
  description: string | null;
  estimatedTime: string | null;
  standardPrice: number;
  premiumPrice: number;
  luxuryPrice: number;
  isActive: boolean;
}): Service {
  return {
    id: service.id,
    workshopId: service.workshopId,
    name: service.name,
    category: service.category,
    description: service.description ?? undefined,
    estimatedTime: service.estimatedTime ?? undefined,
    standardPrice: service.standardPrice,
    premiumPrice: service.premiumPrice,
    luxuryPrice: service.luxuryPrice,
    isActive: service.isActive
  };
}

function mapPart(part: {
  id: string;
  workshopId: string;
  name: string;
  category: string;
  brand: string | null;
  partNumber: string | null;
  unit: string;
  standardPrice: number;
  premiumPrice: number;
  luxuryPrice: number;
  stockQuantity: number | null;
  isActive: boolean;
}): SparePart {
  return {
    id: part.id,
    workshopId: part.workshopId,
    name: part.name,
    category: part.category,
    brand: part.brand ?? undefined,
    partNumber: part.partNumber ?? undefined,
    unit: part.unit,
    standardPrice: part.standardPrice,
    premiumPrice: part.premiumPrice,
    luxuryPrice: part.luxuryPrice,
    stockQuantity: part.stockQuantity ?? null,
    isActive: part.isActive
  };
}

function mapInvoice(invoice: {
  id: string;
  workshopId: string;
  customerId: string;
  vehicleId: string;
  invoiceNumber: string;
  pricingTier: PrismaPricingTier;
  paymentStatus: PrismaPaymentStatus;
  paymentMode: PrismaPaymentMode | null;
  workStatus: PrismaWorkStatus;
  subtotal: number;
  discount: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  notes: string | null;
  dueDate: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
}): Invoice {
  return {
    id: invoice.id,
    workshopId: invoice.workshopId,
    customerId: invoice.customerId,
    vehicleId: invoice.vehicleId,
    invoiceNumber: invoice.invoiceNumber,
    pricingTier: invoice.pricingTier,
    paymentStatus: invoice.paymentStatus,
    paymentMode: invoice.paymentMode ?? undefined,
    workStatus: invoice.workStatus,
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    taxPercentage: invoice.taxPercentage,
    taxAmount: invoice.taxAmount,
    grandTotal: invoice.grandTotal,
    amountPaid: invoice.amountPaid,
    notes: invoice.notes ?? undefined,
    dueDate: invoice.dueDate?.toISOString(),
    deliveredAt: invoice.deliveredAt?.toISOString(),
    createdAt: invoice.createdAt.toISOString()
  };
}

function mapInvoiceItem(item: {
  id: string;
  invoiceId: string;
  itemType: string;
  sourceId: string | null;
  name: string;
  category: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}): InvoiceItem {
  return {
    id: item.id,
    invoiceId: item.invoiceId,
    itemType: item.itemType as "SERVICE" | "PART",
    sourceId: item.sourceId ?? undefined,
    name: item.name,
    category: item.category ?? undefined,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice
  };
}

function mapReminderActivity(activity: {
  id: string;
  invoiceId: string;
  channel: string;
  customerName: string;
  vehicleNumber: string;
  workStatus: PrismaWorkStatus;
  message: string;
  sentAt: Date;
  sentByName: string | null;
}): ReminderActivity {
  return {
    id: activity.id,
    invoiceId: activity.invoiceId,
    channel: activity.channel as "WHATSAPP" | "SMS",
    customerName: activity.customerName,
    vehicleNumber: activity.vehicleNumber,
    workStatus: activity.workStatus,
    message: activity.message,
    sentAt: activity.sentAt.toISOString(),
    sentByName: activity.sentByName ?? undefined
  };
}

async function getPrimaryWorkshopDb() {
  return prisma.workshop.findFirst({
    orderBy: { createdAt: "asc" }
  });
}

async function getWorkshopDb(workshopId: string) {
  return prisma.workshop.findUnique({
    where: { id: workshopId }
  });
}

async function getPrimaryWorkshopId() {
  const workshop = await getPrimaryWorkshopDb();
  if (!workshop) {
    throw new Error("No workshop found. Seed the database or register an owner first.");
  }
  return workshop.id;
}

async function getActiveWorkshopId() {
  const session = await getSession();
  if (session?.workshopId) {
    return session.workshopId;
  }

  return getPrimaryWorkshopId();
}

async function getWorkshopFallback() {
  const store = await readStore();
  return store.workshop;
}

export async function getWorkshop() {
  if (!hasDatabase) {
    return getWorkshopFallback();
  }

  const workshopId = await getActiveWorkshopId();
  const workshop = await getWorkshopDb(workshopId);
  if (!workshop) {
    return getWorkshopFallback();
  }
  return mapWorkshop(workshop);
}

export async function updateWorkshop(input: {
  name: string;
  phone: string;
  email: string;
  address: string;
  gstNumber?: string;
  logoUrl?: string;
  invoicePrefix: string;
  taxPercentage: number;
  businessHours?: string;
  paymentQrCode?: string;
}) {
  if (!hasDatabase) {
    await updateStore((store) => {
      store.workshop = {
        ...store.workshop,
        ...input
      };
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    await prisma.workshop.update({
      where: { id: workshopId },
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        gstNumber: input.gstNumber,
        logoUrl: input.logoUrl,
        invoicePrefix: input.invoicePrefix,
        taxPercentage: input.taxPercentage,
        businessHours: input.businessHours,
        paymentQrCode: input.paymentQrCode
      }
    });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function getUsers() {
  if (!hasDatabase) {
    const store = await readStore();
    return store.users;
  }

  const users = await prisma.user.findMany({
    where: { workshopId: await getActiveWorkshopId() },
    orderBy: { createdAt: "asc" }
  });
  return users.map(mapUser);
}

export async function getUserByEmail(email: string) {
  if (!hasDatabase) {
    const store = await readStore();
    return store.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });
  return user ? mapUser(user) : null;
}

export async function createPasswordResetLink(email: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const token = createPasswordResetSecret();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  if (!hasDatabase) {
    await updateStore((store) => {
      store.passwordResetTokens = (store.passwordResetTokens ?? []).filter(
        (entry) => entry.userId !== user.id && isResetTokenUsable(entry)
      );
      store.passwordResetTokens.unshift({
        id: createId("reset"),
        userId: user.id,
        tokenHash,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({
        where: {
          OR: [
            { userId: user.id },
            { expiresAt: { lte: new Date() } }
          ]
        }
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt
        }
      });
    });
  }

  return {
    email: user.email,
    name: user.name,
    resetPath: `/reset-password?token=${token}`,
    expiresAt: expiresAt.toISOString()
  };
}

export async function getPasswordResetTokenDetails(token: string) {
  const tokenHash = hashPasswordResetToken(token);

  if (!hasDatabase) {
    const store = await readStore();
    const resetToken = (store.passwordResetTokens ?? []).find((entry) => entry.tokenHash === tokenHash);
    if (!resetToken || !isResetTokenUsable(resetToken)) {
      return null;
    }

    const user = store.users.find((entry) => entry.id === resetToken.userId);
    if (!user) {
      return null;
    }

    return {
      email: user.email,
      name: user.name,
      expiresAt: resetToken.expiresAt
    };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!resetToken || !isResetTokenUsable(resetToken)) {
    return null;
  }

  return {
    email: resetToken.user.email,
    name: resetToken.user.name,
    expiresAt: resetToken.expiresAt.toISOString()
  };
}

export async function resetPasswordWithToken(input: {
  token: string;
  passwordHash: string;
}) {
  const tokenHash = hashPasswordResetToken(input.token);

  if (!hasDatabase) {
    const result = await updateStore((store) => {
      const resetToken = (store.passwordResetTokens ?? []).find((entry) => entry.tokenHash === tokenHash);
      if (!resetToken || !isResetTokenUsable(resetToken)) {
        throw new Error("This password reset link is invalid or has expired.");
      }

      const user = store.users.find((entry) => entry.id === resetToken.userId);
      if (!user) {
        throw new Error("This password reset link is invalid or has expired.");
      }

      user.passwordHash = input.passwordHash;
      resetToken.usedAt = new Date().toISOString();
      store.passwordResetTokens = store.passwordResetTokens.filter((entry) => entry.id !== resetToken.id);
      return { email: user.email };
    });

    return result;
  }

  const result = await prisma.$transaction(async (tx) => {
    const resetToken = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!resetToken || !isResetTokenUsable(resetToken)) {
      throw new Error("This password reset link is invalid or has expired.");
    }

    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: input.passwordHash }
    });

    await tx.passwordResetToken.delete({
      where: { id: resetToken.id }
    });

    return { email: resetToken.user.email };
  });

  return result;
}

export async function registerOwner(input: {
  ownerName: string;
  email: string;
  passwordHash: string;
  workshopName: string;
  phone: string;
  address: string;
}) {
  if (!hasDatabase) {
    return updateStore((store) => {
      if (store.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
        throw new Error("An account with this email already exists.");
      }

      const workshopId = store.workshop?.id ?? createId("workshop");
      const workshop: Workshop = {
        ...store.workshop,
        id: workshopId,
        name: input.workshopName,
        phone: input.phone,
        email: input.email,
        address: input.address,
        invoicePrefix: store.workshop?.invoicePrefix ?? "INV",
        taxPercentage: store.workshop?.taxPercentage ?? 18
      };

      const user: User = {
        id: createId("user"),
        workshopId,
        name: input.ownerName,
        email: input.email,
        passwordHash: input.passwordHash,
        role: "OWNER"
      };

      store.workshop = workshop;
      store.users.push(user);
      return user;
    });
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const workshop = await tx.workshop.create({
      data: {
        name: input.workshopName,
        phone: input.phone,
        email: input.email,
        address: input.address,
        invoicePrefix: "INV",
        taxPercentage: 18
      }
    });

    const user = await tx.user.create({
      data: {
        workshopId: workshop.id,
        name: input.ownerName,
        email: input.email,
        passwordHash: input.passwordHash,
        role: PrismaRole.OWNER
      }
    });

    return user;
  });

  return mapUser(result);
}

export async function createStaffUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: Exclude<Role, "OWNER">;
}) {
  if (!hasDatabase) {
    const workshop = await getWorkshop();
    return updateStore((store) => {
      if (store.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
        throw new Error("A user with this email already exists.");
      }

      const user: User = {
        id: createId("user"),
        workshopId: workshop.id,
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role
      };
      store.users.unshift(user);
      return user;
    });
  }

  const workshopId = await getActiveWorkshopId();
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const user = await prisma.user.create({
    data: {
      workshopId,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role
    }
  });

  return mapUser(user);
}

export async function updateStaffUser(input: {
  userId: string;
  name: string;
  email: string;
  role: Exclude<Role, "OWNER">;
}) {
  if (!hasDatabase) {
    await updateStore((store) => {
      const user = store.users.find((entry) => entry.id === input.userId);
      if (!user) return;
      if (user.role === "OWNER") {
        throw new Error("Owner account cannot be modified here.");
      }
      user.name = input.name;
      user.email = input.email;
      user.role = input.role;
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    const existing = await prisma.user.findFirst({
      where: { id: input.userId, workshopId }
    });
    if (!existing) return;
    if (existing.role === PrismaRole.OWNER) {
      throw new Error("Owner account cannot be modified here.");
    }
    await prisma.user.update({
      where: { id: input.userId },
      data: {
        name: input.name,
        email: input.email,
        role: input.role
      }
    });
  }

  revalidatePath("/users");
}

export async function deleteStaffUser(userId: string) {
  if (!hasDatabase) {
    await updateStore((store) => {
      const user = store.users.find((entry) => entry.id === userId);
      if (!user) return;
      if (user.role === "OWNER") {
        throw new Error("Owner account cannot be deleted.");
      }
      store.users = store.users.filter((entry) => entry.id !== userId);
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    const existing = await prisma.user.findFirst({
      where: { id: userId, workshopId }
    });
    if (!existing) return;
    if (existing.role === PrismaRole.OWNER) {
      throw new Error("Owner account cannot be deleted.");
    }
    await prisma.user.delete({
      where: { id: userId }
    });
  }

  revalidatePath("/users");
}

export async function getCustomers() {
  if (!hasDatabase) {
    const store = await readStore();
    return store.customers;
  }

  const workshopId = await getActiveWorkshopId();
  const customers = await prisma.customer.findMany({
    where: { workshopId },
    orderBy: { createdAt: "desc" }
  });
  return customers.map(mapCustomer);
}

export async function createCustomer(input: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  if (!hasDatabase) {
    const workshop = await getWorkshop();
    const customer = await updateStore((store) => {
      const customer: Customer = {
        id: createId("cust"),
        workshopId: workshop.id,
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        notes: input.notes,
        createdAt: new Date().toISOString()
      };
      store.customers.unshift(customer);
      return customer;
    });

    revalidatePath("/customers");
    revalidatePath("/invoices/new");
    return customer;
  } else {
    const workshopId = await getActiveWorkshopId();
    const customer = await prisma.customer.create({
      data: {
        workshopId,
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        notes: input.notes
      }
    });

    revalidatePath("/customers");
    revalidatePath("/invoices/new");
    return mapCustomer(customer);
  }
}

export async function updateCustomer(input: {
  customerId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  if (!hasDatabase) {
    await updateStore((store) => {
      const customer = store.customers.find((entry) => entry.id === input.customerId);
      if (!customer) return;
      customer.name = input.name;
      customer.phone = input.phone;
      customer.email = input.email;
      customer.address = input.address;
      customer.notes = input.notes;
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    const existing = await prisma.customer.findFirst({
      where: { id: input.customerId, workshopId }
    });
    if (!existing) return;
    await prisma.customer.update({
      where: { id: input.customerId },
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        notes: input.notes
      }
    });
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${input.customerId}`);
  revalidatePath("/search");
}

export async function deleteCustomer(customerId: string) {
  if (!hasDatabase) {
    await updateStore((store) => {
      const hasInvoices = store.invoices.some((invoice) => invoice.customerId === customerId);
      if (hasInvoices) {
        throw new Error("Cannot delete a customer with invoice history.");
      }
      store.vehicles = store.vehicles.filter((vehicle) => vehicle.customerId !== customerId);
      store.customers = store.customers.filter((customer) => customer.id !== customerId);
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    const existing = await prisma.customer.findFirst({
      where: { id: customerId, workshopId }
    });
    if (!existing) return;
    const invoiceCount = await prisma.invoice.count({ where: { customerId, workshopId } });
    if (invoiceCount > 0) {
      throw new Error("Cannot delete a customer with invoice history.");
    }
    await prisma.customer.delete({
      where: { id: customerId }
    });
  }

  revalidatePath("/customers");
  revalidatePath("/invoices/new");
  revalidatePath("/search");
}

export async function getCustomer(id: string) {
  if (!hasDatabase) {
    const store = await readStore();
    const customer = store.customers.find((entry) => entry.id === id);
    if (!customer) return null;
    const vehicles = store.vehicles.filter((vehicle) => vehicle.customerId === id);
    const invoices = store.invoices
      .filter((invoice) => invoice.customerId === id)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const totalSpent = invoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0);
    const lastVisit = invoices[0]?.createdAt;
    return { customer, vehicles, invoices, totalSpent, lastVisit };
  }

  const workshopId = await getActiveWorkshopId();
  const customer = await prisma.customer.findFirst({
    where: { id, workshopId },
    include: {
      vehicles: true,
      invoices: {
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!customer) return null;

  const mappedInvoices = customer.invoices.map(mapInvoice);
  return {
    customer: mapCustomer(customer),
    vehicles: customer.vehicles.map(mapVehicle),
    invoices: mappedInvoices,
    totalSpent: mappedInvoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0),
    lastVisit: mappedInvoices[0]?.createdAt
  };
}

export async function getVehicles() {
  if (!hasDatabase) {
    const store = await readStore();
    return store.vehicles.map((vehicle) => ({
      ...vehicle,
      customer: store.customers.find((customer) => customer.id === vehicle.customerId)
    }));
  }

  const workshopId = await getActiveWorkshopId();
  const vehicles = await prisma.vehicle.findMany({
    where: { customer: { workshopId } },
    include: { customer: true },
    orderBy: { createdAt: "desc" }
  });
  return vehicles.map((vehicle) => ({
    ...mapVehicle(vehicle),
    customer: mapCustomer(vehicle.customer)
  }));
}

export async function createVehicle(input: {
  customerId: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  year?: number;
  fuelType?: string;
  odometer?: number;
}) {
  if (!hasDatabase) {
    const vehicle = await updateStore((store) => {
      const vehicle: Vehicle = {
        id: createId("veh"),
        customerId: input.customerId,
        vehicleNumber: input.vehicleNumber,
        brand: input.brand,
        model: input.model,
        year: input.year,
        fuelType: input.fuelType,
        odometer: input.odometer
      };
      store.vehicles.unshift(vehicle);
      return vehicle;
    });

    revalidatePath("/vehicles");
    revalidatePath("/customers");
    revalidatePath(`/customers/${input.customerId}`);
    revalidatePath("/invoices/new");
    return vehicle;
  } else {
    const workshopId = await getActiveWorkshopId();
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, workshopId }
    });
    if (!customer) {
      throw new Error("Customer not found for this workshop.");
    }
    const vehicle = await prisma.vehicle.create({
      data: {
        customerId: input.customerId,
        vehicleNumber: input.vehicleNumber,
        brand: input.brand,
        model: input.model,
        year: input.year,
        fuelType: input.fuelType,
        odometer: input.odometer
      }
    });
  }

  revalidatePath("/vehicles");
  revalidatePath("/customers");
  revalidatePath("/invoices/new");
}

export async function updateVehicle(input: {
  vehicleId: string;
  customerId: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  year?: number;
  fuelType?: string;
  odometer?: number;
}) {
  if (!hasDatabase) {
    await updateStore((store) => {
      const vehicle = store.vehicles.find((entry) => entry.id === input.vehicleId);
      if (!vehicle) return;
      vehicle.customerId = input.customerId;
      vehicle.vehicleNumber = input.vehicleNumber;
      vehicle.brand = input.brand;
      vehicle.model = input.model;
      vehicle.year = input.year;
      vehicle.fuelType = input.fuelType;
      vehicle.odometer = input.odometer;
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: input.vehicleId, customer: { workshopId } }
    });
    if (!vehicle) return;
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, workshopId }
    });
    if (!customer) {
      throw new Error("Customer not found for this workshop.");
    }
    await prisma.vehicle.update({
      where: { id: input.vehicleId },
      data: {
        customerId: input.customerId,
        vehicleNumber: input.vehicleNumber,
        brand: input.brand,
        model: input.model,
        year: input.year,
        fuelType: input.fuelType,
        odometer: input.odometer
      }
    });

    revalidatePath("/vehicles");
    revalidatePath("/customers");
    revalidatePath(`/customers/${input.customerId}`);
    revalidatePath("/invoices/new");
    return mapVehicle(vehicle);
  }
}

export async function deleteVehicle(vehicleId: string) {
  if (!hasDatabase) {
    await updateStore((store) => {
      const hasInvoices = store.invoices.some((invoice) => invoice.vehicleId === vehicleId);
      if (hasInvoices) {
        throw new Error("Cannot delete a vehicle linked to invoices.");
      }
      store.vehicles = store.vehicles.filter((vehicle) => vehicle.id !== vehicleId);
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    const existing = await prisma.vehicle.findFirst({
      where: { id: vehicleId, customer: { workshopId } }
    });
    if (!existing) return;
    const invoiceCount = await prisma.invoice.count({ where: { vehicleId, workshopId } });
    if (invoiceCount > 0) {
      throw new Error("Cannot delete a vehicle linked to invoices.");
    }
    await prisma.vehicle.delete({
      where: { id: vehicleId }
    });
  }

  revalidatePath("/vehicles");
  revalidatePath("/customers");
  revalidatePath("/invoices/new");
}

export async function getServices() {
  if (!hasDatabase) {
    const store = await readStore();
    return store.services;
  }

  const workshopId = await getActiveWorkshopId();
  const services = await prisma.service.findMany({
    where: { workshopId },
    orderBy: { createdAt: "desc" }
  });
  return services.map(mapService);
}

export async function createService(input: Omit<Service, "id" | "workshopId" | "isActive"> & { isActive?: boolean }) {
  if (!hasDatabase) {
    const workshop = await getWorkshop();
    const service = await updateStore((store) => {
      const service: Service = {
        id: createId("svc"),
        workshopId: workshop.id,
        isActive: input.isActive ?? true,
        ...input
      };
      store.services.unshift(service);
      return service;
    });

    revalidatePath("/services");
    revalidatePath("/invoices/new");
    return service;
  } else {
    const workshopId = await getActiveWorkshopId();
    const service = await prisma.service.create({
      data: {
        workshopId,
        name: input.name,
        category: input.category,
        description: input.description,
        estimatedTime: input.estimatedTime,
        standardPrice: input.standardPrice,
        premiumPrice: input.premiumPrice,
        luxuryPrice: input.luxuryPrice,
        isActive: input.isActive ?? true
      }
    });

    revalidatePath("/services");
    revalidatePath("/invoices/new");
    return mapService(service);
  }
}

export async function updateService(input: {
  serviceId: string;
  name: string;
  category: string;
  description?: string;
  estimatedTime?: string;
  standardPrice: number;
  premiumPrice: number;
  luxuryPrice: number;
  isActive: boolean;
}) {
  if (!hasDatabase) {
    await updateStore((store) => {
      const service = store.services.find((entry) => entry.id === input.serviceId);
      if (!service) return;
      service.name = input.name;
      service.category = input.category;
      service.description = input.description;
      service.estimatedTime = input.estimatedTime;
      service.standardPrice = input.standardPrice;
      service.premiumPrice = input.premiumPrice;
      service.luxuryPrice = input.luxuryPrice;
      service.isActive = input.isActive;
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    const existing = await prisma.service.findFirst({
      where: { id: input.serviceId, workshopId }
    });
    if (!existing) return;
    await prisma.service.update({
      where: { id: input.serviceId },
      data: {
        name: input.name,
        category: input.category,
        description: input.description,
        estimatedTime: input.estimatedTime,
        standardPrice: input.standardPrice,
        premiumPrice: input.premiumPrice,
        luxuryPrice: input.luxuryPrice,
        isActive: input.isActive
      }
    });
  }

  revalidatePath("/services");
  revalidatePath("/invoices/new");
}

export async function deleteService(serviceId: string) {
  if (!hasDatabase) {
    await updateStore((store) => {
      store.services = store.services.filter((service) => service.id !== serviceId);
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    const existing = await prisma.service.findFirst({
      where: { id: serviceId, workshopId }
    });
    if (!existing) return;
    await prisma.service.delete({
      where: { id: serviceId }
    });
  }

  revalidatePath("/services");
  revalidatePath("/invoices/new");
}

export async function getParts() {
  if (!hasDatabase) {
    const store = await readStore();
    return store.spareParts;
  }

  const workshopId = await getActiveWorkshopId();
  const parts = await prisma.sparePart.findMany({
    where: { workshopId },
    orderBy: { createdAt: "desc" }
  });
  return parts.map(mapPart);
}

export async function createPart(input: Omit<SparePart, "id" | "workshopId" | "isActive"> & { isActive?: boolean }) {
  if (!hasDatabase) {
    const workshop = await getWorkshop();
    const part = await updateStore((store) => {
      const part: SparePart = {
        ...input,
        id: createId("part"),
        workshopId: workshop.id,
        isActive: input.isActive ?? true,
        stockQuantity: input.stockQuantity ?? null
      };
      store.spareParts.unshift(part);
      return part;
    });

    revalidatePath("/parts");
    revalidatePath("/invoices/new");
    return part;
  } else {
    const workshopId = await getActiveWorkshopId();
    const part = await prisma.sparePart.create({
      data: {
        workshopId,
        name: input.name,
        category: input.category,
        brand: input.brand,
        partNumber: input.partNumber,
        unit: input.unit,
        standardPrice: input.standardPrice,
        premiumPrice: input.premiumPrice,
        luxuryPrice: input.luxuryPrice,
        stockQuantity: input.stockQuantity ?? null,
        isActive: input.isActive ?? true
      }
    });

    revalidatePath("/parts");
    revalidatePath("/invoices/new");
    return mapPart(part);
  }
}

export async function updatePart(input: {
  partId: string;
  name: string;
  category: string;
  brand?: string;
  partNumber?: string;
  unit: string;
  standardPrice: number;
  premiumPrice: number;
  luxuryPrice: number;
  stockQuantity?: number | null;
  isActive: boolean;
}) {
  if (!hasDatabase) {
    await updateStore((store) => {
      const part = store.spareParts.find((entry) => entry.id === input.partId);
      if (!part) return;
      part.name = input.name;
      part.category = input.category;
      part.brand = input.brand;
      part.partNumber = input.partNumber;
      part.unit = input.unit;
      part.standardPrice = input.standardPrice;
      part.premiumPrice = input.premiumPrice;
      part.luxuryPrice = input.luxuryPrice;
      part.stockQuantity = input.stockQuantity ?? null;
      part.isActive = input.isActive;
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    const existing = await prisma.sparePart.findFirst({
      where: { id: input.partId, workshopId }
    });
    if (!existing) return;
    await prisma.sparePart.update({
      where: { id: input.partId },
      data: {
        name: input.name,
        category: input.category,
        brand: input.brand,
        partNumber: input.partNumber,
        unit: input.unit,
        standardPrice: input.standardPrice,
        premiumPrice: input.premiumPrice,
        luxuryPrice: input.luxuryPrice,
        stockQuantity: input.stockQuantity ?? null,
        isActive: input.isActive
      }
    });
  }

  revalidatePath("/parts");
  revalidatePath("/invoices/new");
}

export async function deletePart(partId: string) {
  if (!hasDatabase) {
    await updateStore((store) => {
      store.spareParts = store.spareParts.filter((part) => part.id !== partId);
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    const existing = await prisma.sparePart.findFirst({
      where: { id: partId, workshopId }
    });
    if (!existing) return;
    await prisma.sparePart.delete({
      where: { id: partId }
    });
  }

  revalidatePath("/parts");
  revalidatePath("/invoices/new");
}

export async function getInvoices() {
  if (!hasDatabase) {
    const store = await readStore();
    return store.invoices
      .slice()
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .map((invoice) => ({
        ...invoice,
        customer: store.customers.find((customer) => customer.id === invoice.customerId)!,
        vehicle: store.vehicles.find((vehicle) => vehicle.id === invoice.vehicleId)!,
        items: store.invoiceItems.filter((item) => item.invoiceId === invoice.id)
      }));
  }

  const workshopId = await getActiveWorkshopId();
  const invoices = await prisma.invoice.findMany({
    where: { workshopId },
    include: {
      customer: true,
      vehicle: true,
      items: true
    },
    orderBy: { createdAt: "desc" }
  });

  return invoices.map((invoice) => ({
    ...mapInvoice(invoice),
    customer: mapCustomer(invoice.customer),
    vehicle: mapVehicle(invoice.vehicle),
    items: invoice.items.map(mapInvoiceItem)
  }));
}

export async function getInvoice(id: string) {
  if (!hasDatabase) {
    const store = await readStore();
    const invoice = store.invoices.find((entry) => entry.id === id);
    if (!invoice) return null;
    return {
      ...invoice,
      customer: store.customers.find((customer) => customer.id === invoice.customerId)!,
      vehicle: store.vehicles.find((vehicle) => vehicle.id === invoice.vehicleId)!,
      items: store.invoiceItems.filter((item) => item.invoiceId === invoice.id)
    };
  }

  const workshopId = await getActiveWorkshopId();
  const invoice = await prisma.invoice.findFirst({
    where: { id, workshopId },
    include: {
      customer: true,
      vehicle: true,
      items: true
    }
  });
  if (!invoice) return null;

  return {
    ...mapInvoice(invoice),
    customer: mapCustomer(invoice.customer),
    vehicle: mapVehicle(invoice.vehicle),
    items: invoice.items.map(mapInvoiceItem)
  };
}

export async function updateInvoicePayment(input: {
  invoiceId: string;
  paymentStatus: PaymentStatus;
  paymentMode?: PaymentMode;
  amountPaid: number;
}) {
  if (!hasDatabase) {
    await updateStore((store) => {
      const invoice = store.invoices.find((entry) => entry.id === input.invoiceId);
      if (!invoice) return;
      invoice.paymentStatus = input.paymentStatus;
      invoice.paymentMode = input.paymentMode;
      invoice.amountPaid = Math.min(input.amountPaid, invoice.grandTotal);
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    const invoice = await prisma.invoice.findFirst({
      where: { id: input.invoiceId, workshopId }
    });
    if (invoice) {
      await prisma.invoice.update({
        where: { id: input.invoiceId },
        data: {
          paymentStatus: input.paymentStatus,
          paymentMode: input.paymentMode,
          amountPaid: Math.min(input.amountPaid, invoice.grandTotal)
        }
      });
    }
  }

  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${input.invoiceId}`);
  revalidatePath("/dashboard");
}

export async function updateInvoiceWorkStatus(input: {
  invoiceId: string;
  workStatus: WorkStatus;
}) {
  if (!hasDatabase) {
    await updateStore((store) => {
      const invoice = store.invoices.find((entry) => entry.id === input.invoiceId);
      if (!invoice) return;

      const previousStatus = invoice.workStatus;
      if (previousStatus !== "CANCELLED" && input.workStatus === "CANCELLED") {
        const items = store.invoiceItems.filter((entry) => entry.invoiceId === invoice.id);
        restorePartStock(store.spareParts, items);
      }

      if (previousStatus === "CANCELLED" && input.workStatus !== "CANCELLED") {
        const items = store.invoiceItems.filter((entry) => entry.invoiceId === invoice.id);
        applyPartStockDeductionOrThrow(store.spareParts, items);
      }

      invoice.workStatus = input.workStatus;
      if (input.workStatus === "DELIVERED") {
        invoice.deliveredAt = new Date().toISOString();
      } else {
        invoice.deliveredAt = undefined;
      }
    });
  } else {
    const workshopId = await getActiveWorkshopId();
    await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findFirst({
        where: { id: input.invoiceId, workshopId },
        include: { items: true }
      });
      if (!existing) return;

      if (existing.workStatus !== "CANCELLED" && input.workStatus === "CANCELLED") {
        const deltas = getPartItemDeltas(existing.items);
        for (const [partId, quantity] of deltas.entries()) {
          const part = await tx.sparePart.findFirst({
            where: { id: partId, workshopId }
          });

          if (part?.stockQuantity != null) {
            await tx.sparePart.update({
              where: { id: partId },
              data: {
                stockQuantity: {
                  increment: quantity
                }
              }
            });
          }
        }
      }

      if (existing.workStatus === "CANCELLED" && input.workStatus !== "CANCELLED") {
        const deltas = getPartItemDeltas(existing.items);
        for (const [partId, quantity] of deltas.entries()) {
          const part = await tx.sparePart.findFirst({
            where: { id: partId, workshopId }
          });

          if (!part) {
            throw new Error("One or more spare parts used in the invoice could not be found.");
          }

          if (part.stockQuantity != null && part.stockQuantity < quantity) {
            throw new Error(`Insufficient stock for ${part.name}. Available: ${part.stockQuantity}, required: ${quantity}.`);
          }

          if (part.stockQuantity != null) {
            await tx.sparePart.update({
              where: { id: partId },
              data: {
                stockQuantity: {
                  decrement: quantity
                }
              }
            });
          }
        }
      }

      await tx.invoice.update({
        where: { id: input.invoiceId },
        data: {
          workStatus: input.workStatus,
          deliveredAt: input.workStatus === "DELIVERED" ? new Date() : null
        }
      });
    });
  }

  revalidatePath("/vehicle-status");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${input.invoiceId}`);
  revalidatePath("/dashboard");
}

export async function getDashboardData() {
  const workshop = await getWorkshop();
  const invoices = await getInvoices();
  const today = new Date().toDateString();
  const todayRevenue = invoices
    .filter((invoice) => invoice.paymentStatus === "PAID" && new Date(invoice.createdAt).toDateString() === today)
    .reduce((sum, invoice) => sum + invoice.amountPaid, 0);
  const byStatus = (status: WorkStatus) => invoices.filter((invoice) => invoice.workStatus === status).length;
  const pendingPayments = invoices
    .filter((invoice) => invoice.paymentStatus !== "PAID")
    .reduce((sum, invoice) => sum + (invoice.grandTotal - invoice.amountPaid), 0);

  return {
    workshop,
    metrics: {
      todayRevenue,
      vehiclesReceived: byStatus("RECEIVED"),
      vehiclesInService: byStatus("IN_SERVICE"),
      readyForDelivery: byStatus("READY_FOR_DELIVERY"),
      deliveredToday: invoices.filter(
        (invoice) => invoice.workStatus === "DELIVERED" && invoice.deliveredAt && new Date(invoice.deliveredAt).toDateString() === today
      ).length,
      pendingPayments,
      totalCustomers: (await getCustomers()).length
    },
    invoices: invoices.slice(0, 6),
    reminders: invoices
      .filter((invoice) => invoice.workStatus === "READY_FOR_DELIVERY" || invoice.workStatus === "IN_SERVICE" || invoice.workStatus === "RECEIVED")
      .slice(0, 3)
      .map((invoice) =>
        buildReminder(invoice, {
          workshopName: workshop.name,
          customerName: invoice.customer.name,
          vehicleNumber: invoice.vehicle.vehicleNumber
        })
      ),
    dueToday: invoices
      .filter((invoice) => invoice.dueDate && new Date(invoice.dueDate).toDateString() === today)
      .slice(0, 5)
      .map((invoice) => ({
        invoiceId: invoice.id,
        customerName: invoice.customer.name,
        vehicleNumber: invoice.vehicle.vehicleNumber,
        dueDate: invoice.dueDate!
      }))
  };
}

export function buildReminder(
  invoice: InvoiceView | (Invoice & { customer?: Customer; vehicle?: Vehicle }),
  deps?: { workshopName: string; customerName: string; vehicleNumber: string }
): Reminder {
  const customerName = deps?.customerName ?? ("customer" in invoice ? invoice.customer?.name : "") ?? "";
  const vehicleNumber = deps?.vehicleNumber ?? ("vehicle" in invoice ? invoice.vehicle?.vehicleNumber : "") ?? "";
  const workshopName = deps?.workshopName ?? "GaragePro";
  return {
    invoiceId: invoice.id,
    customerName,
    vehicleNumber,
    workStatus: invoice.workStatus,
    message: reminderMessage({
      customerName,
      vehicleNumber,
      workshopName,
      workStatus: invoice.workStatus,
      total: invoice.grandTotal
    })
  };
}

export async function getCatalogForTier(tier: PricingTier) {
  const services = (await getServices()).map((service) => ({
    id: service.id,
    type: "SERVICE" as const,
    name: service.name,
    category: service.category,
    unitPrice: getTierPrice(service, tier)
  }));
  const parts = (await getParts()).map((part) => ({
    id: part.id,
    type: "PART" as const,
    name: part.name,
    category: part.category,
    unitPrice: getTierPrice(part, tier)
  }));
  return [...services, ...parts];
}

export async function getMonthlyRevenue() {
  const invoices = await getInvoices();
  const now = new Date();
  return invoices
    .filter((invoice) => {
      const createdAt = new Date(invoice.createdAt);
      return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
    })
    .reduce((sum, invoice) => sum + invoice.amountPaid, 0);
}

export async function getPendingDeliveries() {
  const invoices = await getInvoices();
  return invoices.filter((invoice) => invoice.workStatus !== "DELIVERED" && invoice.workStatus !== "CANCELLED");
}

export async function getReminderHistory() {
  if (!hasDatabase) {
    return getReminderActivities();
  }

  const workshopId = await getActiveWorkshopId();
  const activities = await prisma.reminderActivity.findMany({
    where: { workshopId },
    orderBy: { sentAt: "desc" }
  });

  return activities.map(mapReminderActivity);
}

export async function searchRecords(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return {
      customers: [] as Customer[],
      vehicles: [] as Array<Vehicle & { customerName?: string }>,
      invoices: [] as InvoiceView[]
    };
  }

  const [customers, vehicles, invoices] = await Promise.all([getCustomers(), getVehicles(), getInvoices()]);

  return {
    customers: customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(needle) ||
        customer.phone.toLowerCase().includes(needle) ||
        (customer.email?.toLowerCase().includes(needle) ?? false)
    ),
    vehicles: vehicles.filter(
      (vehicle) =>
        vehicle.vehicleNumber.toLowerCase().includes(needle) ||
        vehicle.brand.toLowerCase().includes(needle) ||
        vehicle.model.toLowerCase().includes(needle) ||
        (vehicle.customer?.name.toLowerCase().includes(needle) ?? false)
    ).map((vehicle) => ({
      ...vehicle,
      customerName: vehicle.customer?.name
    })),
    invoices: invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(needle) ||
        invoice.customer.name.toLowerCase().includes(needle) ||
        invoice.vehicle.vehicleNumber.toLowerCase().includes(needle)
    )
  };
}

export async function createInvoice(input: {
  customerId: string;
  vehicleId: string;
  pricingTier: PricingTier;
  paymentStatus: PaymentStatus;
  paymentMode?: PaymentMode;
  workStatus: WorkStatus;
  discount: number;
  taxPercentage: number;
  notes?: string;
  items: InvoiceItemInput[];
}) {
  const workshop = await getWorkshop();
  const createdAt = new Date().toISOString();

  if (!hasDatabase) {
    const result = await updateStore((store) => {
      const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const taxable = Math.max(subtotal - input.discount, 0);
      const taxAmount = (taxable * input.taxPercentage) / 100;
      const grandTotal = taxable + taxAmount;
      const amountPaid =
        input.paymentStatus === "PAID" ? grandTotal : input.paymentStatus === "PARTIAL" ? grandTotal / 2 : 0;
      const invoiceId = createId("inv");
      const invoice: Invoice = {
        id: invoiceId,
        workshopId: workshop.id,
        customerId: input.customerId,
        vehicleId: input.vehicleId,
        invoiceNumber: invoiceNumberFromCount(workshop.invoicePrefix, store.invoices.length),
        pricingTier: input.pricingTier,
        paymentStatus: input.paymentStatus,
        paymentMode: input.paymentMode,
        workStatus: input.workStatus,
        subtotal,
        discount: input.discount,
        taxPercentage: input.taxPercentage,
        taxAmount,
        grandTotal,
        amountPaid,
        notes: input.notes,
        createdAt,
        dueDate: createdAt
      };

      const items: InvoiceItem[] = input.items.map((item, index) => ({
        id: `${invoiceId}_item_${index + 1}`,
        invoiceId,
        itemType: item.itemType,
        sourceId: item.sourceId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      }));

      applyPartStockDeductionOrThrow(store.spareParts, items);

      store.invoices.unshift(invoice);
      store.invoiceItems.push(...items);
      return invoice;
    });

    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    revalidatePath("/payments");
    revalidatePath("/vehicle-status");
    return result;
  }

  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxable = Math.max(subtotal - input.discount, 0);
  const taxAmount = (taxable * input.taxPercentage) / 100;
  const grandTotal = taxable + taxAmount;
  const amountPaid = input.paymentStatus === "PAID" ? grandTotal : input.paymentStatus === "PARTIAL" ? grandTotal / 2 : 0;
  const workshopId = await getActiveWorkshopId();

  const result = await prisma.$transaction(async (tx) => {
    const [customer, vehicle] = await Promise.all([
      tx.customer.findFirst({
        where: { id: input.customerId, workshopId }
      }),
      tx.vehicle.findFirst({
        where: { id: input.vehicleId, customer: { workshopId } }
      })
    ]);

    if (!customer || !vehicle) {
      throw new Error("Customer or vehicle not found for this workshop.");
    }

    const invoiceCount = await tx.invoice.count({
      where: { workshopId: workshop.id }
    });

    const invoice = await tx.invoice.create({
      data: {
        workshopId: workshop.id,
        customerId: input.customerId,
        vehicleId: input.vehicleId,
        invoiceNumber: invoiceNumberFromCount(workshop.invoicePrefix, invoiceCount),
        pricingTier: input.pricingTier,
        paymentStatus: input.paymentStatus,
        paymentMode: input.paymentMode,
        workStatus: input.workStatus,
        subtotal,
        discount: input.discount,
        taxPercentage: input.taxPercentage,
        taxAmount,
        grandTotal,
        amountPaid,
        notes: input.notes,
        dueDate: new Date()
      }
    });

    if (input.items.length > 0) {
      const deltas = getPartItemDeltas(input.items);
      for (const [partId, quantity] of deltas.entries()) {
        const part = await tx.sparePart.findFirst({
          where: { id: partId, workshopId }
        });

        if (!part) {
          throw new Error("One or more spare parts used in the invoice could not be found.");
        }

        if (part.stockQuantity != null && part.stockQuantity < quantity) {
          throw new Error(`Insufficient stock for ${part.name}. Available: ${part.stockQuantity}, required: ${quantity}.`);
        }
      }

      for (const [partId, quantity] of deltas.entries()) {
        const part = await tx.sparePart.findFirst({
          where: { id: partId, workshopId }
        });

        if (part?.stockQuantity != null) {
          await tx.sparePart.update({
            where: { id: partId },
            data: {
              stockQuantity: {
                decrement: quantity
              }
            }
          });
        }
      }

      await tx.invoiceItem.createMany({
        data: input.items.map((item) => ({
          invoiceId: invoice.id,
          itemType: item.itemType,
          sourceId: item.sourceId,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }))
      });
    }

    return invoice;
  });

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  revalidatePath("/payments");
  revalidatePath("/vehicle-status");
  return mapInvoice(result);
}

export async function sendReminder(input: {
  invoiceId: string;
  channel: "WHATSAPP" | "SMS";
  sentByName: string;
}) {
  const workshop = await getWorkshop();
  const invoice = await getInvoice(input.invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  const reminder = buildReminder(invoice, {
    workshopName: workshop.name,
    customerName: invoice.customer.name,
    vehicleNumber: invoice.vehicle.vehicleNumber
  });
  const customerPhone = normalizePhoneForDispatch(invoice.customer.phone);
  if (!customerPhone) {
    throw new Error("Customer phone number is missing.");
  }

  const activity: ReminderActivity = {
    id: createId("reminder"),
    invoiceId: invoice.id,
    channel: input.channel,
    customerName: reminder.customerName,
    vehicleNumber: reminder.vehicleNumber,
    workStatus: reminder.workStatus,
    message: reminder.message,
    sentAt: new Date().toISOString(),
    sentByName: input.sentByName
  };

  if (!hasDatabase) {
    await appendReminderActivity(activity);
  } else {
    const workshopId = await getActiveWorkshopId();
    const savedActivity = await prisma.reminderActivity.create({
      data: {
        workshopId,
        invoiceId: invoice.id,
        channel: input.channel,
        customerName: reminder.customerName,
        vehicleNumber: reminder.vehicleNumber,
        workStatus: reminder.workStatus,
        message: reminder.message,
        sentAt: new Date(activity.sentAt),
        sentByName: input.sentByName
      }
    });

    activity.id = savedActivity.id;
    activity.sentAt = savedActivity.sentAt.toISOString();
  }

  revalidatePath("/dashboard");
  revalidatePath("/vehicle-status");
  revalidatePath("/reminders");
  return {
    ...activity,
    dispatchUrl: buildReminderDispatchUrl(input.channel, customerPhone, reminder.message)
  };
}
