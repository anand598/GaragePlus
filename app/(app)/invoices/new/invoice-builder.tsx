"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createInvoiceAction, updateInvoiceAction } from "@/app/(app)/invoices/new/actions";
import { StatusBadge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

const itemSchema = z.object({
  sourceId: z.string(),
  name: z.string(),
  category: z.string().optional(),
  itemType: z.enum(["SERVICE", "PART"]),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0)
});

const schema = z.object({
  customerId: z.string().min(1),
  vehicleId: z.string().min(1),
  pricingTier: z.enum(["STANDARD", "PREMIUM", "LUXURY"]),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]),
  paymentMode: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER"]).optional(),
  workStatus: z.enum(["RECEIVED", "IN_SERVICE", "READY_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
  discount: z.number().min(0),
  taxPercentage: z.number().min(0),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1)
});

type FormValues = z.infer<typeof schema>;

type InvoiceBuilderCustomer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
};

type InvoiceBuilderVehicle = {
  id: string;
  customerId: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  customerName?: string;
  customerPhone?: string;
};

type InvoiceBuilderCatalogItem = {
  id: string;
  name: string;
  category: string;
  type: "SERVICE" | "PART";
  standardPrice: number;
  premiumPrice: number;
  luxuryPrice: number;
};

type InvoiceBuilderOpenInvoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicleNumber: string;
  paymentStatus: "UNPAID" | "PARTIAL";
  workStatus: "RECEIVED" | "IN_SERVICE" | "READY_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  grandTotal: number;
  amountPaid: number;
};

type InvoiceBuilderMode = "create" | "edit";

function matchesLookup(text: string | undefined, query: string) {
  return (text ?? "").toLowerCase().includes(query);
}

