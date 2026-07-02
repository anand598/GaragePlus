import { Bell, CarFront } from "lucide-react";
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
      <div className="grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="panel overflow-hidden bg-[linear-gradient(180deg,#183252_0%,#122742_100%)] p-6 text-white">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500">
              <CarFront className="h-7 w-7" />
            </div>
            <div>
              <div className="text-3xl font-semibold">GaragePro</div>
              <p className="text-sm text-slate-300">Management System</p>
            </div>
          </div>

          <SidebarNav />

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/8 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-600">
                <CarFront className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">{workshop.name}</p>
                <p className="text-sm text-slate-300">{workshop.address}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">{session.name} • {session.role}</p>
            <form action="/logout" method="post" className="mt-4">
              <button className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                Logout
              </button>
            </form>
          </div>
        </aside>

        <main className="panel overflow-hidden">
          <header className="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Garage Operations</h1>
              <p className="text-sm text-slate-500">Billing, work tracking, and customer history in one place.</p>
            </div>
            <div className="flex items-center gap-3">
              <form action="/search" className="flex">
                <input
                  name="q"
                  placeholder="Search by customer, vehicle, invoice..."
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500 outline-none focus:border-blue-400"
                />
              </form>
              <Link href="/reminders" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-500">
                <Bell className="h-5 w-5" />
              </Link>
              <Link href="/users" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                {session.role}
              </Link>
            </div>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
