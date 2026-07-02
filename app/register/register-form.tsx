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
    <form onSubmit={onSubmit} className="panel w-full max-w-2xl p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold text-slate-900">Register Workshop Owner</h1>
        <p className="mt-2 text-sm text-slate-500">Create an owner account and initialize a workshop profile.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input {...register("ownerName")} placeholder="Owner Name" className="field" />
        <input {...register("workshopName")} placeholder="Workshop Name" className="field" />
        <input {...register("email")} placeholder="Email" className="field" />
        <input {...register("phone")} placeholder="Phone" className="field" />
        <input {...register("address")} placeholder="Address" className="field md:col-span-2" />
        <input type="password" {...register("password")} placeholder="Password" className="field md:col-span-2" />
      </div>

      {(errors.root || Object.keys(errors).length > 0) && (
        <div className="mt-4 text-sm text-rose-600">
          {errors.root?.message ?? "Please review the form fields."}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/login" className="text-sm text-slate-500 hover:text-blue-600">
          Back to login
        </Link>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Owner Account"}
        </button>
      </div>
    </form>
  );
}
