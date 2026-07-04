export type Role = "OWNER" | "MANAGER" | "CASHIER" | "STAFF";
export type PricingTier = "STANDARD" | "PREMIUM" | "LUXURY";
export type PaymentStatus = "PAID" | "UNPAID" | "PARTIAL";
export type PaymentMode = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
export type WorkStatus = "RECEIVED" | "IN_SERVICE" | "READY_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

export interface Workshop {
  id: string;
  name: string;
  logoUrl?: string;
  phone: string;
  email: string;
  address: string;
  gstNumber?: string;
  invoicePrefix: string;
  taxPercentage: number;
  paymentQrCode?: string;
  businessHours?: string;
}

export interface User {
  id: string;
  workshopId: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
}

export interface Customer {
  id: string;
  workshopId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  year?: number;
  fuelType?: string;
  odometer?: number;
}

export interface Service {
  id: string;
  workshopId: string;
  name: string;
  category: string;
  description?: string;
  estimatedTime?: string;
  standardPrice: number;
  premiumPrice: number;
  luxuryPrice: number;
  isActive: boolean;
}

export interface SparePart {
  id: string;
  workshopId: string;
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
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemType: "SERVICE" | "PART";
  sourceId?: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  workshopId: string;
  customerId: string;
  vehicleId: string;
  invoiceNumber: string;
  pricingTier: PricingTier;
  paymentStatus: PaymentStatus;
  paymentMode?: PaymentMode;
  workStatus: WorkStatus;
  subtotal: number;
  discount: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  notes?: string;
  dueDate?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface Reminder {
  invoiceId: string;
  customerName: string;
  vehicleNumber: string;
  workStatus: WorkStatus;
  message: string;
}

export interface ReminderActivity {
  id: string;
  invoiceId: string;
  channel: "WHATSAPP" | "SMS";
  customerName: string;
  vehicleNumber: string;
  workStatus: WorkStatus;
  message: string;
  sentAt: string;
  sentByName?: string;
}

export interface InvoiceActivity {
  id: string;
  invoiceId: string;
  action: "CREATED" | "UPDATED" | "PAYMENT_UPDATED" | "WORK_STATUS_UPDATED";
  details: string;
  createdAt: string;
  actorName?: string;
}

export interface AppStore {
  workshop: Workshop;
  users: User[];
  passwordResetTokens: PasswordResetToken[];
  customers: Customer[];
  vehicles: Vehicle[];
  services: Service[];
  spareParts: SparePart[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
}
