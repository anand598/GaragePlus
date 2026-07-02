import { NextResponse } from "next/server";
import { canManageBilling, getSession } from "@/lib/auth";
import { getInvoices } from "@/lib/data";

function escapeCsv(value: string | number | undefined) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
    return `"${stringValue.replaceAll("\"", "\"\"")}"`;
  }
  return stringValue;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!canManageBilling(session.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const invoices = await getInvoices();
  const header = [
    "Invoice Number",
    "Customer",
    "Vehicle",
    "Created At",
    "Work Status",
    "Payment Status",
    "Payment Mode",
    "Subtotal",
    "Discount",
    "Tax",
    "Grand Total",
    "Amount Paid"
  ];

  const rows = invoices.map((invoice) => [
    invoice.invoiceNumber,
    invoice.customer.name,
    invoice.vehicle.vehicleNumber,
    invoice.createdAt,
    invoice.workStatus,
    invoice.paymentStatus,
    invoice.paymentMode ?? "",
    invoice.subtotal,
    invoice.discount,
    invoice.taxAmount,
    invoice.grandTotal,
    invoice.amountPaid
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
    .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=garagepro-reports.csv"
    }
  });
}
