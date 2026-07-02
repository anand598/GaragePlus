import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { spawn } from "child_process";

const port = 3015;
const baseUrl = `http://127.0.0.1:${port}`;
const rootDir = process.cwd();
const storePath = path.join(rootDir, "data", "store.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function backupStore() {
  try {
    return await readFile(storePath, "utf8");
  } catch {
    return null;
  }
}

async function restoreStore(snapshot) {
  await mkdir(path.dirname(storePath), { recursive: true });
  if (snapshot == null) {
    await rm(storePath, { force: true });
    return;
  }

  await writeFile(storePath, snapshot, "utf8");
}

async function waitForServer(logs) {
  const timeoutAt = Date.now() + 60_000;

  while (Date.now() < timeoutAt) {
    try {
      const response = await fetch(`${baseUrl}/login`, { redirect: "manual" });
      if (response.status === 200) {
        return;
      }
    } catch {
      // Keep polling until Next finishes booting.
    }

    await sleep(1_000);
  }

  throw new Error(`Timed out waiting for dev server.\n\nRecent logs:\n${logs.slice(-40).join("")}`);
}

async function stopServer(child) {
  if (!child || child.exitCode != null) {
    return;
  }

  child.kill("SIGTERM");
  const timeout = setTimeout(() => {
    if (child.exitCode == null) {
      child.kill("SIGKILL");
    }
  }, 5_000);

  await new Promise((resolve) => child.once("exit", resolve));
  clearTimeout(timeout);
}

