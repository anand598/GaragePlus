"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CarFront, ClipboardList, CreditCard, Gauge, Package, Receipt, Settings, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: Gauge }]
  },
  {
    title: "Masters",
    items: [
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/vehicles", label: "Vehicles", icon: CarFront },
      { href: "/services", label: "Services", icon: Wrench },
      { href: "/parts", label: "Spare Parts", icon: Package }
    ]
  },
  {
    title: "Operations",
    items: [
      { href: "/invoices/new", label: "New Invoice", icon: Receipt },
      { href: "/vehicle-status", label: "Vehicle Status", icon: ClipboardList },
      { href: "/payments", label: "Payments", icon: CreditCard },
      { href: "/reports", label: "Reports", icon: BarChart3 }
    ]
  },
  {
    title: "Settings",
    items: [
      { href: "/settings", label: "Workshop Setup", icon: Settings },
      { href: "/users", label: "Users & Roles", icon: Users }
    ]
  }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-7">
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="mb-3 px-2 text-[11px] uppercase tracking-[0.24em] text-slate-400/90">{group.title}</p>
          <div className="space-y-1.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition duration-200",
                    active
                      ? "bg-white text-blue-700 shadow-[0_16px_30px_rgba(15,23,42,0.18)]"
                      : "text-slate-200 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition duration-200",
                      active ? "bg-blue-50 text-blue-600" : "bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
