"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createInvoiceAction } from "@/app/(app)/invoices/new/actions";
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

export function InvoiceBuilder({
  customers,
  vehicles,
  catalog,
  defaultTax
}: {
  customers: Array<{ id: string; name: string }>;
  vehicles: Array<{ id: string; customerId: string; vehicleNumber: string }>;
  catalog: Array<{
    id: string;
    name: string;
    category: string;
    type: "SERVICE" | "PART";
    standardPrice: number;
    premiumPrice: number;
    luxuryPrice: number;
  }>;
  defaultTax: number;
}) {
  const router = useRouter();
  const [selectedCatalogId, setSelectedCatalogId] = useState(catalog[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pricingTier: "STANDARD",
      paymentStatus: "UNPAID",
      workStatus: "RECEIVED",
      discount: 0,
      taxPercentage: defaultTax,
      items: []
    }
  });

  const currentItems = watch("items");
  const pricingTier = watch("pricingTier");
  const customerId = watch("customerId");
  const subtotal = currentItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = watch("discount") || 0;
  const taxPercentage = watch("taxPercentage") || 0;
  const taxable = Math.max(subtotal - discount, 0);
  const taxAmount = (taxable * taxPercentage) / 100;
  const grandTotal = taxable + taxAmount;

  const addItem = () => {
    const selected = catalog.find((entry) => entry.id === selectedCatalogId);
    if (!selected) return;
    const unitPrice =
      pricingTier === "PREMIUM"
        ? selected.premiumPrice
        : pricingTier === "LUXURY"
          ? selected.luxuryPrice
          : selected.standardPrice;
    setValue("items", [
      ...currentItems,
      {
        sourceId: selected.id,
        name: selected.name,
        category: selected.category,
        itemType: selected.type,
        quantity,
        unitPrice
      }
    ], { shouldValidate: true, shouldDirty: true });
  };

  const removeItem = (index: number) => {
    setValue(
      "items",
      currentItems.filter((_, itemIndex) => itemIndex !== index),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  const updateItem = (
    index: number,
    field: "quantity" | "unitPrice",
    value: number
  ) => {
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
    const result = await createInvoiceAction(formData);
    if (result?.error) {
      setError("root", { message: result.error });
      return;
    }
    router.push(`/invoices/${result.id}`);
    router.refresh();
  });

  const availableVehicles = vehicles.filter((vehicle) => !customerId || vehicle.customerId === customerId);

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-6">
        <div className="panel p-6">
          <h2 className="text-lg font-semibold">Invoice Details</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <select {...register("customerId")} className="field">
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <select {...register("vehicleId")} className="field">
              <option value="">Select vehicle</option>
              {availableVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicleNumber}</option>)}
            </select>
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
          </div>
          {(errors.customerId || errors.vehicleId) && <p className="mt-3 text-sm text-rose-600">Customer and vehicle are required.</p>}
        </div>

        <div className="panel p-6">
          <h2 className="text-lg font-semibold">Add Services & Spare Parts</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-[1.3fr_0.4fr_0.3fr]">
            <select value={selectedCatalogId} onChange={(event) => setSelectedCatalogId(event.target.value)} className="field">
              {catalog.map((item) => {
                const unitPrice =
                  pricingTier === "PREMIUM"
                    ? item.premiumPrice
                    : pricingTier === "LUXURY"
                      ? item.luxuryPrice
                      : item.standardPrice;
                return <option key={item.id} value={item.id}>{item.name} • {item.type} • {formatCurrency(unitPrice)}</option>;
              })}
            </select>
            <input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="field" />
            <button type="button" className="btn-secondary" onClick={addItem}>Add</button>
          </div>

          <div className="mt-5 space-y-3">
            {currentItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Add services or spare parts to build the invoice. You can adjust quantity and final billed price for each line after adding it.
              </div>
            )}
            {currentItems.map((item, index) => (
              <div key={`${item.sourceId}-${index}`} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.itemType} • {item.category ?? "General"}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[120px_160px_auto]">
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                        Qty
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => updateItem(index, "quantity", Number(event.target.value))}
                        className="field"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                        Final Unit Price
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(index, "unitPrice", Number(event.target.value))}
                        className="field"
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                        <p className="text-slate-500">Line Total</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatCurrency(item.quantity * item.unitPrice)}</p>
                      </div>
                      <button type="button" className="text-sm text-rose-600" onClick={() => removeItem(index)}>
                        Remove
                      </button>
                    </div>
                  </div>
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
          <h2 className="text-lg font-semibold">Adjustments</h2>
          <div className="mt-5 space-y-4">
            <input type="number" step="0.01" {...register("discount", { valueAsNumber: true })} className="field" placeholder="Discount" />
            <input type="number" step="0.01" {...register("taxPercentage", { valueAsNumber: true })} className="field" placeholder="Tax Percentage" />
            <textarea {...register("notes")} className="field min-h-28" placeholder="Notes" />
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="text-lg font-semibold">Totals</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>{formatCurrency(discount)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(taxAmount)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-semibold"><span>Grand Total</span><span>{formatCurrency(grandTotal)}</span></div>
          </div>
          <button type="submit" className="btn-primary mt-6 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Generating..." : "Generate Invoice"}
          </button>
        </div>
      </aside>
    </form>
  );
}