async function main() {
  const storeSnapshot = await backupStore();
  const logs = [];
  let cookie = "";
  let server = null;

  try {
    server = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
      cwd: rootDir,
      env: {
        ...process.env,
        DATABASE_URL: "",
        PORT: String(port)
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    server.stdout?.on("data", (chunk) => {
      logs.push(String(chunk));
    });
    server.stderr?.on("data", (chunk) => {
      logs.push(String(chunk));
    });

    await waitForServer(logs);

    async function requestJson(inputPath, init = {}, expectedStatus = 200) {
      const response = await fetch(`${baseUrl}${inputPath}`, {
        ...init,
        headers: {
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
          ...(init.headers ?? {})
        }
      });

      const text = await response.text();
      let payload = {};

      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          throw new Error(`Expected JSON from ${inputPath}, got ${response.status}: ${text.slice(0, 200)}`);
        }
      }

      if (response.status !== expectedStatus) {
        throw new Error(`Expected ${expectedStatus} for ${inputPath}, got ${response.status}: ${text}`);
      }

      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        cookie = setCookie.split(";")[0] ?? cookie;
      }

      return payload;
    }

    await requestJson(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: "owner@garagepro.app",
          password: "password123"
        })
      }
    );

    const me = await requestJson("/api/auth/me");
    assert(me.user?.email === "owner@garagepro.app", "Login session was not established.");

    const customer = await requestJson(
      "/api/customers",
      {
        method: "POST",
        body: JSON.stringify({
          name: "Smoke Test Customer",
          phone: "9000001234",
          email: "smoke@example.com",
          address: "Test Lane"
        })
      },
      201
    );

    const vehicle = await requestJson(
      "/api/vehicles",
      {
        method: "POST",
        body: JSON.stringify({
          customerId: customer.customer.id,
          vehicleNumber: "TS09SMK001",
          brand: "Toyota",
          model: "Glanza",
          year: 2024,
          fuelType: "Petrol",
          odometer: 1500
        })
      },
      201
    );

    const trackedPart = await requestJson(
      "/api/spare-parts",
      {
        method: "POST",
        body: JSON.stringify({
          name: "Smoke Test Tracked Part",
          category: "Consumables",
          brand: "TestBrand",
          partNumber: "SMK-TRK-01",
          unit: "Piece",
          standardPrice: 250,
          premiumPrice: 300,
          luxuryPrice: 350,
          stockQuantity: 5
        })
      },
      201
    );

    const untrackedPart = await requestJson(
      "/api/spare-parts",
      {
        method: "POST",
        body: JSON.stringify({
          name: "Smoke Test Untracked Part",
          category: "Consumables",
          brand: "TestBrand",
          partNumber: "SMK-UNTR-01",
          unit: "Piece",
          standardPrice: 180,
          premiumPrice: 220,
          luxuryPrice: 260,
          stockQuantity: null
        })
      },
      201
    );

    const services = await requestJson("/api/services");
    assert(services.services?.length > 0, "Expected at least one service in fallback seed data.");

    const invoice = await requestJson(
      "/api/invoices",
      {
        method: "POST",
        body: JSON.stringify({
          customerId: customer.customer.id,
          vehicleId: vehicle.vehicle.id,
          pricingTier: "STANDARD",
          paymentStatus: "UNPAID",
          workStatus: "RECEIVED",
          discount: 0,
          taxPercentage: 18,
          notes: "Fallback smoke test invoice",
          items: [
            {
              itemType: "SERVICE",
              sourceId: services.services[0].id,
              name: services.services[0].name,
              quantity: 1,
              unitPrice: 1000
            },
            {
              itemType: "PART",
              sourceId: trackedPart.sparePart.id,
              name: "Smoke Test Tracked Part",
              quantity: 2,
              unitPrice: 250
            },
            {
              itemType: "PART",
              sourceId: untrackedPart.sparePart.id,
              name: "Smoke Test Untracked Part",
              quantity: 3,
              unitPrice: 180
            }
          ]
        })
      },
      201
    );

    const trackedAfterCreate = await requestJson(`/api/spare-parts/${trackedPart.sparePart.id}`);
    const untrackedAfterCreate = await requestJson(`/api/spare-parts/${untrackedPart.sparePart.id}`);
    assert(trackedAfterCreate.sparePart.stockQuantity === 3, "Tracked part stock should decrement after invoice creation.");
    assert(untrackedAfterCreate.sparePart.stockQuantity == null, "Untracked part stock should remain null after invoice creation.");

    const updatedInvoice = await requestJson(
      `/api/invoices/${invoice.invoice.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          customerId: customer.customer.id,
          vehicleId: vehicle.vehicle.id,
          pricingTier: "PREMIUM",
          workStatus: "READY_FOR_DELIVERY",
          discount: 100,
          taxPercentage: 18,
          notes: "Fallback smoke test invoice updated",
          items: [
            {
              itemType: "SERVICE",
              sourceId: services.services[0].id,
              name: services.services[0].name,
              quantity: 1,
              unitPrice: 1250
            },
            {
              itemType: "PART",
              sourceId: trackedPart.sparePart.id,
              name: "Smoke Test Tracked Part",
              quantity: 1,
              unitPrice: 300
            },
            {
              itemType: "PART",
              sourceId: untrackedPart.sparePart.id,
              name: "Smoke Test Untracked Part",
              quantity: 4,
              unitPrice: 220
            }
          ]
        })
      }
    );
    assert(updatedInvoice.invoice.pricingTier === "PREMIUM", "Invoice edit should update pricing tier.");
    assert(updatedInvoice.invoice.workStatus === "READY_FOR_DELIVERY", "Invoice edit should update work status.");

    const trackedAfterEdit = await requestJson(`/api/spare-parts/${trackedPart.sparePart.id}`);
    const untrackedAfterEdit = await requestJson(`/api/spare-parts/${untrackedPart.sparePart.id}`);
    assert(trackedAfterEdit.sparePart.stockQuantity === 4, "Tracked part stock should reconcile after invoice edit.");
    assert(untrackedAfterEdit.sparePart.stockQuantity == null, "Untracked part stock should stay null after invoice edit.");

    await requestJson(
      `/api/invoices/${invoice.invoice.id}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ workStatus: "CANCELLED" })
      }
    );

    const trackedAfterCancel = await requestJson(`/api/spare-parts/${trackedPart.sparePart.id}`);
    assert(trackedAfterCancel.sparePart.stockQuantity === 5, "Tracked part stock should restore when invoice is cancelled.");

    await requestJson(
      `/api/invoices/${invoice.invoice.id}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ workStatus: "IN_SERVICE" })
      }
    );

    const trackedAfterReopen = await requestJson(`/api/spare-parts/${trackedPart.sparePart.id}`);
    assert(trackedAfterReopen.sparePart.stockQuantity === 4, "Tracked part stock should decrement again when a cancelled invoice is reopened.");

    const reminderPreview = await requestJson(
      "/api/reminders/preview",
      {
        method: "POST",
        body: JSON.stringify({ invoiceId: invoice.invoice.id })
      }
    );
    assert(
      reminderPreview.reminder.message.includes("TS09SMK001"),
      "Reminder preview should include the vehicle number."
    );

    const invoicesForCustomer = await requestJson(`/api/customers/${customer.customer.id}/invoices`);
    assert(
      invoicesForCustomer.invoices.some((entry) => entry.id === invoice.invoice.id),
      "Customer invoice history should include the created invoice."
    );

    console.log("Fallback smoke test passed.");
  } finally {
    await stopServer(server);
    await restoreStore(storeSnapshot);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
