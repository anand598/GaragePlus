"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { resetPasswordAction } from "@/app/reset-password/actions";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().min(8, "Confirm your new password.")
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match."
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm({
  token,
  email
}: {
  token: string;
  email: string;
}) {
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
    formData.set("token", token);
    formData.set("password", values.password);
    formData.set("confirmPassword", values.confirmPassword);

    const response = await resetPasswordAction(formData);
    if (response?.error) {
      setError("root", { message: response.error });
    }
  });

  return (
    <form onSubmit={onSubmit} className="panel w-full max-w-lg p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Set New Password</h1>
        <p className="mt-3 text-sm text-slate-600">
          Create a new password for <span className="font-semibold text-slate-900">{email}</span>.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">New Password</label>
          <input type="password" {...register("password")} className="field" />
          {errors.password && <p className="mt-2 text-xs text-rose-600">{errors.password.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</label>
          <input type="password" {...register("confirmPassword")} className="field" />
          {errors.confirmPassword && <p className="mt-2 text-xs text-rose-600">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      {errors.root && <p className="mt-4 text-sm text-rose-600">{errors.root.message}</p>}

      <button type="submit" className="btn-primary mt-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}
