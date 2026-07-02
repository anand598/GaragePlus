import Link from "next/link";
import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";
import { getPasswordResetTokenDetails } from "@/lib/data";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const reset = token ? await getPasswordResetTokenDetails(token) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f0f7ff_0%,#ffffff_45%,#ecfff5_100%)] p-6">
      {reset ? (
        <ResetPasswordForm token={token} email={reset.email} />
      ) : (
        <div className="panel w-full max-w-lg p-8">
          <h1 className="text-3xl font-semibold text-slate-900">Reset Link Expired</h1>
          <p className="mt-3 text-sm text-slate-600">
            This password reset link is invalid, already used, or has expired.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/forgot-password" className="btn-primary">
              Request New Link
            </Link>
            <Link href="/login" className="btn-secondary">
              Back to Login
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
