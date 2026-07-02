"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginAction } from "@/app/login/actions";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type FormValues = z.infer<typeof schema>;

export function LoginForm({ resetSuccess = false }: { resetSuccess?: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "owner@garagepro.app",
      password: "password123"
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);
    const result = await loginAction(formData);
    if (result?.error) {
      setError("root", { message: result.error });
    }
  });

  return (
    <form onSubmit={onSubmit} className="panel w-full max-w-md p-8">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-heading)] text-4xl font-semibold text-slate-900">GaragePro</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to manage billing, service status, and customer history.</p>
      </div>

      {resetSuccess && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Password updated successfully. Sign in with your new password.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
          <input {...register("email")} className="field" />
          {errors.email && <p className="mt-2 text-xs text-rose-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
          <input type="password" {...register("password")} className="field" />
          {errors.password && <p className="mt-2 text-xs text-rose-600">{errors.password.message}</p>}
        </div>
      </div>

      {errors.root && <p className="mt-4 text-sm text-rose-600">{errors.root.message}</p>}

      <button type="submit" className="btn-primary mt-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Login"}
      </button>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-slate-500 hover:text-blue-600">
          Forgot password?
        </Link>
        <Link href="/register" className="text-slate-500 hover:text-blue-600">
          Register owner
        </Link>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        Demo login: <span className="font-semibold">owner@garagepro.app</span> / <span className="font-semibold">password123</span>
      </div>
    </form>
  );
}
