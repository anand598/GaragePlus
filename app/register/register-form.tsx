"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerOwnerAction } from "@/app/register/actions";

const schema = z.object({
  ownerName: z.string().min(2),
  workshopName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(5),
  password: z.string().min(8)
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = handleSubmit(async (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, value));
    const result = await registerOwnerAction(formData);
    if (result?.error) {
      setError("root", { message: result.error });
    }
  });

  return (
    <form onSubmit={onSubmit} className="panel w-full max-w-[620px] p-8 lg:p-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Create Workshop</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">Register Workshop Owner</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          Create the owner account and workshop profile first. You can add staff, services, spare parts, and customers after sign-in.
        </p>
      </div>

      <div className="grid gap-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Owner account</p>
            <p className="mt-1 text-xs text-slate-500">These details will be used to sign in and manage the workshop.</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input {...register("ownerName")} placeholder="Owner Name" className="field" />
            <input {...register("email")} placeholder="Email" className="field" />
            <input {...register("phone")} placeholder="Phone" className="field" />
            <input type="password" {...register("password")} placeholder="Password" className="field" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Workshop profile</p>
            <p className="mt-1 text-xs text-slate-500">Add the business name and address exactly as your team and customers use them.</p>
          </div>
          <div className="mt-4 grid gap-3">
            <input {...register("workshopName")} placeholder="Workshop Name" className="field" />
            <input {...register("address")} placeholder="Address" className="field" />
          </div>
        </div>
      </div>

      {(errors.root || Object.keys(errors).length > 0) && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errors.root?.message ?? "Please review the form fields."}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/login" className="text-sm text-slate-500 hover:text-blue-600">
          Back to login
        </Link>
        <button type="submit" className="btn-primary min-w-48" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Owner Account"}
        </button>
      </div>
    </form>
  );
}
