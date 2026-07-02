"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { requestPasswordResetAction } from "@/app/forgot-password/actions";

const schema = z.object({
  email: z.string().email("Enter a valid email address.")
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const [result, setResult] = useState<{
    message: string;
    resetPath: string | null;
    expiresAt: string | null;
  } | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    setResult(null);

    const formData = new FormData();
    formData.set("email", values.email);

    const response = await requestPasswordResetAction(formData);
    if (response?.error) {
      setError("root", { message: response.error });
      return;
    }

    setResult({
      message: response.message ?? "If an account exists for this email, a password reset link is ready.",
      resetPath: response.resetPath ?? null,
      expiresAt: response.expiresAt ?? null
    });
  });

  return (
    <form onSubmit={onSubmit} className="panel w-full max-w-lg p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Forgot Password</h1>
        <p className="mt-3 text-sm text-slate-600">
          Enter the owner or staff email used for login. GaragePro will generate a secure one-time reset link.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input {...register("email")} className="field" placeholder="owner@garagepro.app" />
        {errors.email && <p className="mt-2 text-xs text-rose-600">{errors.email.message}</p>}
      </div>

      {errors.root && <p className="mt-4 text-sm text-rose-600">{errors.root.message}</p>}

      {result && (
        <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-slate-700">
          <p>{result.message}</p>
          {result.resetPath ? (
            <>
              <p className="mt-3 text-slate-600">Development reset link. In production, this would be sent by email or SMS.</p>
              <Link href={result.resetPath} className="btn-primary mt-4">
                Open Reset Link
              </Link>
              <p className="mt-3 text-xs text-slate-500">Link expires at {new Date(result.expiresAt ?? "").toLocaleString()}.</p>
            </>
          ) : (
            <p className="mt-3 text-slate-600">No further action is needed here.</p>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/login" className="text-sm text-slate-500 hover:text-blue-600">
          Back to login
        </Link>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Generating..." : "Generate Reset Link"}
        </button>
      </div>
    </form>
  );
}
