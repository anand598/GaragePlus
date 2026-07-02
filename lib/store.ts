import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  demoCustomers,
  demoInvoiceItems,
  demoInvoices,
  demoParts,
  demoServices,
  demoUsers,
  demoVehicles,
  demoWorkshop
} from "@/lib/demo-data";
import type { AppStore } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");

function createSeedStore(): AppStore {
  return {
    workshop: demoWorkshop,
    users: demoUsers,
    passwordResetTokens: [],
    customers: demoCustomers,
    vehicles: demoVehicles,
    services: demoServices,
    spareParts: demoParts,
    invoices: demoInvoices,
    invoiceItems: demoInvoiceItems
  };
}

export async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, JSON.stringify(createSeedStore(), null, 2), "utf8");
  }
}

export async function readStore() {
  await ensureStore();
  const content = await readFile(storePath, "utf8");
  const parsed = JSON.parse(content) as Partial<AppStore>;
  return {
    workshop: parsed.workshop ?? demoWorkshop,
    users: parsed.users ?? demoUsers,
    passwordResetTokens: parsed.passwordResetTokens ?? [],
    customers: parsed.customers ?? demoCustomers,
    vehicles: parsed.vehicles ?? demoVehicles,
    services: parsed.services ?? demoServices,
    spareParts: parsed.spareParts ?? demoParts,
    invoices: parsed.invoices ?? demoInvoices,
    invoiceItems: parsed.invoiceItems ?? demoInvoiceItems
  };
}

export async function writeStore(store: AppStore) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function updateStore<T>(updater: (store: AppStore) => T | Promise<T>) {
  const store = await readStore();
  const result = await updater(store);
  await writeStore(store);
  return result;
}
