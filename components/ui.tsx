import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("panel", className)}>{children}</section>;
}

export function SectionHeading({
  title,
  action
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {action ? <div className="text-sm text-slate-500 sm:text-right">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({
  label,
  tone = "slate"
}: {
  label: string;
  tone?: "blue" | "green" | "amber" | "red" | "slate" | "violet";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
    violet: "bg-violet-50 text-violet-700"
  };

  return <span className={cn("rounded-full px-3 py-1 text-xs font-medium tracking-[0.02em]", styles[tone])}>{label}</span>;
}

export function ActionFeedbackBanner({
  status,
  message
}: {
  status?: string;
  message?: string;
}) {
  if (!status || !message) {
    return null;
  }

  const isSuccess = status === "success";
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      )}
    >
      {message}
    </div>
  );
}
