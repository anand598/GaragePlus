import { CarFront, Receipt, ShieldCheck, Users, Wrench } from "lucide-react";
import { RegisterForm } from "@/app/register/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#edf4ff_0%,#f8fbff_48%,#eefcf5_100%)] px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1400px] items-center gap-8 lg:grid-cols-[0.95fr_0.8fr]">
        <section className="hidden lg:block">
          <div className="rounded-[2rem] bg-[linear-gradient(160deg,#183c67_0%,#112845_100%)] p-10 text-white shadow-panel">
            <div className="max-w-xl">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 shadow-[0_14px_24px_rgba(59,130,246,0.28)]">
                  <Wrench className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold">Launch a New Workshop</h2>
                  <p className="text-slate-300">Set up billing, customer records, vehicle tracking, and role-based access in one place.</p>
                </div>
              </div>

              <div className="grid gap-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Owner-first setup",
                    copy: "Create the workshop owner account first, then invite managers, cashiers, and service staff."
                  },
                  {
                    icon: Receipt,
                    title: "Ready for invoicing",
                    copy: "Start with services, spare parts, customers, and vehicles already structured for daily billing."
                  },
                  {
                    icon: CarFront,
                    title: "Vehicle lifecycle flow",
                    copy: "Track received, in-service, ready-for-delivery, and billed vehicles from a single workspace."
                  },
                  {
                    icon: Users,
                    title: "Built for repeat customers",
                    copy: "Keep customer and vehicle history connected so every return visit is faster to handle."
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.06] px-5 py-4">
                      <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-blue-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-300">{item.copy}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { label: "Owner setup", value: "1 Step" },
                  { label: "Pricing tiers", value: "3" },
                  { label: "Workshop ready", value: "Fast" }
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <RegisterForm />
        </section>
      </div>
    </main>
  );
}