function getTierLabel(tier: FormValues["pricingTier"]) {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

function getWorkStatusLabel(status: FormValues["workStatus"]) {
  return status.replaceAll("_", " ");
}

export function InvoiceBuilder({
  customers,
  vehicles,
  catalog,
  openInvoices = [],
  defaultTax,
  mode = "create",
  invoiceId,
  initialValues,
  initialLookupQuery = "",
  initialCustomerId,
  initialVehicleId,
  amountPaid = 0
}: {
  customers: InvoiceBuilderCustomer[];
  vehicles: InvoiceBuilderVehicle[];
  catalog: InvoiceBuilderCatalogItem[];
  openInvoices?: InvoiceBuilderOpenInvoice[];
  defaultTax: number;
  mode?: InvoiceBuilderMode;
  invoiceId?: string;
  initialValues?: FormValues;
  initialLookupQuery?: string;
  initialCustomerId?: string;
  initialVehicleId?: string;
  amountPaid?: number;
}) {
  const router = useRouter();
  const [selectedCatalogId, setSelectedCatalogId] = useState(initialValues?.items[0]?.sourceId ?? catalog[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [lookupQuery, setLookupQuery] = useState(initialLookupQuery);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? {
      customerId: initialCustomerId ?? "",
      vehicleId: initialVehicleId ?? "",
      pricingTier: "STANDARD",
      paymentStatus: "UNPAID",
      paymentMode: undefined,
      workStatus: "RECEIVED",
      discount: 0,
      taxPercentage: defaultTax,
      notes: "",
      items: []
    }
  });

  const currentItems = watch("items");
  const pricingTier = watch("pricingTier");
  const customerId = watch("customerId");
  const vehicleId = watch("vehicleId");
  const paymentStatus = watch("paymentStatus");
  const paymentMode = watch("paymentMode");
  const subtotal = currentItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = watch("discount") || 0;
  const taxPercentage = watch("taxPercentage") || 0;
  const taxable = Math.max(subtotal - discount, 0);
  const taxAmount = (taxable * taxPercentage) / 100;
  const grandTotal = taxable + taxAmount;
  const balanceDue = Math.max(grandTotal - amountPaid, 0);
  const normalizedLookup = lookupQuery.trim().toLowerCase();

  const customerById = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const vehicleById = useMemo(() => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])), [vehicles]);
  const selectedCustomer = customerId ? customerById.get(customerId) : undefined;
  const selectedVehicle = vehicleId ? vehicleById.get(vehicleId) : undefined;
  const selectedCatalogItem = catalog.find((entry) => entry.id === selectedCatalogId);

  const matchedVehicles = useMemo(
    () =>
      normalizedLookup
        ? vehicles.filter(
            (vehicle) =>
              matchesLookup(vehicle.vehicleNumber, normalizedLookup) ||
              matchesLookup(vehicle.brand, normalizedLookup) ||
              matchesLookup(vehicle.model, normalizedLookup) ||
              matchesLookup(vehicle.customerName, normalizedLookup) ||
              matchesLookup(vehicle.customerPhone, normalizedLookup)
          )
        : [],
    [normalizedLookup, vehicles]
  );

  const matchedCustomerIds = new Set(matchedVehicles.map((vehicle) => vehicle.customerId));
  const matchedVehicleIds = new Set(matchedVehicles.map((vehicle) => vehicle.id));

  const visibleCustomers = useMemo(() => {
    const base = normalizedLookup
      ? customers.filter(
          (customer) =>
            matchesLookup(customer.name, normalizedLookup) ||
            matchesLookup(customer.phone, normalizedLookup) ||
            matchesLookup(customer.email, normalizedLookup) ||
            matchedCustomerIds.has(customer.id)
        )
      : customers;

    if (customerId) {
      const selected = customerById.get(customerId);
      if (selected && !base.some((entry) => entry.id === selected.id)) {
        return [selected, ...base];
      }
    }

    return base;
  }, [normalizedLookup, customers, matchedCustomerIds, customerId, customerById]);

  const visibleOpenInvoices = useMemo(() => {
    if (!normalizedLookup) {
      return [];
    }

    return openInvoices.filter((invoice) => {
      const matchesCustomer = !customerId || invoice.customerId === customerId;
      const matchesVehicle = !vehicleId || invoice.vehicleId === vehicleId;
      const matchesQuery =
        matchesLookup(invoice.invoiceNumber, normalizedLookup) ||
        matchesLookup(invoice.customerName, normalizedLookup) ||
        matchesLookup(invoice.customerPhone, normalizedLookup) ||
        matchesLookup(invoice.vehicleNumber, normalizedLookup) ||
        matchedCustomerIds.has(invoice.customerId) ||
        matchedVehicleIds.has(invoice.vehicleId);

      return matchesCustomer && matchesVehicle && matchesQuery;
    });
  }, [openInvoices, normalizedLookup, customerId, vehicleId, matchedCustomerIds, matchedVehicleIds]);

  const visibleVehicles = useMemo(() => {
    const base = vehicles.filter((vehicle) => {
      const matchesCustomer = !customerId || vehicle.customerId === customerId;
      const matchesQuery =
        !normalizedLookup ||
        matchesLookup(vehicle.vehicleNumber, normalizedLookup) ||
        matchesLookup(vehicle.brand, normalizedLookup) ||
        matchesLookup(vehicle.model, normalizedLookup) ||
        matchesLookup(vehicle.customerName, normalizedLookup) ||
        matchesLookup(vehicle.customerPhone, normalizedLookup);
      return matchesCustomer && matchesQuery;
    });

    if (vehicleId) {
      const selected = vehicleById.get(vehicleId);
      if (selected && !base.some((entry) => entry.id === selected.id)) {
        return [selected, ...base];
      }
    }

    return base;
  }, [vehicles, customerId, normalizedLookup, vehicleId, vehicleById]);

  const applyCustomerSelection = (nextCustomerId: string) => {
    setValue("customerId", nextCustomerId, { shouldValidate: true, shouldDirty: true });
    if (vehicleId) {
      const currentVehicle = vehicleById.get(vehicleId);
      if (currentVehicle?.customerId !== nextCustomerId) {
        setValue("vehicleId", "", { shouldValidate: true, shouldDirty: true });
      }
    }
  };

  const applyVehicleSelection = (nextVehicleId: string) => {
    const vehicle = vehicleById.get(nextVehicleId);
    if (!vehicle) {
      return;
    }

    setValue("customerId", vehicle.customerId, { shouldValidate: true, shouldDirty: true });
    setValue("vehicleId", vehicle.id, { shouldValidate: true, shouldDirty: true });
  };

  const addItem = () => {
    const selected = catalog.find((entry) => entry.id === selectedCatalogId);
    if (!selected) return;

    const unitPrice =
      pricingTier === "PREMIUM"
        ? selected.premiumPrice
        : pricingTier === "LUXURY"
          ? selected.luxuryPrice
          : selected.standardPrice;

    setValue(
      "items",
      [
        ...currentItems,
        {
          sourceId: selected.id,
          name: selected.name,
          category: selected.category,
          itemType: selected.type,
          quantity,
          unitPrice
        }
      ],
      { shouldValidate: true, shouldDirty: true }
    );
  };

  const removeItem = (index: number) => {
    setValue(
      "items",
      currentItems.filter((_, itemIndex) => itemIndex !== index),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  const updateItem = (index: number, field: "quantity" | "unitPrice", value: number) => {
    const nextItems = currentItems.map((item, itemIndex) => {
      if (itemIndex !== index) return item;

      if (field === "quantity") {
        return {
          ...item,
          quantity: Math.max(1, value || 1)
        };
      }

      return {
        ...item,
        unitPrice: Math.max(0, value || 0)
      };
    });

    setValue("items", nextItems, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key !== "items" && value !== undefined) {
        formData.set(key, String(value));
      }
    });
    formData.set("items", JSON.stringify(values.items));
    if (mode === "edit") {
      formData.set("invoiceId", invoiceId ?? "");
    }

    const result = mode === "edit" ? await updateInvoiceAction(formData) : await createInvoiceAction(formData);

    if (result?.error) {
      setError("root", { message: result.error });
      return;
    }

    router.push(`/invoices/${result.id}`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
      <section className="space-y-6">
        <div className="panel p-6 lg:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {mode === "edit" ? "Invoice Lookup & Details" : "Invoice Details"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Find the customer fast, confirm the vehicle, then set pricing and work status in a single flow.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm lg:min-w-[280px]">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pricing tier</p>
                <p className="mt-2 font-semibold text-slate-900">{getTierLabel(pricingTier)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Items added</p>
                <p className="mt-2 font-semibold text-slate-900">{currentItems.length}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                Search Customer / Mobile / Vehicle
              </label>
              <input
                value={lookupQuery}
                onChange={(event) => setLookupQuery(event.target.value)}
                placeholder="Search by customer name, mobile number, or vehicle number"
                className="field"
              />
              <p className="mt-2 text-xs text-slate-500">
                Search results below help you start a new invoice or continue an existing unpaid one.
              </p>
            </div>

            {normalizedLookup && (
              <div className={`grid gap-4 ${mode === "create" ? "2xl:grid-cols-3" : "xl:grid-cols-2"}`}>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-900">Matching Customers</p>
                  <div className="mt-3 space-y-2">
                    {visibleCustomers.slice(0, 5).map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => applyCustomerSelection(customer.id)}
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                      >
                        <span>
                          <span className="block font-medium text-slate-900">{customer.name}</span>
                          <span className="text-sm text-slate-500">{customer.phone}</span>
                        </span>
                        <span className="text-xs font-medium text-blue-600">Use</span>
                      </button>
                    ))}
                    {visibleCustomers.length === 0 && <p className="text-sm text-slate-500">No customer matches found.</p>}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-900">Matching Vehicles</p>
                  <div className="mt-3 space-y-2">
                    {matchedVehicles.slice(0, 5).map((vehicle) => (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => applyVehicleSelection(vehicle.id)}
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                      >
                        <span>
                          <span className="block font-medium text-slate-900">{vehicle.vehicleNumber}</span>
                          <span className="text-sm text-slate-500">
                            {vehicle.customerName} • {vehicle.customerPhone}
                          </span>
                        </span>
                        <span className="text-xs font-medium text-blue-600">Use</span>
                      </button>
                    ))}
                    {matchedVehicles.length === 0 && <p className="text-sm text-slate-500">No vehicle matches found.</p>}
                  </div>
                </div>

                {mode === "create" && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-semibold text-slate-900">Matching Open Invoices</p>
                    <div className="mt-3 space-y-3">
                      {visibleOpenInvoices.slice(0, 5).map((invoice) => (
                        <div key={invoice.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
                              <p className="text-sm text-slate-500">
                                {invoice.customerName} • {invoice.vehicleNumber}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Balance due {formatCurrency(Math.max(invoice.grandTotal - invoice.amountPaid, 0))}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <StatusBadge
                                label={invoice.paymentStatus}
                                tone={invoice.paymentStatus === "PARTIAL" ? "amber" : "red"}
                              />
                              <StatusBadge
                                label={invoice.workStatus.replaceAll("_", " ")}
                                tone={invoice.workStatus === "READY_FOR_DELIVERY" ? "violet" : "slate"}
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex gap-3 text-sm">
                            <Link href={`/invoices/${invoice.id}/edit`} className="font-medium text-blue-600 hover:text-blue-700">
                              Continue Invoice
                            </Link>
                            <Link href={`/invoices/${invoice.id}`} className="font-medium text-slate-600 hover:text-slate-900">
                              View
                            </Link>
                          </div>
                        </div>
                      ))}
                      {visibleOpenInvoices.length === 0 && (
                        <p className="text-sm text-slate-500">No open invoices match this search.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Assignment</p>
                  <p className="mt-1 text-xs text-slate-500">Choose the customer first, then pair the correct vehicle for billing.</p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <select
                    {...register("customerId")}
                    onChange={(event) => applyCustomerSelection(event.target.value)}
                    value={customerId}
                    className="field"
                  >
                    <option value="">Select customer</option>
                    {visibleCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} • {customer.phone}
                      </option>
                    ))}
                  </select>
                  <select
                    {...register("vehicleId")}
                    onChange={(event) => applyVehicleSelection(event.target.value)}
                    value={vehicleId}
                    className="field"
                  >
                    <option value="">Select vehicle</option>
                    {visibleVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleNumber} • {vehicle.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                {(errors.customerId || errors.vehicleId) && (
                  <p className="mt-3 text-sm text-rose-600">Customer and vehicle are required.</p>
                )}

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Selected customer</p>
                    <p className="mt-2 font-medium text-slate-900">{selectedCustomer?.name || "No customer selected"}</p>
                    <p className="text-sm text-slate-500">{selectedCustomer?.phone || "Choose a customer to continue"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Selected vehicle</p>
                    <p className="mt-2 font-medium text-slate-900">{selectedVehicle?.vehicleNumber || "No vehicle selected"}</p>
                    <p className="text-sm text-slate-500">
                      {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Choose a vehicle to continue"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Billing settings</p>
                  <p className="mt-1 text-xs text-slate-500">Control pricing tier, work progress, and payment state for this invoice.</p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <select {...register("pricingTier")} className="field">
                    <option value="STANDARD">Standard</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="LUXURY">Luxury</option>
                  </select>
                  <select {...register("workStatus")} className="field">
                    <option value="RECEIVED">Received</option>
                    <option value="IN_SERVICE">In Service</option>
                    <option value="READY_FOR_DELIVERY">Ready For Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  {mode === "create" ? (
                    <>
                      <select {...register("paymentStatus")} className="field">
                        <option value="UNPAID">Unpaid</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="PAID">Paid</option>
                      </select>
                      <select {...register("paymentMode")} className="field">
                        <option value="">Select payment mode</option>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    </>
                  ) : (
                    <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <p className="font-semibold">Payment Summary</p>
                      <p className="mt-2">
                        Current payment status: <span className="font-medium">{paymentStatus}</span>
                      </p>
                      <p>
                        Amount already paid: <span className="font-medium">{formatCurrency(amountPaid)}</span>
                      </p>
                      <p>
                        Balance due after this edit: <span className="font-medium">{formatCurrency(balanceDue)}</span>
                      </p>
                      <p>
                        Payment mode: <span className="font-medium">{paymentMode || "Not recorded yet"}</span>
                      </p>
                      <p className="mt-2 text-xs">
                        Use the Payments screen to finish collection. Invoice edits remain allowed only until the invoice is fully paid.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel p-6 lg:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Add Services & Spare Parts</h2>
              <p className="mt-1 text-sm text-slate-500">
                Build the invoice one line at a time, then fine-tune billed quantity and final pricing.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current tier</p>
              <p className="mt-2 font-semibold text-slate-900">{getTierLabel(pricingTier)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_140px]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                Service or spare part
              </label>
              <select value={selectedCatalogId} onChange={(event) => setSelectedCatalogId(event.target.value)} className="field">
                {catalog.map((item) => {
                  const unitPrice =
                    pricingTier === "PREMIUM"
                      ? item.premiumPrice
                      : pricingTier === "LUXURY"
                        ? item.luxuryPrice
                        : item.standardPrice;

                  return (
                    <option key={item.id} value={item.id}>
                      {item.name} • {item.type} • {formatCurrency(unitPrice)}
                    </option>
                  );
                })}
              </select>
              {selectedCatalogItem ? (
                <p className="mt-2 text-xs text-slate-500">
                  {selectedCatalogItem.category} • {selectedCatalogItem.type} • priced automatically for the selected tier
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Quantity</label>
              <input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="field" />
            </div>

            <div className="flex items-end">
              <button type="button" className="btn-primary w-full" onClick={addItem}>
                Add Item
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {currentItems.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm text-slate-500">
                Add services or spare parts to build the invoice. You can still adjust quantity and final billed price after each item is added.
              </div>
            )}

            {currentItems.map((item, index) => (
              <div key={`${item.sourceId}-${index}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                      <StatusBadge label={item.itemType} tone={item.itemType === "SERVICE" ? "blue" : "violet"} />
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1">{item.category ?? "General"}</span>
                      <span>Base line total updates automatically as quantity or price changes</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm lg:min-w-[340px]">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Quantity</p>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => updateItem(index, "quantity", Number(event.target.value))}
                        className="field mt-2"
                      />
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Final unit price</p>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(index, "unitPrice", Number(event.target.value))}
                        className="field mt-2"
                      />
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Line total</p>
                      <p className="mt-4 text-lg font-semibold text-slate-900">{formatCurrency(item.quantity * item.unitPrice)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                  <button type="button" className="text-sm font-medium text-rose-600 hover:text-rose-700" onClick={() => removeItem(index)}>
                    Remove item
                  </button>
                </div>
              </div>
            ))}
          </div>

          {errors.items && <p className="mt-3 text-sm text-rose-600">Add at least one service or spare part.</p>}
          {errors.root && <p className="mt-3 text-sm text-rose-600">{errors.root.message}</p>}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="panel p-6">
          <h2 className="text-lg font-semibold text-slate-900">Invoice Summary</h2>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Customer</p>
              <p className="mt-2 font-medium text-slate-900">{selectedCustomer?.name || "Not selected"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Vehicle</p>
              <p className="mt-2 font-medium text-slate-900">{selectedVehicle?.vehicleNumber || "Not selected"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Work status</p>
              <p className="mt-2 font-medium text-slate-900">{getWorkStatusLabel(watch("workStatus"))}</p>
            </div>
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="text-lg font-semibold text-slate-900">Adjustments</h2>
          <p className="mt-1 text-sm text-slate-500">Apply discount, tax, and internal notes before generating the invoice.</p>
          <div className="mt-5 space-y-4">
            <input type="number" step="0.01" {...register("discount", { valueAsNumber: true })} className="field" placeholder="Discount" />
            <input type="number" step="0.01" {...register("taxPercentage", { valueAsNumber: true })} className="field" placeholder="Tax Percentage" />
            <textarea {...register("notes")} className="field min-h-28" placeholder="Notes" />
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="text-lg font-semibold text-slate-900">Totals</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span className="font-medium text-slate-900">{formatCurrency(discount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax</span>
              <span className="font-medium text-slate-900">{formatCurrency(taxAmount)}</span>
            </div>
            {mode === "edit" ? (
              <div className="flex justify-between text-slate-600">
                <span>Already paid</span>
                <span className="font-medium text-slate-900">{formatCurrency(amountPaid)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-semibold">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            {mode === "edit" ? (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Balance due</span>
                <span className="font-semibold text-slate-900">{formatCurrency(balanceDue)}</span>
              </div>
            ) : null}
          </div>

          <button type="submit" className="btn-primary mt-6 w-full" disabled={isSubmitting}>
            {isSubmitting ? (mode === "edit" ? "Updating..." : "Generating...") : mode === "edit" ? "Update Invoice" : "Generate Invoice"}
          </button>

          {mode === "edit" && invoiceId && (
            <Link href={`/invoices/${invoiceId}`} className="btn-secondary mt-3 block text-center">
              Back To Invoice
            </Link>
          )}
        </div>
      </aside>
    </form>
  );
}
