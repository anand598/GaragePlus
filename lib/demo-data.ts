import { Customer, Invoice, InvoiceItem, Reminder, Service, SparePart, User, Vehicle, Workshop } from "@/lib/types";

export const demoWorkshop: Workshop = {
  id: "workshop_1",
  name: "ABC Motors",
  phone: "+91 98765 43210",
  email: "hello@abcmotors.in",
  address: "Hitech City, Hyderabad, Telangana",
  gstNumber: "36ABCDE1234F1Z8",
  invoicePrefix: "INV-2026",
  taxPercentage: 18,
  businessHours: "Mon-Sat, 9:00 AM - 7:00 PM"
};

export const demoUsers: User[] = [
  {
    id: "user_owner",
    workshopId: "workshop_1",
    name: "Garage Owner",
    email: "owner@garagepro.app",
    passwordHash: "$2a$10$U5vmZ2SVbjQY6BKkutlfbO/WOT9PgugeA0fgSZb4KX45misWpvyqO",
    role: "OWNER"
  }
];

export const demoCustomers: Customer[] = [
  { id: "cust_1", workshopId: "workshop_1", name: "Ramesh", phone: "9876543210", email: "ramesh@example.com", address: "Kukatpally", createdAt: "2026-06-24T10:00:00.000Z" },
  { id: "cust_2", workshopId: "workshop_1", name: "Kumar", phone: "9876500001", email: "kumar@example.com", address: "Miyapur", createdAt: "2026-06-22T09:00:00.000Z" },
  { id: "cust_3", workshopId: "workshop_1", name: "Suresh", phone: "9876500002", email: "suresh@example.com", address: "Ameerpet", createdAt: "2026-06-20T12:00:00.000Z" },
  { id: "cust_4", workshopId: "workshop_1", name: "Mahesh", phone: "9876500003", email: "mahesh@example.com", address: "Gachibowli", createdAt: "2026-06-18T12:00:00.000Z" },
  { id: "cust_5", workshopId: "workshop_1", name: "Ravi", phone: "9876500004", email: "ravi@example.com", address: "Kondapur", createdAt: "2026-06-17T12:00:00.000Z" }
];

export const demoVehicles: Vehicle[] = [
  { id: "veh_1", customerId: "cust_1", vehicleNumber: "TS09AB1234", brand: "Hyundai", model: "i20", year: 2022, fuelType: "Petrol", odometer: 28000 },
  { id: "veh_2", customerId: "cust_2", vehicleNumber: "TS08CD5678", brand: "Maruti", model: "Baleno", year: 2020, fuelType: "Petrol", odometer: 42000 },
  { id: "veh_3", customerId: "cust_3", vehicleNumber: "TS07EF9999", brand: "Honda", model: "City", year: 2021, fuelType: "Petrol", odometer: 31500 },
  { id: "veh_4", customerId: "cust_4", vehicleNumber: "TS10GH1111", brand: "Tata", model: "Nexon", year: 2023, fuelType: "Diesel", odometer: 13000 },
  { id: "veh_5", customerId: "cust_5", vehicleNumber: "TS09IJ2222", brand: "Kia", model: "Seltos", year: 2024, fuelType: "Petrol", odometer: 9000 }
];

export const demoServices: Service[] = [
  { id: "svc_1", workshopId: "workshop_1", name: "Periodic Service", category: "Maintenance", description: "Oil, filter, and health check", estimatedTime: "4 Hours", standardPrice: 2500, premiumPrice: 4200, luxuryPrice: 6500, isActive: true },
  { id: "svc_2", workshopId: "workshop_1", name: "Brake Service", category: "Repair", description: "Brake cleaning and pad replacement", estimatedTime: "2 Hours", standardPrice: 1800, premiumPrice: 3200, luxuryPrice: 5200, isActive: true },
  { id: "svc_3", workshopId: "workshop_1", name: "AC Service", category: "Maintenance", description: "Cooling system inspection", estimatedTime: "3 Hours", standardPrice: 2200, premiumPrice: 3700, luxuryPrice: 5400, isActive: true }
];

export const demoParts: SparePart[] = [
  { id: "part_1", workshopId: "workshop_1", name: "Engine Oil", category: "Lubricants", brand: "Castrol", partNumber: "EO-5W30", unit: "Litre", standardPrice: 850, premiumPrice: 1200, luxuryPrice: 1650, stockQuantity: 24, isActive: true },
  { id: "part_2", workshopId: "workshop_1", name: "Oil Filter", category: "Filters", brand: "Bosch", partNumber: "OF-202", unit: "Piece", standardPrice: 350, premiumPrice: 480, luxuryPrice: 700, stockQuantity: 16, isActive: true },
  { id: "part_3", workshopId: "workshop_1", name: "Brake Pads", category: "Brakes", brand: "TVS", partNumber: "BP-991", unit: "Set", standardPrice: 1800, premiumPrice: 2400, luxuryPrice: 3200, stockQuantity: null, isActive: true }
];

