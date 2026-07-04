import { Bell, CarFront, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getWorkshop } from "@/lib/data";
import { SidebarNav } from "@/components/sidebar-nav";

export async function AppShell({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const workshop = await getWorkshop();

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="panel relative overflow-hidden bg-[linear-gradient(180deg,#173154_0%,#11233d_55%,#0d1b30_100%)] p-6 text-white">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_70%)]" />

          <div className="relative mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 shadow-[0_12px_24px_rgba(59,130,246,0.35)]">
              <CarFront className="h-7 w-7" />
            </div>
            <div>
              <div className="text-3xl font-semibold">GaragePro</div>
              <p className="text-sm text-slate-300">Management System</p>
            </div>
          </div>

          <div className="relative">
            <SidebarNav />
          </div>

          <div className="relative mt-8 rounded-3xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-600">
                <CarFront className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">{workshop.name}</p>
                <p className="text-sm text-slate-300">{workshop.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <ShieldCheck className="h-4 w-4 text-blue-200" />
              <span>{session.name} • {session.role}</span>
            </div>
            <form action="/logout" method="post" className="mt-4">
              <button className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                Logout
              </button>
            </form>
          </div>
        </aside>

        <main className="panel overflow-hidden bg-white/85">
          <header className="flex flex-col gap-4 border-b border-slate-200/80 bg-white/75 px-6 py-5 backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Garage Operations</h1>
              <p className="text-sm text-slate-500">Billing, work tracking, and customer history in one place.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form action="/search" className="relative min-w-0 flex-1 sm:w-[360px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="q"
                  placeholder="Search by customer, vehicle, invoice..."
                  className="field pl-11"
                />
              </form>
              <Link
                href="/reminders"
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-700"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link
                href="/users"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                  {session.role.slice(0, 1)}
                </span>
                {session.role}
              </Link>
            </div>
          </header>
          <div className="bg-[linear-gradient(180deg,rgba(248,250,252,0.78)_0%,rgba(255,255,255,0.96)_28%,rgba(255,255,255,1)_100%)] p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
