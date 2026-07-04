import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { InvoiceActivity } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const invoiceActivityLogPath = path.join(dataDir, "invoice-activity-log.json");

async function ensureInvoiceActivityLog() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(invoiceActivityLogPath, "utf8");
  } catch {
    await writeFile(invoiceActivityLogPath, "[]", "utf8");
  }
}

export async function getInvoiceActivities() {
  await ensureInvoiceActivityLog();
  const content = await readFile(invoiceActivityLogPath, "utf8");
  return JSON.parse(content) as InvoiceActivity[];
}

export async function appendInvoiceActivity(activity: InvoiceActivity) {
  const activities = await getInvoiceActivities();
  activities.unshift(activity);
  await writeFile(invoiceActivityLogPath, JSON.stringify(activities, null, 2), "utf8");
}