export const demoInvoices: Invoice[] = [
  { id: "inv_1", workshopId: "workshop_1", customerId: "cust_1", vehicleId: "veh_1", invoiceNumber: "INV-2026-1056", pricingTier: "STANDARD", paymentStatus: "PAID", paymentMode: "UPI", workStatus: "IN_SERVICE", subtotal: 3850, discount: 200, taxPercentage: 18, taxAmount: 657, grandTotal: 4307, amountPaid: 4307, createdAt: "2026-06-30T08:15:00.000Z", dueDate: "2026-06-30T17:00:00.000Z" },
  { id: "inv_2", workshopId: "workshop_1", customerId: "cust_2", vehicleId: "veh_2", invoiceNumber: "INV-2026-1055", pricingTier: "PREMIUM", paymentStatus: "UNPAID", workStatus: "READY_FOR_DELIVERY", subtotal: 6800, discount: 0, taxPercentage: 18, taxAmount: 1224, grandTotal: 8024, amountPaid: 0, createdAt: "2026-06-30T07:00:00.000Z", dueDate: "2026-06-30T18:30:00.000Z" },
  { id: "inv_3", workshopId: "workshop_1", customerId: "cust_3", vehicleId: "veh_3", invoiceNumber: "INV-2026-1054", pricingTier: "STANDARD", paymentStatus: "PAID", paymentMode: "CASH", workStatus: "DELIVERED", subtotal: 3450, discount: 0, taxPercentage: 18, taxAmount: 621, grandTotal: 4071, amountPaid: 4071, createdAt: "2026-06-29T11:00:00.000Z", deliveredAt: "2026-06-30T10:30:00.000Z" },
  { id: "inv_4", workshopId: "workshop_1", customerId: "cust_4", vehicleId: "veh_4", invoiceNumber: "INV-2026-1053", pricingTier: "PREMIUM", paymentStatus: "PAID", paymentMode: "CARD", workStatus: "IN_SERVICE", subtotal: 5600, discount: 0, taxPercentage: 18, taxAmount: 1008, grandTotal: 6608, amountPaid: 6608, createdAt: "2026-06-29T09:30:00.000Z" },
  { id: "inv_5", workshopId: "workshop_1", customerId: "cust_5", vehicleId: "veh_5", invoiceNumber: "INV-2026-1052", pricingTier: "STANDARD", paymentStatus: "UNPAID", workStatus: "RECEIVED", subtotal: 2150, discount: 0, taxPercentage: 18, taxAmount: 387, grandTotal: 2537, amountPaid: 0, createdAt: "2026-06-28T16:20:00.000Z" }
];

export const demoInvoiceItems: InvoiceItem[] = [
  { id: "item_1", invoiceId: "inv_1", itemType: "SERVICE", sourceId: "svc_1", name: "Periodic Service", category: "Maintenance", quantity: 1, unitPrice: 2500, totalPrice: 2500 },
  { id: "item_2", invoiceId: "inv_1", itemType: "PART", sourceId: "part_1", name: "Engine Oil", category: "Lubricants", quantity: 1, unitPrice: 850, totalPrice: 850 },
  { id: "item_3", invoiceId: "inv_1", itemType: "PART", sourceId: "part_2", name: "Oil Filter", category: "Filters", quantity: 1, unitPrice: 500, totalPrice: 500 },
  { id: "item_4", invoiceId: "inv_2", itemType: "SERVICE", sourceId: "svc_2", name: "Brake Service", category: "Repair", quantity: 1, unitPrice: 3200, totalPrice: 3200 },
  { id: "item_5", invoiceId: "inv_2", itemType: "PART", sourceId: "part_3", name: "Brake Pads", category: "Brakes", quantity: 1, unitPrice: 2400, totalPrice: 2400 },
  { id: "item_6", invoiceId: "inv_2", itemType: "SERVICE", sourceId: "svc_3", name: "AC Service", category: "Maintenance", quantity: 1, unitPrice: 1200, totalPrice: 1200 }
];

export const demoReminders: Reminder[] = [
  {
    invoiceId: "inv_2",
    customerName: "Kumar",
    vehicleNumber: "TS08CD5678",
    workStatus: "READY_FOR_DELIVERY",
    message: "Hi Kumar, your vehicle TS08CD5678 is ready for delivery. Total amount: Rs 8,024."
  },
  {
    invoiceId: "inv_1",
    customerName: "Ramesh",
    vehicleNumber: "TS09AB1234",
    workStatus: "IN_SERVICE",
    message: "Hi Ramesh, your vehicle TS09AB1234 is currently under service."
  },
  {
    invoiceId: "inv_5",
    customerName: "Ravi",
    vehicleNumber: "TS09IJ2222",
    workStatus: "RECEIVED",
    message: "Hi Ravi, your vehicle TS09IJ2222 has been received at ABC Motors."
  }
];
