import { Wrench } from "lucide-react";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;

  return (
    <main className="grid min-h-screen bg-[linear-gradient(135deg,#eaf3ff_0%,#f8fbff_35%,#ecfff5_100%)] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden p-10 lg:flex">
        <div className="flex w-full flex-col justify-between rounded-[2rem] bg-[linear-gradient(160deg,#143a63_0%,#0f2340_100%)] p-10 text-white shadow-panel">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500">
              <Wrench className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold">Workshop Control Center</h2>
              <p className="text-slate-300">Operations, customer history, service pricing, and invoicing in one flow.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Role-based access for owner, manager, cashier, and staff",
              "Three-tier pricing for services and spare parts",
              "Dashboard metrics, reminders, and due deliveries",
              "Invoice history, reports, and workshop setup"
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center p-6 lg:p-12">
        <LoginForm resetSuccess={reset === "success"} />
      </section>
    </main>
  );
}
